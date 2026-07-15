import crypto from "crypto";
import users from "../Modals/Auth.js";
import otpModel from "../Modals/otp.js";
import sendOtpEmail from "../utils/sendOtpEmail.js";
import sendOtpSms from "../utils/sendOtpSms.js";

const SOUTH_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
];

const normalizeState = (state = "") => {
  return state.trim().toLowerCase();
};

const isSouthIndiaState = (state = "") => {
  return SOUTH_STATES.some(
    (southState) => normalizeState(southState) === normalizeState(state)
  );
};

const getISTHour = () => {
  const istTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
  });

  return Number(istTime);
};

const getThemeByLocationAndTime = (state) => {
  const hour = getISTHour();
  const isSouth = isSouthIndiaState(state);

  if (isSouth && hour >= 10 && hour < 12) {
    return "light";
  }

  return "dark";
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const getLocationFromLatLon = async (lat, lon) => {
  try {
    if (!lat || !lon) {
      return {
        state: "Unknown",
        city: "Unknown",
      };
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Streamify-Region-Auth",
      },
    });

    const data = await response.json();

    const state = data?.address?.state || "Unknown";

    const city =
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.village ||
      data?.address?.county ||
      "Unknown";

    return { state, city };
  } catch (error) {
    console.log("Location fetch error:", error.message);
    return {
      state: "Unknown",
      city: "Unknown",
    };
  }
};

export const requestRegionOtp = async (req, res) => {
  const { userId, lat, lon, phone } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const user = await users.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const location = await getLocationFromLatLon(lat, lon);
    const state = location.state;
    const city = location.city;

    const southUser = isSouthIndiaState(state);
    const theme = getThemeByLocationAndTime(state);

    const method = southUser ? "email" : "sms";
    const destination = method === "email" ? user.email : phone || user.phone;

    if (method === "sms" && !destination) {
      return res.status(200).json({
        otpRequired: true,
        phoneRequired: true,
        method,
        theme,
        state,
        city,
        message: "Mobile number required for OTP verification",
      });
    }

    if (method === "sms" && phone) {
      user.phone = phone;
      await user.save();
    }

    const otp = generateOtp();

    await otpModel.deleteMany({
      userId,
      verified: false,
    });

    const otpDoc = await otpModel.create({
      userId,
      otpHash: hashOtp(otp),
      method,
      destination,
      state,
      city,
      theme,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (method === "email") {
      await sendOtpEmail({
        to: destination,
        otp,
        userName: user.name,
      });
    } else {
      await sendOtpSms({
        phone: destination,
        otp,
      });
    }

    return res.status(200).json({
  otpRequired: true,
  phoneRequired: false,
  otpId: otpDoc._id,
  method,
  theme,
  state,
  city,
  demoOtp: process.env.DEMO_OTP === "true" ? otp : undefined,
  message:
    method === "email"
      ? "OTP sent to registered email"
      : "OTP sent to registered mobile number",
});

  } catch (error) {
    console.log("Request region OTP error:", error);
    return res.status(500).json({ message: "OTP request failed" });
  }
};

export const verifyRegionOtp = async (req, res) => {
  const { otpId, otp, userId } = req.body;

  if (!otpId || !otp || !userId) {
    return res.status(400).json({
      message: "OTP ID, OTP, and user ID are required",
    });
  }

  try {
    const otpDoc = await otpModel.findOne({
      _id: otpId,
      userId,
      verified: false,
    });

    if (!otpDoc) {
      return res.status(404).json({ message: "OTP not found or already used" });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otpDoc.attempts >= 5) {
      return res.status(429).json({ message: "Too many wrong attempts" });
    }

    const enteredHash = hashOtp(otp);

    if (enteredHash !== otpDoc.otpHash) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpDoc.verified = true;
    await otpDoc.save();

    const user = await users.findById(userId);

    return res.status(200).json({
  message: "OTP verified successfully",
  user,
  theme: otpDoc.theme,
  state: otpDoc.state,
  city: otpDoc.city,
});

  } catch (error) {
    console.log("Verify region OTP error:", error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};