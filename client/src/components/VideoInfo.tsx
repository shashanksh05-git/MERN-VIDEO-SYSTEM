import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Crown,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

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

const actionBtnClass =
  "bg-gray-100 text-black hover:bg-gray-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 rounded-full";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video?.Like || 0);
  const [dislikes, setDislikes] = useState(video?.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);

  const { user, login } = useUser();

  useEffect(() => {
    setlikes(video?.Like || 0);
    setDislikes(video?.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const handleviews = async () => {
      if (!video?._id) return;

      try {
        if (user) {
          await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } else {
          await axiosInstance.post(`/history/views/${video._id}`);
        }
      } catch (error) {
        console.log(error);
      }
    };

    handleviews();
  }, [user, video?._id]);

  const handleLike = async () => {
    if (!user) return alert("Please login first");

    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });

      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);

          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async () => {
    if (!user) return alert("Please login first");

    try {
      if (isDisliked) {
        setDislikes((prev: any) => prev - 1);
        setIsDisliked(false);
      } else {
        setDislikes((prev: any) => prev + 1);
        setIsDisliked(true);

        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleWatchLater = async () => {
    if (!user) return alert("Please login first");

    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user._id,
      });

      setIsWatchLater(res.data.watchlater);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      alert("Please login to download video");
      return;
    }

    setDownloading(true);

    try {
      const res = await axiosInstance.post(
        `/download/${video._id}`,
        {
          userId: user._id,
        },
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], {
        type: video.filetype || "video/mp4",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = video.filename || `${video.videotitle}.mp4`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      alert("Video downloaded successfully");
    } catch (error: any) {
      if (error?.response?.status === 403) {
        alert(
          "Free limit finished. You can download only 1 video per day. Upgrade to premium for unlimited downloads."
        );
      } else {
        alert("Download failed");
      }

      console.log(error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePremiumPayment = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    setPremiumLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        alert("Razorpay failed to load");
        return;
      }

      const orderRes = await axiosInstance.post(
        "/payment/create-premium-order",
        {
          userId: user._id,
        }
      );

      const { order, key, amount } = orderRes.data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Streamify Premium",
        description: `Premium Plan ₹${amount}`,
        order_id: order.id,

        handler: async function (response: any) {
          try {
            const verifyRes = await axiosInstance.post(
              "/payment/verify-premium-payment",
              {
                userId: user._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            if (verifyRes.data.success) {
              login(verifyRes.data.user);
              localStorage.setItem(
                "Profile",
                JSON.stringify(verifyRes.data.user)
              );
              alert("Premium activated successfully");
            }
          } catch (error) {
            alert("Payment verification failed");
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
    } catch (error) {
      console.log(error);
      alert("Premium payment failed");
    } finally {
      setPremiumLoading(false);
    }
  };

  const handleDemoPremium = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      const res = await axiosInstance.post("/payment/demo-premium", {
        userId: user._id,
      });

      if (res.data.success) {
        login(res.data.user);
        localStorage.setItem("Profile", JSON.stringify(res.data.user));
        alert("Demo premium activated successfully");
      }
    } catch (error) {
      console.log(error);
      alert("Demo premium activation failed");
    }
  };

  return (
    <div className="space-y-4 bg-background text-foreground">
      <h1 className="text-xl font-semibold">{video?.videotitle}</h1>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video?.videochanel?.[0] || "V"}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-medium">{video?.videochanel}</h3>
            <p className="text-sm text-muted-foreground">1.2M subscribers</p>
          </div>

          <Button className="ml-4 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Subscribe
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 text-black dark:bg-zinc-800 dark:text-white rounded-full">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? "fill-black text-black dark:fill-white dark:text-white" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>

            <div className="w-px h-6 bg-gray-300 dark:bg-zinc-600" />

            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full text-black dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? "fill-black text-black dark:fill-white dark:text-white" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`${actionBtnClass} ${
              isWatchLater ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>

          <Button variant="ghost" size="sm" className={actionBtnClass}>
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={actionBtnClass}
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="w-5 h-5 mr-2" />
            {downloading ? "Downloading..." : "Download"}
          </Button>

          {user && !user.isPremium && (
            <Button
              size="sm"
              className="rounded-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              onClick={handlePremiumPayment}
              disabled={premiumLoading}
            >
              <Crown className="w-5 h-5 mr-2" />
              {premiumLoading ? "Processing..." : "Premium"}
            </Button>
          )}

          {user && !user.isPremium && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-white text-black border border-gray-300 hover:bg-gray-100 hover:text-black dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800"
              onClick={handleDemoPremium}
            >
              Demo Premium
            </Button>
          )}

          {user?.isPremium && (
            <Button
              size="sm"
              className="rounded-full bg-green-600 text-white hover:bg-green-700"
              disabled
            >
              <Crown className="w-5 h-5 mr-2" />
              Premium Active
            </Button>
          )}

          <Button variant="ghost" size="icon" className={actionBtnClass}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {user && (
        <div className="text-sm bg-gray-100 text-black dark:bg-zinc-800 dark:text-white px-3 py-2 rounded-lg inline-block uppercase">
          Current Plan: {user.currentPlan || "free"}
        </div>
      )}

      <div className="bg-gray-100 text-black dark:bg-zinc-900 dark:text-white rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{video?.views?.toLocaleString() || 0} views</span>
          <span>
            {video?.createdAt
              ? formatDistanceToNow(new Date(video.createdAt))
              : "just now"}{" "}
            ago
          </span>
        </div>

        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium text-black dark:text-white hover:bg-transparent"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;