import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["fabric"],
  },
  define: {
    global: 'window', 
  },
  server: {
    host: '0.0.0.0', // <-- IMPORTANT: listen on all interfaces for ngrok
    port: 5173,      // <-- optional: specify the port you run ngrok on
    allowedHosts: [
      'tomeka-sultanlike-presuccessfully.ngrok-free.dev'
    ],
  }
});
