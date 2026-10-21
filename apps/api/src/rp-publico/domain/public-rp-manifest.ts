import type { PublicRpAccessDto } from "@manutencao/shared";

// Formato do manifesto de app instalável (W3C Web App Manifest), só com o que o Android e o iPhone usam.
export type PublicRpManifest = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  lang: string;
  start_url: string;
  scope: string;
  display: "standalone";
  background_color: string;
  theme_color: string;
  icons: { src: string; sizes: string; type: string; purpose: "any" | "maskable" }[];
};

// Mesmas cores e ícones do manifesto do app inteiro (apps/web/public/manifest.webmanifest).
const ICONS: PublicRpManifest["icons"] = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

function appName(access: PublicRpAccessDto): string {
  return access.role === "supervisor" ? `RPs · ${access.supervisorName}` : "RPs da equipe";
}

/**
 * Manifesto do app instalado a partir de um link da página pública. O start_url leva o código do link: o app
 * abre direto nos RPs, sem login e sem depender do que o aparelho guardou (no iPhone, o app instalado não vê
 * o armazenamento do Safari). Cada link vira um app à parte (id próprio), o da equipe e o de cada supervisor.
 * @example publicRpManifest("k8F3qP0zLm2xV7sR9tW1yB4n", { role: "team" }).start_url // "/rp/abrir/k8F3qP0zLm2xV7sR9tW1yB4n"
 */
export function publicRpManifest(code: string, access: PublicRpAccessDto): PublicRpManifest {
  const path = `/rp/abrir/${code}`;
  return {
    id: path,
    name: appName(access),
    short_name: "RPs",
    description: "Página da equipe para lançar e acompanhar os RPs, sem login.",
    lang: "pt-BR",
    start_url: path,
    scope: path,
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#084c89",
    icons: ICONS,
  };
}
