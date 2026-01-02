import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "./components/ThemeProvider";
import App from "./App.tsx";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./index.css";

if ("serviceWorker" in navigator) {
  registerSW({
    immediate: true,
  });
}

createRoot(document.getElementById("root")!).render(
  <>
    <ThemeProvider>
      <App />
    </ThemeProvider>
    <SpeedInsights />
  </>
);
