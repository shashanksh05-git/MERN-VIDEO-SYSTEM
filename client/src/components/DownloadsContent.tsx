import React, { useEffect, useState } from "react";
import { Download, Crown } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { getBackendUrl } from "@/lib/backendUrl";
import { formatDistanceToNow } from "date-fns";

const DownloadsContent = () => {
  const { user } = useUser();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get(`/download/user/${user._id}`);
        setDownloads(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [user]);

  const getVideoUrl = (item: any) => {
    const path =
      item?.filepath ||
      item?.videoPath ||
      item?.videopath ||
      item?.filename ||
      item?.videoid?.filepath ||
      item?.videoId?.filepath ||
      item?.video?.filepath;

    if (!path) return "";

    return `${getBackendUrl()}/${String(path).replace(/^\/+/, "")}`;
  };

  if (!user) {
    return (
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-2">Downloads</h1>
        <p className="text-muted-foreground">
          Please login to view your downloads.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 p-6">
        <p className="text-muted-foreground">Loading downloads...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-background text-foreground min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-7 h-7" />

        <div>
          <h1 className="text-2xl font-bold">Downloads</h1>
          <p className="text-sm text-muted-foreground">
            {user.isPremium
              ? "Premium user: unlimited downloads enabled"
              : "Free user: 1 video download per day"}
          </p>
        </div>

        {user.isPremium && (
          <span className="ml-3 inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1 rounded-full">
            <Crown className="w-4 h-4" />
            Premium
          </span>
        )}
      </div>

      {downloads.length === 0 ? (
        <p className="text-muted-foreground">No downloaded videos yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {downloads.map((item) => {
            const videoUrl = getVideoUrl(item);

            return (
              <div
                key={item._id}
                className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
              >
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full aspect-video rounded-lg bg-black object-cover"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    Video not available
                  </div>
                )}

                <div className="mt-3">
                  <h3 className="font-semibold line-clamp-1">
                    {item.videotitle ||
                      item.videoid?.title ||
                      item.videoId?.title ||
                      item.video?.title ||
                      "Downloaded Video"}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {item.videochanel ||
                      item.videoid?.videochanel ||
                      item.videoId?.videochanel ||
                      item.video?.videochanel ||
                      "Unknown channel"}
                  </p>

                  {item.downloadedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Downloaded{" "}
                      {formatDistanceToNow(new Date(item.downloadedAt))} ago
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default DownloadsContent;