const mongoose = require("mongoose");

module.exports = function paginate(model, options = {}) {
  const {
    sortField = "createdAt",
    sortOrder = -1,
    select = null,
    populate = null,
    filter = (req) => ({}),
    mode = "cursor",
    maxLimit = 100,
    cursorField = "_id", // tie breaker
  } = options;

  return async function (req, res, next) {
    try {
      let limit = parseInt(req.query.limit || "10", 10);
      if (isNaN(limit) || limit <= 0) limit = 10;
      if (limit > maxLimit) limit = maxLimit;

      const paginationMode = req.query.mode || mode;
      let queryFilter = filter(req) || {};

      // -------------------------
      // OFFSET PAGINATION
      // -------------------------
      if (paginationMode === "offset") {
        const page = parseInt(req.query.page || "1", 10);
        const safePage = isNaN(page) || page <= 0 ? 1 : page;
        const skip = (safePage - 1) * limit;

        let q = model
          .find(queryFilter)
          .sort({ [sortField]: sortOrder, [cursorField]: sortOrder });

        if (select) q = q.select(select);
        if (populate) q = q.populate(populate);

        const data = await q.skip(skip).limit(limit);
        const total = await model.countDocuments(queryFilter);

        res.paginatedResult = {
          paginationType: "offset",
          page: safePage,
          limit,
          total,
          data,
        };
        return next();
      }

      // -------------------------
      // CURSOR PAGINATION (Stable: sortField + _id)
      // Cursor format example: "2026-01-20T10:30:00.000Z|65a9c...."
      // -------------------------
      const cursor = req.query.cursor;

      if (cursor) {
        const [dateStr, idStr] = String(cursor).split("|");

        // validate date + id
        const cursorDate = new Date(dateStr);
        const isValidDate = !isNaN(cursorDate.getTime());
        const isValidId = mongoose.Types.ObjectId.isValid(idStr);

        if (isValidDate && isValidId) {
          queryFilter = {
            ...queryFilter,
            $or: [
              { [sortField]: { $lt: cursorDate } },
              {
                [sortField]: cursorDate,
                [cursorField]: { $lt: new mongoose.Types.ObjectId(idStr) },
              },
            ],
          };
        }
      }

      // ✅ deterministic stable sort ALWAYS
      let q = model
        .find(queryFilter)
        .sort({ [sortField]: sortOrder, [cursorField]: sortOrder })
        .limit(limit);

      if (select) q = q.select(select);
      if (populate) q = q.populate(populate);

      const data = await q;

      // ✅ build nextCursor from last item (must match sort fields)
      let nextCursor = null;
      if (data.length > 0) {
        const last = data[data.length - 1];

        // if sortField is a Date (createdAt) — best case
        const lastDate = last[sortField];
        const lastId = last[cursorField];

        nextCursor = `${new Date(lastDate).toISOString()}|${lastId}`;
      }

      res.paginatedResult = {
        paginationType: "cursor",
        limit,
        nextCursor,
        data,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};
