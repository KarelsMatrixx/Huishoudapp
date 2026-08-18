import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base staat op "./" zodat de app ook werkt in een submap op GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: "./",
});
