import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import users from "../Modals/Auth.js";
import sendInvoiceEmail from "../utils/sendInvoiceEmail.js";

dotenv.config();

const PLAN_CONFIG = {
  bronze: {
    name: "Bronze",
    amount: 10,
    watchLimitSeconds: 7 * 60,
    watchLimitText: "7 minutes",
  },
  silver: {
    name: "Silver",
    amount: 50,
    watchLimitSeconds: 10 * 60,
    watchLimitText: "10 minutes",
  },
  gold: {
    name: "Gold",
    amount: 100,
    watchLimitSeconds: 0,
    watchLimitText: "Unlimited",
  },
};

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing in server/.env");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const getPlans = async (req, res) => {
  return res.status(200).json({
    free: {
      name: "Free",
      amount: 0,
      watchLimitSeconds: 5 * 60,
      watchLimitText: "5 minutes",
    },
    bronze: PLAN_CONFIG.bronze,
    silver: PLAN_CONFIG.silver,
    gold: PLAN_CONFIG.gold,
  });
};

export const createPlanOrder = async (req, res) => {
  const { userId, plan } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ message: "User ID and plan are required" });
  }

  const selectedPlan = PLAN_CONFIG[plan];

  if (!selectedPlan) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `${plan}_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    return res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      order,
      plan,
      planDetails: selectedPlan,
    });
  } catch (error) {
    console.log("Create plan order error:", error.message);
    return res.status(500).json({
      message: error.message || "Plan order creation failed",
    });
  }
};

export const verifyPlanPayment = async (req, res) => {
  const {
    userId,
    plan,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !userId ||
    !plan ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({ message: "Payment details missing" });
  }

  const selectedPlan = PLAN_CONFIG[plan];

  if (!selectedPlan) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        $set: {
          isPremium: true,
          currentPlan: plan,
          watchLimitSeconds: selectedPlan.watchLimitSeconds,
          planAmount: selectedPlan.amount,
          premiumSince: new Date(),
          premiumPaymentId: razorpay_payment_id,
          lastPlanOrderId: razorpay_order_id,
          lastPlanPaymentId: razorpay_payment_id,
          planUpgradedAt: new Date(),
        },
      },
      { new: true }
    );

    if (updatedUser?.email) {
      await sendInvoiceEmail({
        to: updatedUser.email,
        userName: updatedUser.name,
        planName: selectedPlan.name,
        amount: selectedPlan.amount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        watchLimit: selectedPlan.watchLimitText,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${selectedPlan.name} plan activated successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.log("Verify plan payment error:", error.message);
    return res.status(500).json({
      message: error.message || "Plan payment verification failed",
    });
  }
};

export const activateDemoPlan = async (req, res) => {
  const { userId, plan } = req.body;

  if (!userId || !plan) {
    return res.status(400).json({ message: "User ID and plan are required" });
  }

  const selectedPlan = PLAN_CONFIG[plan];

  if (!selectedPlan) {
    return res.status(400).json({ message: "Invalid plan selected" });
  }

  try {
    const demoPaymentId = `demo_${plan}_${Date.now()}`;
    const demoOrderId = `demo_order_${Date.now()}`;

    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        $set: {
          isPremium: true,
          currentPlan: plan,
          watchLimitSeconds: selectedPlan.watchLimitSeconds,
          planAmount: selectedPlan.amount,
          premiumSince: new Date(),
          premiumPaymentId: demoPaymentId,
          lastPlanOrderId: demoOrderId,
          lastPlanPaymentId: demoPaymentId,
          planUpgradedAt: new Date(),
        },
      },
      { new: true }
    );

    if (updatedUser?.email) {
      await sendInvoiceEmail({
        to: updatedUser.email,
        userName: updatedUser.name,
        planName: selectedPlan.name,
        amount: selectedPlan.amount,
        paymentId: demoPaymentId,
        orderId: demoOrderId,
        watchLimit: selectedPlan.watchLimitText,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${selectedPlan.name} demo plan activated`,
      user: updatedUser,
    });
  } catch (error) {
    console.log("Demo plan error:", error.message);
    return res.status(500).json({ message: "Demo plan activation failed" });
  }
};