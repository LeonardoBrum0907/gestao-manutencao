// Service worker do app instalável (PWA). Não guarda telas nem dados: cada abertura busca a versão atual na
// Vercel e os dados na API, então um deploy novo aparece na hora e nada velho fica preso no celular.
// Só existe para o Android/iPhone aceitarem instalar e para mostrar uma página própria quando o celular está
// sem internet. As notificações (thread "Sistema de notificações", 2026-10-14) vão entrar aqui depois.
const OFFLINE_CACHE = "gestao-offline-v1";
const OFFLINE_URL = "/offline.html";
// Caminhos que o vercel.json repassa para a API no PC. O login do conector do Claude (/authorize) abre como
// navegação neste domínio, então fica fora do service worker para nada mudar no OAuth.
const API_PATH = /^\/(?:api\/|health$|mcp$|authorize$|token$|register$|revoke$|\.well-known\/)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || API_PATH.test(url.pathname)) return;
  event.respondWith(fetch(request).catch(() => offlinePage()));
});

function offlinePage() {
  return caches.match(OFFLINE_URL).then((page) => page || Response.error());
}
