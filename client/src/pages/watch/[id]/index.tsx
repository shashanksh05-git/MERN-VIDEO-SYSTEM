import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id || typeof id !== "string") return;

      try {
        setLoading(true);

        const res = await axiosInstance.get("/video/getall");

        if (Array.isArray(res.data)) {
          setAllVideos(res.data);

          const selectedVideo = res.data.find((vid: any) => vid._id === id);

          setCurrentVideo(selectedVideo || null);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <main className="flex-1 p-6 bg-background text-foreground">
        Loading...
      </main>
    );
  }

  if (!currentVideo) {
    return (
      <main className="flex-1 p-6 bg-background text-foreground">
        Video not found
      </main>
    );
  }

 return (
  <main className="flex-1 min-h-screen bg-background text-foreground">
    <div className="w-full max-w-6xl mx-auto px-4 py-4">
      <div className="space-y-5">
        <div className="w-full mx-auto">
          <Videopplayer video={currentVideo} />
        </div>

        <VideoInfo video={currentVideo} />

        <div id="comments-section" className="mt-8">
          <Comments videoId={currentVideo._id} />
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Related Videos</h2>
          <RelatedVideos videos={allVideos} />
        </div>
      </div>
    </div>
  </main>
);
};

export default WatchPage;