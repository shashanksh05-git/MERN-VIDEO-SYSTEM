import React, { useState } from "react";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";

const RegionOtpModal = () => {
  const { pendingOtp, verifyRegionOtp, requestOtpWithPhone, authLoading } =
    useUser();

  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");

  if (!pendingOtp) return null;

  const isSms = pendingOtp.method === "sms";

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) {
      alert("Please enter mobile number");
      return;
    }

    let finalPhone = phone.trim();

    if (!finalPhone.startsWith("+")) {
      finalPhone = `+91${finalPhone}`;
    }

    await requestOtpWithPhone(finalPhone);
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      alert("Please enter OTP");
      return;
    }

    await verifyRegionOtp(otp);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-border">
        <h2 className="text-xl font-bold">Region Based OTP Verification</h2>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <b>Detected State:</b> {pendingOtp.state}
          </p>
          <p>
            <b>Detected City:</b> {pendingOtp.city}
          </p>
          <p>
            <b>Applied Theme:</b> {pendingOtp.theme}
          </p>
          <p>
            <b>OTP Method:</b> {isSms ? "Mobile OTP" : "Email OTP"}
          </p>
        </div>

        {pendingOtp.phoneRequired ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are outside South India, so mobile OTP is required.
            </p>

            <input
              type="text"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-border bg-background text-foreground rounded-md px-3 py-2"
            />

            <Button
              className="w-full"
              onClick={handleSendPhoneOtp}
              disabled={authLoading}
            >
              {authLoading ? "Sending..." : "Send Mobile OTP"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              OTP has been sent to your{" "}
              {isSms ? "registered mobile number" : "registered email"}.
            </p>

            {pendingOtp?.demoOtp && (
              <div className="rounded-lg border border-yellow-500 bg-yellow-100 px-3 py-2 text-sm text-yellow-900">
                Demo OTP: <b>{pendingOtp.demoOtp}</b>
              </div>
            )}

            <input
              type="text"
              placeholder="Enter 6 digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-border bg-background text-foreground rounded-md px-3 py-2"
              maxLength={6}
            />

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={authLoading}
            >
              {authLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <p className="text-xs text-muted-foreground">
              If SMS provider is not configured, demo OTP will be shown above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionOtpModal;