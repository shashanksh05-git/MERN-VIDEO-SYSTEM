const sendOtpSms = async ({ phone, otp }) => {
  try {
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.log("Twilio missing. SMS OTP for demo:", otp);
      return;
    }

    const twilioModule = await import("twilio");
    const twilio = twilioModule.default;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: `Your Streamify login OTP is ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log("SMS OTP sent successfully");
  } catch (error) {
    console.log("SMS OTP error:", error.message);
    console.log("SMS OTP for demo:", otp);
  }
};

export default sendOtpSms;