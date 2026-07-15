import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import users from "../Modals/Auth.js";

dotenv.config();

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing in server/.env");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createPremiumOrder = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "User ID is required" });
  }

  try {
    const razorpay = getRazorpayInstance();
    const amount = Number(process.env.PREMIUM_AMOUNT || 99);

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `premium_${Date.now()}`,
      notes: {
        userId,
        plan: "premium",
      },
    });

    return res.status(200).json({
      order,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
    });
  } catch (error) {
    console.error("Create premium order error:", error.message);
    return res.status(500).json({
      message: error.message || "Payment order failed",
    });
  }
};

export const verifyPremiumPayment = async (req, res) => {
  const {
    userId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !userId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({ message: "Payment details missing" });
  }

  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret key is missing in server/.env");
    }

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
          premiumSince: new Date(),
          premiumPaymentId: razorpay_payment_id,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Premium activated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Verify premium payment error:", error.message);
    return res.status(500).json({
      message: error.message || "Payment verification failed",
    });
  }
};

export const activateDemoPremium = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        $set: {
          isPremium: true,
          premiumSince: new Date(),
          premiumPaymentId: "demo_test_payment",
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Demo premium error:", error);
    return res.status(500).json({ message: "Demo premium failed" });
  }
};