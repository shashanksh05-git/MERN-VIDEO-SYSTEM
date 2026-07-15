import axios from "axios";

const API_BASE_URL = "https://mern-video-system.onrender.com";

console.log("API BASE URL:", API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export default axiosInstance;