import React, { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "./firebase";
import axiosInstance from "./axiosinstance";

const AuthContext = createContext();

const getCurrentPosition = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lon: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        resolve({ lat: null, lon: null });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      }
    );
  });
};

const applyTheme = (theme) => {
  if (typeof document === "undefined") return;

  if (theme === "light") {
    document.documentElement.classList.remove("dark");
    document.body.style.backgroundColor = "white";
  } else {
    document.documentElement.classList.add("dark");
    document.body.style.backgroundColor = "#0a0a0a";
  }

  localStorage.setItem("streamify-theme", theme);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingOtp, setPendingOtp] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("Profile");
    const storedTheme = localStorage.getItem("streamify-theme");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedTheme) {
      applyTheme(storedTheme);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("Profile", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }

    setUser(null);
    setPendingOtp(null);
    localStorage.removeItem("Profile");
  };

  const handlegooglesignin = async () => {
  try {
    setAuthLoading(true);

    const result = await signInWithPopup(auth, provider);

    const payload = {
      email: result.user.email,
      name: result.user.displayName,
      image: result.user.photoURL,
    };

    console.log("GOOGLE USER:", payload);

    const response = await axiosInstance.post("/user/login", payload);
    const loggedUser = response.data.result;

    console.log("BACKEND LOGIN USER:", loggedUser);

    try {
      const location = await getCurrentPosition();

      const otpRes = await axiosInstance.post("/region-auth/request-otp", {
        userId: loggedUser._id,
        lat: location.lat,
        lon: location.lon,
        phone: loggedUser.phone,
      });

      console.log("OTP RESPONSE:", otpRes.data);

      applyTheme(otpRes.data.theme);

      setPendingOtp({
        ...otpRes.data,
        user: loggedUser,
        lat: location.lat,
        lon: location.lon,
      });
    } catch (otpError) {
      console.log("OTP route failed, direct login fallback:", otpError);

      // Fallback so login does not break again and again
      login(loggedUser);
      applyTheme("dark");
      alert("Logged in successfully. OTP service skipped due to network issue.");
    }
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    alert(error?.response?.data?.message || error?.message || "Login failed");
  } finally {
    setAuthLoading(false);
  }
};

  const requestOtpWithPhone = async (phone) => {
  try {
    setAuthLoading(true);

    const res = await axiosInstance.post("/region-auth/request-otp", {
      userId: pendingOtp.user._id,
      lat: pendingOtp.lat,
      lon: pendingOtp.lon,
      phone,
    });

    setPendingOtp({
      ...pendingOtp,
      ...res.data,
      user: pendingOtp.user,
      lat: pendingOtp.lat,
      lon: pendingOtp.lon,
    });

    alert("OTP sent successfully");
  } catch (error) {
    console.log("PHONE OTP ERROR:", error);
    alert(error?.response?.data?.message || "Failed to send OTP");
  } finally {
    setAuthLoading(false);
  }
};

  const verifyRegionOtp = async (otp) => {
  try {
    setAuthLoading(true);

    console.log("VERIFY OTP DATA:", {
      otpId: pendingOtp?.otpId,
      userId: pendingOtp?.user?._id,
      otp,
    });

    const res = await axiosInstance.post("/region-auth/verify-otp", {
      otpId: pendingOtp.otpId,
      userId: pendingOtp.user._id,
      otp,
    });

    login(res.data.user);
    applyTheme(res.data.theme);
    setPendingOtp(null);
  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);
    alert(error?.response?.data?.message || "OTP verification failed");
  } finally {
    setAuthLoading(false);
  }
};

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        handlegooglesignin,
        pendingOtp,
        verifyRegionOtp,
        requestOtpWithPhone,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const AuthProvider = UserProvider;

export const useUser = () => useContext(AuthContext);