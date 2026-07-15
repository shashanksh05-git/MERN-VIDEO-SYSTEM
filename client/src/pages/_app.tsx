import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import RegionOtpModal from "@/components/RegionOtpModal";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
  <div className="min-h-screen bg-background text-foreground">
    <title>Streamify - Video Sharing Platform</title>
    <Header />
    <Toaster />

    <div className="flex bg-background text-foreground">
      <Sidebar />
      <Component {...pageProps} />
    </div>
  </div>

  <RegionOtpModal />
</UserProvider>
  );
}