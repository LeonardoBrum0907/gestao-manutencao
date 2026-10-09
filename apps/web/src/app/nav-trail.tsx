import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";

// Trilha de navegação: as telas por onde o usuário passou, seguindo atalhos, até chegar na atual.
// Cada entrada do histórico do navegador guarda a sua trilha, então o botão voltar do navegador,
// o F5 e o "Voltar" da tela concordam. Entrar por um item do menu recomeça a trilha.
export type Crumb = { url: string; label: string; idx: number | null };

// State que os links do menu mandam para recomeçar a trilha.
export const MENU_STATE = { menu: true } as const;

const STORE = "nav-trail";
const KEEP = 200;

// Outra aba ou outro filtro da mesma tela não vira um passo novo da trilha.
export function pageOf(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const member = path.match(/^\/cadastro\/colaboradores\/([^/]+)(?:\/([^/]+))?$/);
  if (member && member[2] !== "relatorio") return `/cadastro/colaboradores/${member[1]}`;
  if (path.startsWith("/configuracoes")) return "/configuracoes";
  return path;
}

// Abrir de novo uma tela que já está na trilha volta a trilha até ela, em vez de dar voltas.
function cutAt(trail: Crumb[], url: string): Crumb[] {
  const page = pageOf(url);
  const again = trail.findIndex((crumb) => pageOf(crumb.url) === page);
  return again === -1 ? trail : trail.slice(0, again);
}

export function nextTrail(base: Crumb[], from: Crumb, url: string): Crumb[] {
  if (pageOf(from.url) === pageOf(url)) return base;
  return cutAt([...base, from], url);
}

// Nome provisório de uma tela que o usuário deixou antes de ela carregar o título.
function routeLabel(url: string): string {
  const path = url.split(/[?#]/)[0];
  if (path.startsWith("/maquinas/")) return "Máquina";
  if (path.startsWith("/rp")) return "RP";
  if (path.startsWith("/registros/")) return "Registro";
  if (path.startsWith("/pos-preventiva")) return "Pós-preventiva";
  if (path.startsWith("/cadastro/colaboradores/")) return "Colaborador";
  if (path.startsWith("/turno")) return "Chamados";
  if (path.startsWith("/configuracoes")) return "Configurações";
  return "Tela anterior";
}

function readStore(): Record<string, Crumb[]> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? "{}") as Record<string, Crumb[]>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Crumb[]>) {
  const keys = Object.keys(store);
  for (const key of keys.slice(0, Math.max(0, keys.length - KEEP))) delete store[key];
  try {
    sessionStorage.setItem(STORE, JSON.stringify(store));
  } catch {
    // Sem sessionStorage a trilha vale só até o F5.
  }
}

// Posição da entrada atual no histórico, que o React Router guarda no history.state.
function historyIdx(): number | null {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === "number" ? idx : null;
}

type Here = { key: string; url: string; idx: number | null; trail: Crumb[] };

type NavTrail = {
  trail: Crumb[];
  setLabel: (label: string) => void;
  goTo: (crumb: Crumb) => void;
};

const NavTrailContext = createContext<NavTrail>({ trail: [], setLabel: () => undefined, goTo: () => undefined });

export function NavTrailProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const here = useRef<Here | null>(null);
  const label = useRef("");
  const [trail, setTrail] = useState<Crumb[]>(() => readStore()[location.key] ?? []);
  const url = location.pathname + location.search;

  // Layout effect: roda antes de a tela nova registrar o título, então `label` ainda é o da tela de onde o usuário saiu.
  useLayoutEffect(() => {
    const prev = here.current;
    if (prev?.key === location.key) return;
    const store = readStore();
    let next: Crumb[];
    if (!prev || navigationType === "POP") next = store[location.key] ?? [];
    else if ((location.state as { menu?: boolean } | null)?.menu) next = [];
    else if (navigationType === "REPLACE") next = cutAt(prev.trail, url);
    else next = nextTrail(prev.trail, { url: prev.url, label: label.current || routeLabel(prev.url), idx: prev.idx }, url);
    if (!prev || pageOf(prev.url) !== pageOf(url)) label.current = "";
    store[location.key] = next;
    writeStore(store);
    here.current = { key: location.key, url, idx: historyIdx(), trail: next };
    setTrail(next);
  }, [location.key, location.state, navigationType, url]);

  const setLabel = useCallback((value: string) => {
    label.current = value;
  }, []);

  // Voltar pelo histórico quando dá (o voltar do navegador continua coerente); senão abre o endereço.
  const goTo = useCallback(
    (crumb: Crumb) => {
      const now = historyIdx();
      if (crumb.idx !== null && now !== null && crumb.idx < now) navigate(crumb.idx - now);
      else navigate(crumb.url);
    },
    [navigate],
  );

  const value = useMemo(() => ({ trail, setLabel, goTo }), [trail, setLabel, goTo]);
  return <NavTrailContext.Provider value={value}>{children}</NavTrailContext.Provider>;
}

export function useNavTrail() {
  return useContext(NavTrailContext);
}

// Cada tela diz o nome com que aparece na trilha das telas que ela abrir.
export function useCrumbLabel(value: string) {
  const { setLabel } = useNavTrail();
  const { key } = useLocation();
  useEffect(() => {
    setLabel(value);
  }, [setLabel, value, key]);
}
