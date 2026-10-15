// Service worker do app instalável (PWA). Não guarda telas nem dados: cada abertura busca a versão atual na
// Vercel e os dados na API, então um deploy novo aparece na hora e nada velho fica preso no celular.
// Existe para o Android/iPhone aceitarem instalar, para mostrar uma página própria quando o celular está sem
// internet e para receber os avisos do servidor (Web Push, thread "Sistema de notificações", 2026-10-14).
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

// Aviso do servidor. Conteúdo em JSON no formato PushMessage (packages/shared/src/push.ts).
self.addEventListener("push", (event) => {
  const message = readPushMessage(event.data);
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      data: { url: message.url },
    }),
  );
});

// Tocar no aviso abre a tela dele: reaproveita uma janela do app que já esteja aberta.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(openApp(appUrl(event.notification.data && event.notification.data.url)));
});

const FALLBACK_MESSAGE = { title: "Caderno do Gestor", body: "Você tem um aviso novo.", url: "/", tag: undefined };

function readPushMessage(data) {
  let message = null;
  try {
    message = data ? data.json() : null;
  } catch (error) {
    message = null;
  }
  if (!message || typeof message.title !== "string") return FALLBACK_MESSAGE;
  return { title: message.title, body: String(message.body || ""), url: message.url, tag: message.tag || undefined };
}

// Só telas do próprio app: um endereço de fora no aviso vira a tela inicial.
function appUrl(path) {
  const safe = typeof path === "string" && path.startsWith("/") && !path.startsWith("//") ? path : "/";
  return new URL(safe, self.location.origin).href;
}

function openApp(url) {
  return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const open = windows.find((client) => client.url.startsWith(self.location.origin));
    if (!open) return self.clients.openWindow(url);
    return open
      .focus()
      .then((client) => client.navigate(url))
      .catch(() => self.clients.openWindow(url));
  });
}
