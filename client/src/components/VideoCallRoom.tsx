import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getBackendUrl } from "@/lib/backendUrl";
import {
  Copy,
  Monitor,
  Phone,
  PhoneOff,
  CircleDot,
  Square,
  Video,
} from "lucide-react";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";

const socketUrl =
  getBackendUrl();

const VideoCallRoom = () => {
  const { user } = useUser();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const socketRef = useRef<any>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const [roomId, setRoomId] = useState("streamify-room");
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState("Not connected");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("voip:user-joined", async () => {
      setStatus("Friend joined. Creating call...");

      const peer = createPeerConnection();

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit("voip:offer", {
        roomId,
        offer,
      });
    });

    socket.on("voip:offer", async ({ offer }: any) => {
      setStatus("Incoming call...");

      if (!localStreamRef.current) {
        await startCamera();
      }

      const peer = createPeerConnection();

      await peer.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("voip:answer", {
        roomId,
        answer,
      });

      setStatus("Call connected");
    });

    socket.on("voip:answer", async ({ answer }: any) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        setStatus("Call connected");
      }
    });

    socket.on("voip:ice-candidate", async ({ candidate }: any) => {
      try {
        if (peerRef.current && candidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("voip:user-left", () => {
      setStatus("Friend left the call");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    return () => {
      leaveCall();
      socket.disconnect();
    };
  }, [roomId]);

  const startCamera = async () => {
  try {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) {
      alert("Camera needs localhost or HTTPS. Open http://localhost:3000/calls");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera is not supported in this browser.");
      return;
    }

    console.log("Camera debug:", {
      href: window.location.href,
      secure: window.isSecureContext,
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    });

    let stream: MediaStream;

    try {
      // First try camera + mic
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (firstError) {
      console.log("Camera + mic failed, trying camera only:", firstError);

      // If mic causes issue, try only camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    localStreamRef.current = stream;
    cameraStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      await localVideoRef.current.play().catch(() => {});
    }

    const videoTrack = stream.getVideoTracks()[0];

    const sender = peerRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
    }

    setStatus("Camera started");
  } catch (error: any) {
    console.log("CAMERA ERROR:", error);

    if (error?.name === "NotAllowedError") {
      alert("Camera permission blocked. Allow camera from Edge site settings.");
    } else if (error?.name === "NotFoundError") {
      alert("No camera found. Check webcam connection.");
    } else if (error?.name === "NotReadableError") {
      alert("Camera is already used by another app. Close Zoom/Teams/Camera app.");
    } else {
      alert(error?.message || "Camera failed to start.");
    }
  }
};

  const createPeerConnection = () => {
    if (peerRef.current) {
      return peerRef.current;
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current as MediaStream);
    });

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;

      remoteStreamRef.current = remoteStream;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      setStatus("Call connected");
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("voip:ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peerRef.current = peer;
    return peer;
  };

  const joinRoom = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    if (!localStreamRef.current) {
      await startCamera();
    }

    socketRef.current?.emit("voip:join-room", {
      roomId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

    setJoined(true);
    setStatus(`Joined room: ${roomId}`);
  };

  const leaveCall = () => {
    socketRef.current?.emit("voip:leave-room");

    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());

    localStreamRef.current = null;
    cameraStreamRef.current = null;
    remoteStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setJoined(false);
    setIsScreenSharing(false);
    setStatus("Call ended");
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    alert("Room ID copied. Share it with your friend.");
  };

  const openYouTube = () => {
    window.open("https://www.youtube.com", "_blank");
  };

  const startScreenShare = async () => {
  try {
    if (typeof window === "undefined") return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Screen sharing is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    if (!window.isSecureContext) {
      alert("Screen sharing needs localhost or HTTPS. Open http://localhost:3000/calls");
      return;
    }

    let screenStream: MediaStream;

    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } catch (firstError) {
      console.log("Screen share with audio failed, trying video only:", firstError);

      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
    }

    const screenTrack = screenStream.getVideoTracks()[0];

    if (!screenTrack) {
      alert("No screen video track found");
      return;
    }

    const sender = peerRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender) {
      await sender.replaceTrack(screenTrack);
    }

    localStreamRef.current = screenStream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = screenStream;
    }

    setIsScreenSharing(true);
    setStatus("Screen sharing started");

    screenTrack.onended = async () => {
      await stopScreenShare();
    };
  } catch (error: any) {
    console.log("SCREEN SHARE ERROR:", error);

    alert(
      error?.message ||
        "Screen sharing failed. Use Chrome/Edge and open http://localhost:3000/calls"
    );
  }
};

 const stopScreenShare = async () => {
  try {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    const cameraStream = cameraStreamRef.current;

    if (!cameraStream) {
      await startCamera();
      setIsScreenSharing(false);
      return;
    }

    const cameraTrack = cameraStream.getVideoTracks()[0];

    const sender = peerRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack);
    }

    localStreamRef.current = cameraStream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = cameraStream;
    }

    setIsScreenSharing(false);
    setStatus("Screen sharing stopped");
  } catch (error) {
    console.log("STOP SCREEN SHARE ERROR:", error);
  }
};

  const drawRecordingFrame = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    const remoteVideo = remoteVideoRef.current;
    const localVideo = localVideoRef.current;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (remoteVideo && remoteVideo.srcObject) {
      ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
    }

    if (localVideo && localVideo.srcObject) {
      const pipWidth = 260;
      const pipHeight = 150;

      ctx.drawImage(
        localVideo,
        canvas.width - pipWidth - 20,
        canvas.height - pipHeight - 20,
        pipWidth,
        pipHeight
      );
    }

    animationRef.current = requestAnimationFrame(() =>
      drawRecordingFrame(canvas, ctx)
    );
  };

  const startRecording = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;

      canvasRef.current = canvas;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        alert("Recording not supported");
        return;
      }

      drawRecordingFrame(canvas, ctx);

      const canvasStream = canvas.captureStream(30);

      const mixedStream = new MediaStream();

      canvasStream.getVideoTracks().forEach((track) => {
        mixedStream.addTrack(track);
      });

      const localAudioTracks =
        cameraStreamRef.current?.getAudioTracks() ||
        localStreamRef.current?.getAudioTracks() ||
        [];

      const remoteAudioTracks = remoteStreamRef.current?.getAudioTracks() || [];

      [...localAudioTracks, ...remoteAudioTracks].forEach((track) => {
        mixedStream.addTrack(track);
      });

      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(mixedStream, {
        mimeType: "video/webm",
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `streamify-call-${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();

        link.remove();
        URL.revokeObjectURL(url);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };

      recorderRef.current = recorder;
      recorder.start();

      setIsRecording(true);
      setStatus("Recording started");
    } catch (error) {
      console.log(error);
      alert("Recording failed");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
    setStatus("Recording saved locally");
  };

  return (
    <main className="flex-1 min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Video Call</h1>
          <p className="text-sm text-muted-foreground">
            Make video calls, share YouTube screen, and record sessions locally.
          </p>
        </div>

        <div className="border rounded-xl p-4 bg-card text-card-foreground space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="flex-1 border rounded-md px-3 py-2 bg-background text-foreground"
            />

            <Button onClick={copyRoomId} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy Room
            </Button>

            {!joined ? (
              <Button onClick={joinRoom}>
                <Phone className="w-4 h-4 mr-2" />
                Join Call
              </Button>
            ) : (
              <Button onClick={leaveCall} variant="destructive">
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">Status: {status}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-black rounded-xl overflow-hidden relative aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              You / Screen
            </div>
          </div>

          <div className="bg-black rounded-xl overflow-hidden relative aspect-video">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Friend
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!localStreamRef.current && (
            <Button onClick={startCamera}>
              <Video className="w-4 h-4 mr-2" />
              Start Camera
            </Button>
          )}

          <Button onClick={openYouTube} variant="outline">
            Open YouTube
          </Button>

          {!isScreenSharing ? (
            <Button onClick={startScreenShare} variant="outline">
              <Monitor className="w-4 h-4 mr-2" />
              Share Screen
            </Button>
          ) : (
            <Button onClick={stopScreenShare} variant="outline">
              Stop Sharing
            </Button>
          )}

          {!isRecording ? (
            <Button onClick={startRecording} variant="outline">
              <CircleDot className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop & Save Recording
            </Button>
          )}
        </div>

        <div className="border rounded-xl p-4 bg-card text-card-foreground">
          <h2 className="font-semibold mb-2">How to test</h2>
          <ol className="list-decimal ml-5 text-sm space-y-1 text-muted-foreground">
            <li>Login first.</li>
            <li>Open this page in two browser windows or two devices.</li>
            <li>Use the same Room ID in both windows.</li>
            <li>Click Join Call in both windows.</li>
            <li>Click Open YouTube, then Share Screen and choose YouTube tab.</li>
            <li>Click Start Recording, then Stop & Save Recording.</li>
          </ol>
        </div>
      </div>
    </main>
  );
};

export default VideoCallRoom;