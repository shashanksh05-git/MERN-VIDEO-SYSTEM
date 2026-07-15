import React, { useEffect, useRef, useState } from "react";
import {
  Lock,
  Maximize,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import PlanUpgrade from "./PlanUpgrade";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { getBackendUrl } from "@/lib/backendUrl";
const getWatchLimitSeconds = (user: any) => {
  const plan = user?.currentPlan || "free";

  if (plan === "gold") return 0;
  if (plan === "silver") return 10 * 60;
  if (plan === "bronze") return 7 * 60;

  return 5 * 60;
};

const getPlanLabel = (user: any) => {
  const plan = user?.currentPlan || "free";

  if (plan === "gold") return "Gold: unlimited";
  if (plan === "silver") return "Silver: 10 minutes";
  if (plan === "bronze") return "Bronze: 7 minutes";

  return "Free: 5 minutes";
};

const formatTime = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const Videopplayer = ({ video }: any) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const tapTimerRef = useRef<any>(null);
  const lastTapZoneRef = useRef<string | null>(null);
  const tapCountRef = useRef(0);

  const { user } = useUser();
  const router = useRouter();

  const [limitReached, setLimitReached] = useState(false);
  const [gestureMessage, setGestureMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");

  const backendUrl =
    getBackendUrl();

  const videoPath = video?.filepath?.replaceAll("\\", "/");
  const videoUrl = `${backendUrl}/${videoPath}`;

  const watchLimitSeconds = getWatchLimitSeconds(user);

  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");

        if (Array.isArray(res.data)) {
          setAllVideos(res.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchAllVideos();
  }, []);

  useEffect(() => {
    setLimitReached(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [video?._id]);

  const showGestureMessage = (message: string) => {
    setGestureMessage(message);

    setTimeout(() => {
      setGestureMessage("");
    }, 800);
  };

  const togglePlayPause = () => {
    if (!videoRef.current || limitReached) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      showGestureMessage("Play");
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      showGestureMessage("Pause");
    }
  };

  const seekVideo = (seconds: number) => {
    if (!videoRef.current) return;

    const newTime = Math.max(
      0,
      Math.min(
        videoRef.current.duration || 0,
        videoRef.current.currentTime + seconds
      )
    );

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);

    showGestureMessage(seconds > 0 ? "+10 sec" : "-10 sec");
  };

  const goToNextVideo = () => {
    if (!allVideos.length || !video?._id) {
      showGestureMessage("No next video");
      return;
    }

    const currentIndex = allVideos.findIndex((item) => item._id === video._id);

    if (currentIndex === -1) {
      showGestureMessage("No next video");
      return;
    }

    const nextVideo = allVideos[currentIndex + 1] || allVideos[0];

    if (!nextVideo?._id || nextVideo._id === video._id) {
      showGestureMessage("No next video");
      return;
    }

    showGestureMessage("Next video");
    router.push(`/watch/${nextVideo._id}`);
  };

  const openCommentSection = () => {
    const commentSection = document.getElementById("comments-section");

    if (commentSection) {
      commentSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      showGestureMessage("Comments");
    } else {
      showGestureMessage("Comments not found");
    }
  };

  const closeWebsite = () => {
    showGestureMessage("Closing");

    window.close();

    setTimeout(() => {
      if (!window.closed) {
        alert(
          "Browser blocked automatic close. This works only when the tab was opened by script."
        );
      }
    }, 300);
  };

  const processGesture = (zone: "left" | "center" | "right", count: number) => {
    if (zone === "left") {
      if (count === 2) {
        seekVideo(-10);
      }

      if (count >= 3) {
        openCommentSection();
      }
    }

    if (zone === "center") {
      if (count === 1) {
        togglePlayPause();
      }

      if (count >= 3) {
        goToNextVideo();
      }
    }

    if (zone === "right") {
      if (count === 2) {
        seekVideo(10);
      }

      if (count >= 3) {
        closeWebsite();
      }
    }
  };

  const handleTap = (zone: "left" | "center" | "right") => {
    if (lastTapZoneRef.current !== zone) {
      tapCountRef.current = 0;
      lastTapZoneRef.current = zone;
    }

    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 3) {
      const finalCount = tapCountRef.current;

      tapCountRef.current = 0;
      lastTapZoneRef.current = null;

      processGesture(zone, finalCount);
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      const finalCount = tapCountRef.current;

      tapCountRef.current = 0;
      lastTapZoneRef.current = null;

      processGesture(zone, finalCount);
    }, 350);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    if (watchLimitSeconds === 0) return;

    if (current >= watchLimitSeconds) {
      videoRef.current.pause();
      videoRef.current.currentTime = watchLimitSeconds;
      setCurrentTime(watchLimitSeconds);
      setIsPlaying(false);
      setLimitReached(true);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;

    setDuration(videoRef.current.duration || 0);
    videoRef.current.playbackRate = playbackSpeed;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const value = Number(e.target.value);

    videoRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;

    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    showGestureMessage(`${speed}x Speed`);
  };

  const handleFullscreen = async () => {
    const player = document.getElementById("custom-video-player");

    if (!player) return;

    try {
      if (!document.fullscreenElement) {
        await player.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.log(error);
      alert("Fullscreen not supported");
    }
  };

  const toggleFitMode = () => {
    setFitMode((prev) => (prev === "contain" ? "cover" : "contain"));
    showGestureMessage(fitMode === "contain" ? "Fill Screen" : "Original Fit");
  };

  const handlePlayAgain = () => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    setLimitReached(false);
    videoRef.current.play();
    setIsPlaying(true);
  };

  return (
    <div
      id="custom-video-player"
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
    >
      <video
        ref={videoRef}
        key={videoUrl}
        src={videoUrl}
        className={`w-full h-full bg-black ${
          fitMode === "contain" ? "object-contain" : "object-cover"
        }`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {!limitReached && (
        <div className="absolute inset-0 z-10 grid grid-cols-3">
          <button
            aria-label="Left gesture area"
            className="w-full h-full bg-transparent"
            onClick={() => handleTap("left")}
          />

          <button
            aria-label="Center gesture area"
            className="w-full h-full bg-transparent"
            onClick={() => handleTap("center")}
          />

          <button
            aria-label="Right gesture area"
            className="w-full h-full bg-transparent"
            onClick={() => handleTap("right")}
          />
        </div>
      )}

      {gestureMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 text-white px-5 py-3 rounded-full text-lg font-semibold">
            {gestureMessage}
          </div>
        </div>
      )}

      {!limitReached && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-100">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full mb-3"
          />

          <div className="flex items-center justify-between text-white gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => seekVideo(-10)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-white text-black hover:bg-gray-200"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => seekVideo(10)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={playbackSpeed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="bg-black/70 border border-white/30 text-white text-sm rounded-md px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>

              <button
                onClick={toggleFitMode}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                title="Fit / Fill"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={handleFullscreen}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                title="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>

              <div className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-300 mt-2">
            Double tap left/right = ±10s • Center tap = play/pause • Triple
            center = next • Triple left = comments • Triple right = close
          </div>
        </div>
      )}

      {limitReached && (
        <div className="absolute inset-0 z-40 bg-black/95 text-white flex items-center justify-center p-6">
          <div className="max-w-3xl w-full space-y-4 text-center">
            <Lock className="w-10 h-10 mx-auto" />

            <h2 className="text-2xl font-bold">Watch limit reached</h2>

            <p className="text-sm text-gray-300">
              Your current plan is {getPlanLabel(user)}. Upgrade to continue
              watching for longer.
            </p>

            <div className="flex justify-center">
              <Button variant="secondary" onClick={handlePlayAgain}>
                Watch from beginning
              </Button>
            </div>

            <div className="text-left text-black">
              <PlanUpgrade />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videopplayer;