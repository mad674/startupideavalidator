const crypto = require("crypto");
const IdempotencyKey = require("../models/IdempotencyKey");
const dotenv = require('dotenv');
dotenv.config();
// ✅ stable stringify so hash is consistent
function stableStringify(obj) {
  if (!obj || typeof obj !== "object") return JSON.stringify(obj);

  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(obj)
    .sort()
    .map((k) => `"${k}":${stableStringify(obj[k])}`)
    .join(",")}}`;
}

function createRequestHash(req) {
  const payload = {
    body: req.body || {},
    query: req.query || {},
    // ✅ DO NOT rely on req.params globally (sometimes not ready)
  };

  return crypto
    .createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
}

function isUnsafeMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

// ✅ Customize based on your auth
function getUserId(req) {
  // ✅ Strong preference: authenticated user ID
  if (req.user?.id) return String(req.user.id);

  // ✅ If client supplies its own stable identity (use carefully)
  if (req.headers["x-user-id"]) return String(req.headers["x-user-id"]);

  // ✅ fallback: scope to client IP (avoids everyone sharing "anonymous")
  return String(req.ip || "unknown-ip");
}

function pickHeaders(headers) {
  // ✅ store only safe headers
  const allow = ["content-type"];
  const saved = {};

  for (const key of allow) {
    if (headers[key]) saved[key] = headers[key];
  }

  return saved;
}


async function waitForCompletion({ key, userId, method, path }, timeoutMs = 30000, pollMs = 200) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const doc = await IdempotencyKey.findOne({ key, userId, method, path });

    if (!doc) return null;

    if (doc.status === "COMPLETED") {
      return {
        status: doc.responseStatus || 200,
        body: doc.responseBody,
      };
    }

    if (doc.status === "FAILED") {
      return {
        status: doc.responseStatus || 500,
        body: doc.responseBody || { error: "Request failed" },
      };
    }

    // still IN_PROGRESS → wait and retry
    await new Promise((r) => setTimeout(r, pollMs));
  }

  // timeout reached
  return {
    status: 408,
    body: { error: "Request still in progress, timeout waiting" },
  };
}

function idempotencyMiddleware({
  ttlMs = 60 * 60 * 1000, // 1 hour
  enforce = false, // if true, missing key => 400 for unsafe methods
  headerName = "idempotency-key",

  // ✅ safer default than originalUrl
  useOriginalUrl = false, // false => req.path, true => req.originalUrl

  // ✅ "Stripe-style" wait strategy
  // waitForCompletion = true,
  waitTimeoutMs = Number(process.env.WAIT_TIMEOUT_MS ?? 50000),
  waitIntervalMs = Number(process.env.WAIT_INTERVAL_MS ?? 2000),

  // ✅ protect Mongo from massive response bodies
  maxResponseBodyBytes = 50 * 1024, // 50kb
} = {}) {
  return async function (req, res, next) {
    let record = null;

    try {
      // ✅ Skip safe methods
      if (!isUnsafeMethod(req.method)) return next();

      // const key = req.headers[headerName];
      const key = req.headers[String(headerName).toLowerCase()];


      // ✅ Missing key
      if (!key) {
        if (enforce) {
          return res.status(400).json({ error: "Missing Idempotency-Key" });
        }
        return next();
      }

      const userId = getUserId(req);
      const method = req.method;
      const path = useOriginalUrl ? req.originalUrl : req.path;
      const skipRoutes = [
            "/idea/getsuggestions",
            "/idea/getfeedback"
      ];

      if (skipRoutes.some(route => path.includes(route))) {
          return next();
      }
      const requestHash = createRequestHash(req);
      
      // ✅ 1) Check if record exists
      const existing = await IdempotencyKey.findOne({
        key,
        userId,
        method,
        path,
      });

      if (existing) {
        // ✅ Idempotency key reused with different payload => reject
        if (existing.requestHash !== requestHash) {
          return res.status(409).json({
            error: "Idempotency-Key reused with different request payload",
          });
        }

        // ✅ Completed: replay response
        if (existing.status === "COMPLETED") {
          if (existing.responseHeaders) {
            for (const [h, v] of Object.entries(existing.responseHeaders)) {
              res.setHeader(h, v);
            }
          }

          return res.status(existing.responseStatus).json(existing.responseBody);
        }

        // ✅ Still running: wait strategy (better UX than raw 409)
        if (existing.status === "IN_PROGRESS") {
          const result = await waitForCompletion(
            { key, userId, method, path },
            waitTimeoutMs,
            waitIntervalMs
          );
          return res.status(result.status).json(result.body);

        }

        // ✅ failed: allow retry by removing old record
        if (existing.status === "FAILED") {
          await IdempotencyKey.deleteOne({ _id: existing._id });
        }
      }

      // ✅ 2) Create IN_PROGRESS record (race-condition safe)
      try {
        record = await IdempotencyKey.create({
          key,
          userId,
          method,
          path,
          requestHash,
          status: "IN_PROGRESS",
          expiresAt: new Date(Date.now() + ttlMs),
        });
      } catch (err) {
        // Duplicate insert => another request won
        if (err.code === 11000) {
          const again = await IdempotencyKey.findOne({
            key,
            userId,
            method,
            path,
          });

          if (again?.status === "COMPLETED") {
            return res.status(again.responseStatus).json(again.responseBody);
          }
          const result = await waitForCompletion(
            { key, userId, method, path },
            waitTimeoutMs,
            waitIntervalMs
          );
          return res.status(result.status).json(result.body);
        }

        throw err;
      }

      // ✅ 3) Capture + persist response safely (WITHOUT async res.json)
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      function normalizeBody(body) {
        try {
            // ✅ if already object/array -> store as-is
            if (body !== null && typeof body === "object") {
            const json = JSON.stringify(body);
            if (Buffer.byteLength(json, "utf8") > maxResponseBodyBytes) {
                return { message: "Response too large to store for idempotency." };
            }
            return body;
            }

            // ✅ if string, try parse it into JSON
            if (typeof body === "string") {
            try {
                const parsed = JSON.parse(body);

                const json = JSON.stringify(parsed);
                if (Buffer.byteLength(json, "utf8") > maxResponseBodyBytes) {
                return { message: "Response too large to store for idempotency." };
                }

                return parsed; // ✅ store parsed JSON not string
            } catch {
                // ✅ plain string response -> store in JSON wrapper
                const json = JSON.stringify({ message: body });
                if (Buffer.byteLength(json, "utf8") > maxResponseBodyBytes) {
                return { message: "Response too large to store for idempotency." };
                }
                return { message: body };
            }
            }

            // ✅ numbers / booleans / undefined -> wrap into JSON
            const wrapped = { value: body };
            const json = JSON.stringify(wrapped);
            if (Buffer.byteLength(json, "utf8") > maxResponseBodyBytes) {
            return { message: "Response too large to store for idempotency." };
            }
            return wrapped;
        } catch {
            return { message: "Response could not be stored safely." };
        }
        }


      function saveSuccess(body) {
        const safeBody = normalizeBody(body);

        return IdempotencyKey.updateOne(
          { _id: record._id },
          {
            $set: {
              status: "COMPLETED",
              responseStatus: res.statusCode,
              responseHeaders: pickHeaders(res.getHeaders()),
              responseBody: safeBody,
            },
          }
        );
      }

      function saveFailure(errorMessage) {
        return IdempotencyKey.updateOne(
          { _id: record._id },
          {
            $set: {
              status: "FAILED",
              responseStatus: 500,
              responseBody: { error: errorMessage || "Request failed" },
            },
          }
        );
      }

      // ✅ IMPORTANT: do NOT make these async
      res.json = function(body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          saveSuccess(body).catch(() => {});
        }
        return originalJson(body);
      };

      res.send = function (body) {
        saveSuccess(body).catch(() => {});
        return originalSend(body);
      };

      // ✅ If server responds >=500 and still IN_PROGRESS => FAILED
      res.on("finish", () => {
        if (!record) return;
        if (res.statusCode >= 500) {
          IdempotencyKey.findById(record._id)
            .then((latest) => {
              if (latest?.status === "IN_PROGRESS") {
                return saveFailure("Server error");
              }
            })
            .catch(() => {});
        }
      });

      // ✅ Continue to route
      return next();
    } catch (err) {
      // ✅ If middleware inserted record but route crashes BEFORE sending response
      if (record?._id) {
        try {
          await IdempotencyKey.updateOne(
            { _id: record._id },
            {
              $set: {
                status: "FAILED",
                responseStatus: 500,
                responseBody: { error: "Unhandled server error" },
              },
            }
          );
        } catch {}
      }

      return next(err);
    }
  };
}

module.exports = { idempotencyMiddleware };
