import nodemailer from "nodemailer";

const sendOtpEmail = async ({ to, otp, userName }) => {
  try {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.log("SMTP missing. Email OTP for demo:", otp);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "Streamify Login OTP Verification",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;padding:20px;border-radius:10px;">
          <h2>Streamify Login Verification</h2>
          <p>Hello ${userName || "User"},</p>
          <p>Your OTP for login verification is:</p>
          <h1 style="letter-spacing:4px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p style="font-size:13px;color:#666;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log("Email OTP sent successfully");
  } catch (error) {
    console.log("Email OTP error:", error.message);
    console.log("Email OTP for demo:", otp);
  }
};

export default sendOtpEmail;