export const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // If frontend is opened on LAN IP, use same IP for backend
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:5000`;
    }
  }

  return envUrl || "http://localhost:5000";
};