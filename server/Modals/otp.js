import mongoose from "mongoose";

const otpSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },

    destination: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      default: "Unknown",
    },

    city: {
      type: String,
      default: "Unknown",
    },

    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "dark",
    },

    verified: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("otp", otpSchema);