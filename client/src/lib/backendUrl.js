export const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  return "http://localhost:5000";
};

export default getBackendUrl;