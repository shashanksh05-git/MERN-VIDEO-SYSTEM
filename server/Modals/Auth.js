import mongoose from "mongoose";

const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },

  isPremium: { type: Boolean, default: false },

  currentPlan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },

  watchLimitSeconds: {
    type: Number,
    default: 300,
  },

  planAmount: {
    type: Number,
    default: 0,
  },

  premiumSince: { type: Date },
  premiumPaymentId: { type: String },

  lastPlanOrderId: { type: String },
  lastPlanPaymentId: { type: String },
  planUpgradedAt: { type: Date },

  joinedon: { type: Date, default: Date.now },
});

export default mongoose.model("user", userschema);