import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/registros": "http://localhost:8080",
      "/usuarios": "http://localhost:8080",
    },
  },
});
