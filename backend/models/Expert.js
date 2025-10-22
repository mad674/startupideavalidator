const mongoose = require("mongoose");

const expertSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    expertise: { type: String, default: "General" },
    bio: { type: String, default: "" },
    otp:Number,
    otpExpiresAt:Date,
    // Array of connected ideas
    ideas: [
      {
        ideaid: { type: mongoose.Schema.Types.ObjectId, ref: "Idea" },
        chathistory: [
          {
            sender: { type: String, enum: ["expert", "user"], required: true },
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// ✅ Fix: check if model already exists before compiling
module.exports =mongoose.models.Expert || mongoose.model("Expert", expertSchema);
