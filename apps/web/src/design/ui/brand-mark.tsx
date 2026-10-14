// Marca Caderno do Gestor (escolhida pelo Léo em 2026-10-14): caderno de capa dura verde com elástico e fita
// marcadora âmbar. As cores do desenho são fixas de propósito: é o ícone do app e não muda com o tema.

/**
 * Ícone do caderno, o mesmo do app instalado.
 * @example <NotebookIcon className="h-8 w-8 rounded-control" />
 */
export function NotebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <rect width="512" height="512" fill="#e9f1ec" />
      <rect x="142" y="96" width="236" height="306" rx="24" fill="#287a51" />
      <rect x="142" y="96" width="40" height="306" rx="20" fill="#1f6343" />
      <rect x="182" y="96" width="12" height="306" fill="#1f6343" />
      <rect x="326" y="96" width="18" height="306" fill="#17543a" />
      <path d="M268 396 L268 446 L290 428 L312 446 L312 396 Z" fill="#e8a43a" />
      <rect x="214" y="168" width="84" height="36" rx="6" fill="#f3f7f4" />
    </svg>
  );
}

/**
 * Ícone mais o nome "Caderno do Gestor" em serifa itálica. `size` muda o tamanho do conjunto.
 * @example <BrandMark size="large" />
 */
export function BrandMark({ size = "small" }: { size?: "small" | "large" }) {
  const large = size === "large";
  return (
    <div className={`flex items-center ${large ? "gap-3" : "gap-2.5"}`}>
      <NotebookIcon className={`shrink-0 rounded-control ${large ? "h-12 w-12" : "h-8 w-8"}`} />
      <p className={`font-serif font-semibold italic leading-none text-accent-ink ${large ? "text-[30px]" : "text-[19px]"}`}>
        Caderno do Gestor
      </p>
    </div>
  );
}
