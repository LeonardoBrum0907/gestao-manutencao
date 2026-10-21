// Só o que a tela usa do SDK. sentry-browser.ts importa este arquivo sob demanda: com `import("@sentry/react")`
// direto o Vite levava o pacote inteiro (replay, feedback, tracing) para o pedaço, ~156 kB gzip.
export { captureException, init } from "@sentry/react";
