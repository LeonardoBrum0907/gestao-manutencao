// Marca de campo obrigatório e erro logo abaixo do campo, iguais no Field e no MultiSelect.

/**
 * Asterisco depois do rótulo de um campo obrigatório. O "obrigatório" escondido é o que o leitor de tela fala.
 * @example <span>Data<RequiredMark /></span>
 */
export function RequiredMark() {
  return (
    <>
      <span aria-hidden className="text-danger">
        {" *"}
      </span>
      <span className="sr-only"> (obrigatório)</span>
    </>
  );
}

/**
 * Erro do campo, logo abaixo dele.
 * @example {error ? <FieldError text={error} /> : null}
 */
export function FieldError({ text }: { text: string }) {
  return (
    <span role="alert" className="text-xs font-semibold text-danger">
      {text}
    </span>
  );
}

const FOCUSABLE = "input:not([type=hidden]), textarea, select, button, [tabindex]:not([tabindex='-1'])";

/**
 * Leva a pessoa ao primeiro campo com erro (marcado com data-invalid pelo Field e pelo MultiSelect): no celular o erro pode estar lá em cima.
 * Espera o próximo quadro porque os erros só aparecem depois que o React redesenha.
 * @example revealFirstInvalid(formRef.current)
 */
export function revealFirstInvalid(root: HTMLElement | null) {
  requestAnimationFrame(() => {
    const field = root?.querySelector<HTMLElement>("[data-invalid]");
    if (!field) return;
    field.scrollIntoView({ block: "center", behavior: "smooth" });
    field.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
  });
}
