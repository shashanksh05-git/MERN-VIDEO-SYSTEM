import React, { useState } from "react";
import { Crown } from "lucide-react";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

const plans = [
  {
    key: "bronze",
    name: "Bronze",
    price: 10,
    limit: "7 minutes",
  },
  {
    key: "silver",
    name: "Silver",
    price: 50,
    limit: "10 minutes",
  },
  {
    key: "gold",
    name: "Gold",
    price: 100,
    limit: "Unlimited",
  },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PlanUpgrade = () => {
  const { user, login } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const activateDemoPlan = async (plan: string) => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      setLoadingPlan(plan);

      const res = await axiosInstance.post("/plan/demo", {
        userId: user._id,
        plan,
      });

      if (res.data.success) {
        login(res.data.user);
        localStorage.setItem("Profile", JSON.stringify(res.data.user));
        alert(`${res.data.user.currentPlan} plan activated successfully`);
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Demo plan activation failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePlanPayment = async (plan: string) => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      setLoadingPlan(plan);

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        alert("Razorpay failed to load");
        return;
      }

      const orderRes = await axiosInstance.post("/plan/create-order", {
        userId: user._id,
        plan,
      });

      const { key, order, planDetails } = orderRes.data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Streamify Plan Upgrade",
        description: `${planDetails.name} Plan ₹${planDetails.amount}`,
        order_id: order.id,

        handler: async function (response: any) {
          try {
            const verifyRes = await axiosInstance.post("/plan/verify-payment", {
              userId: user._id,
              plan,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              login(verifyRes.data.user);
              localStorage.setItem("Profile", JSON.stringify(verifyRes.data.user));
              alert("Plan upgraded successfully. Invoice email sent.");
            }
          } catch (error: any) {
            alert(error?.response?.data?.message || "Payment verification failed");
          }
        },

        prefill: {
          name: user.name,
          email: user.email,
        },

        theme: {
          color: "#000000",
        },
      };

      const razorpay = new (window as any).Razorpay(options);

      razorpay.on("payment.failed", function (response: any) {
        console.log("PAYMENT FAILED:", response.error);
        alert(response.error.description || "Payment failed");
      });

      razorpay.open();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Plan payment failed");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Upgrade Plan</h2>
      </div>

      <p className="text-sm text-gray-500">
        Current Plan:{" "}
        <span className="font-semibold uppercase">
          {user?.currentPlan || "free"}
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.key} className="border rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-2xl font-bold">₹{plan.price}</p>
            <p className="text-sm text-gray-500">
              Watch limit: {plan.limit}
            </p>

            <Button
              className="w-full"
              onClick={() => handlePlanPayment(plan.key)}
              disabled={loadingPlan === plan.key}
            >
              {loadingPlan === plan.key ? "Processing..." : "Pay with Razorpay"}
            </Button>

            <Button
             variant="outline"
            className="w-full bg-white text-black border border-gray-300 hover:bg-gray-100 hover:text-black"
             onClick={() => activateDemoPlan(plan.key)}
           disabled={loadingPlan === plan.key}
            >
          Demo Activate
          </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanUpgrade;