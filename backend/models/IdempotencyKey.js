const mongoose = require("mongoose");

const IdempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    userId: { type: String, required: true },

    requestHash: { type: String, required: true },

    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "IN_PROGRESS",
    },

    responseStatus: Number,
    responseHeaders: Object,
    responseBody: {
        type: mongoose.Schema.Types.Mixed,
        default: undefined,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

IdempotencyKeySchema.index(
  { key: 1, method: 1, path: 1, userId: 1,createdAt: -1,_id: -1 },
  { unique: true },
);

// ✅ TTL auto delete
IdempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("IdempotencyKey", IdempotencyKeySchema);
