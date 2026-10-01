import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { errorMessage } from "../../app/http";
import { Button, Card, Field, Notice, TextInput } from "../../design/ui/controls";
import { useLogin, useSession } from "../data/session";
import { ThemeToggle } from "./ThemeToggle";

export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const [email, setEmail] = useState("gestor@local");
  const [password, setPassword] = useState("");

  if (session.data) return <Navigate to="/captura" replace />;

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">SIGEM</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app">Gestão de Manutenção</h1>
        <p className="mt-2 text-sm text-muted">Caderno do gestor. Uma conta, captura rápida, ficha depois.</p>
        <Card className="mt-6">
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Field label="E-mail">
              <TextInput
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Senha">
              <TextInput
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            {login.isError ? <Notice>{errorMessage(login.error)}</Notice> : null}
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? "Entrando…" : "Entrar"}
            </Button>
          </form>
        </Card>
        <ThemeToggle className="mt-4" />
      </div>
    </div>
  );
}
