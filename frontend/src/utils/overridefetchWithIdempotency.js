// overrideFetch.js
const cache = new Map();

export function overrideFetchWithIdempotency() {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();

    // only apply for unsafe methods
    const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    if (!unsafe) return originalFetch(url, options);

    // only apply for /api/*
    const urlString = typeof url === "string" ? url : url?.url || "";
    // if (!urlString.startsWith("/api/")) {
    //   return originalFetch(url, options);
    // }
    const aiRoutes = [
      "/idea/submitidea",
      "/idea/getsuggestions",
      "/idea/getfeedback",
      "/idea/updateidea",
      "/idea/deleteidea",
      "/idea/deletealluserideas"
    ];
    if (aiRoutes.some(route => urlString.includes(route))) {
      return originalFetch(url, options);
    }
    const body = options.body || "";

    // fingerprint (same request retry)
    const fingerprint = `${method}:${urlString}:${
      typeof body === "string" ? body : JSON.stringify(body)
    }`;

    const now = Date.now();
    const cached = cache.get(fingerprint);

    // reuse key within 30s
    const key =
      cached && now - cached.time < 30_000 ? cached.key : crypto.randomUUID();

    cache.set(fingerprint, { key, time: now });

    // ✅ safe headers handling
    const headers = new Headers(options.headers || {});
    headers.set("Idempotency-Key", key);

    try {
      const res = await originalFetch(url, {
        ...options,
        headers,
      });

      // clear on success
      if (res.ok) cache.delete(fingerprint);

      return res;
    } catch (err) {
      // keep key on network error
      throw err;
    }
  };
}
