"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { getBackendUrl } from "@/lib/backendUrl";

export default function VideoCard({ video }: any) {
  const backendUrl = getBackendUrl();
  const videoPath = video?.filepath?.replaceAll("\\", "/");
  const videoUrl = `${backendUrl}/${videoPath}`;

  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <video
            src={videoUrl}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            muted
            preload="metadata"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
            10:24
          </div>
        </div>

        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel?.[0] || "V"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{video?.videochanel}</p>
            <p className="text-sm text-gray-600">
              {(video?.views || 0).toLocaleString()} views •{" "}
              {video?.createdAt
                ? formatDistanceToNow(new Date(video.createdAt))
                : "just now"}{" "}
              ago
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}