import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";
import { registerServiceWorker } from "./app/service-worker";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz ausente.");

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);

void registerServiceWorker(navigator.serviceWorker, import.meta.env.PROD);
