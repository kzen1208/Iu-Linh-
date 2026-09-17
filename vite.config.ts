import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Chuyển tiếp sang server/index.js — giữ OPENROUTER_API_KEY ở phía server,
      // không bao giờ để lộ key trong bundle chạy trên trình duyệt.
      "/api": "http://localhost:3001",
    },
  },
});
