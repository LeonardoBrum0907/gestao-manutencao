export type LoginPageInput = {
  clientName: string;
  hidden: Record<string, string | undefined>;
  error: string | null;
};

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Tela que aparece quando um app de IA pede para conectar. O formulário volta para /authorize com os
// mesmos parâmetros, e o SDK confere cliente e endereço de retorno de novo antes de chegar na senha.
export function renderLoginPage({ clientName, hidden, error }: LoginPageInput): string {
  const fields = Object.entries(hidden)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([name, value]) => `<input type="hidden" name="${escape(name)}" value="${escape(value)}">`)
    .join("\n      ");
  const alert = error ? `<p class="erro" role="alert">${escape(error)}</p>` : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conectar IA · Gestão de Manutenção</title>
<style>
  :root { color-scheme: light dark; --bg: #f3f4f2; --card: #fff; --ink: #1d2328; --muted: #56616b; --line: #d5d9dc; --accent: #2f4a5f; --erro: #9a3d12; }
  @media (prefers-color-scheme: dark) { :root { --bg: #14181b; --card: #1c2226; --ink: #e6eaec; --muted: #9aa6af; --line: #333d44; --accent: #9cc0da; --erro: #f0a684; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width: 100%; max-width: 380px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 24px; display: grid; gap: 16px; }
  h1 { margin: 0; font-size: 20px; }
  p { margin: 0; color: var(--muted); }
  label { display: grid; gap: 6px; font-weight: 600; }
  input[type=password] { font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 6px; background: transparent; color: inherit; }
  .acoes { display: flex; gap: 8px; }
  button { font: inherit; padding: 10px 14px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: inherit; cursor: pointer; flex: 1; }
  button[value=allow] { background: var(--accent); border-color: var(--accent); color: var(--card); font-weight: 600; }
  .erro { color: var(--erro); font-weight: 600; }
</style>
</head>
<body>
<main>
  <h1>Conectar ${escape(clientName)}</h1>
  <p>Este app vai poder consultar e lançar chamados, RPs, pendências e pós-preventivas em seu nome. Entre com a senha do gestor para liberar.</p>
  ${alert}
  <form method="post" action="/authorize">
      ${fields}
    <label>Senha do gestor
      <input type="password" name="password" autocomplete="current-password" autofocus>
    </label>
    <div class="acoes">
      <button type="submit" name="decision" value="deny">Cancelar</button>
      <button type="submit" name="decision" value="allow">Liberar</button>
    </div>
  </form>
</main>
</body>
</html>`;
}
