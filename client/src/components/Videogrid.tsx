import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = () => {
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        console.log("HOME VIDEOS:", res.data);

        if (Array.isArray(res.data)) {
          setvideo(res.data);
        } else {
          setvideo([]);
        }
      } catch (error) {
        console.log("VIDEO FETCH ERROR:", error);
        setvideo([]);
      } finally {
        setloading(false);
      }
    };

    fetchvideo();
  }, []);

  if (loading) {
    return <div>Loading videos...</div>;
  }

  if (videos.length === 0) {
    return <div>No videos found. Upload a video first.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video: any) => (
        <Videocard key={video._id} video={video} />
      ))}
    </div>
  );
};

export default Videogrid;