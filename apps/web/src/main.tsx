import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CrashBoundary } from "./app/crash-boundary";
import { createErrorTracking } from "./app/error-tracking";
import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";
import { registerServiceWorker } from "./app/service-worker";
import { sentryLoader } from "./app/sentry-browser";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz ausente.");

const sentryDsn = import.meta.env.VITE_SENTRY_DSN?.trim();
const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || "producao";
const errorTracking = createErrorTracking(sentryDsn ? sentryLoader(sentryDsn, sentryEnvironment) : null);

createRoot(root).render(
  <StrictMode>
    <CrashBoundary onCrash={errorTracking.report}>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </CrashBoundary>
  </StrictMode>,
);

void registerServiceWorker(navigator.serviceWorker, import.meta.env.PROD);
