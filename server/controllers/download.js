import fs from "fs";
import path from "path";
import download from "../Modals/download.js";
import video from "../Modals/video.js";
import users from "../Modals/Auth.js";

export const downloadVideo = async (req, res) => {
  const { videoId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Please login to download video" });
  }

  try {
    const user = await users.findById(userId);
    const videoData = await video.findById(videoId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!videoData) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (!user.isPremium) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayDownloadCount = await download.countDocuments({
        userId,
        downloadedAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

      if (todayDownloadCount >= 1) {
        return res.status(403).json({
          limitExceeded: true,
          message:
            "Free users can download only one video per day. Upgrade to premium for unlimited downloads.",
        });
      }
    }

    const cleanPath = videoData.filepath.replace(/\\/g, "/");
    const filePath = path.join(process.cwd(), cleanPath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Video file not found on server" });
    }

    await download.create({
      userId,
      videoId,
      videotitle: videoData.videotitle,
      videochanel: videoData.videochanel,
      filepath: videoData.filepath,
      filename: videoData.filename,
    });

    return res.download(filePath, videoData.filename || "video.mp4");
  } catch (error) {
    console.error("Download video error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserDownloads = async (req, res) => {
  const { userId } = req.params;

  try {
    const downloads = await download
      .find({ userId })
      .sort({ downloadedAt: -1 });

    return res.status(200).json(downloads);
  } catch (error) {
    console.error("Get downloads error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};