import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// O Nest injeta por tipo e depende do metadata que só o tsc emite; o tsx (esbuild) não emite.
// Por isso o dev compila com tsc --watch e reinicia o dist com o watch do Node.
const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
const compiler = spawn(process.execPath, [tsc, "-p", "tsconfig.build.json", "--watch", "--preserveWatchOutput"], {
  stdio: ["inherit", "pipe", "inherit"],
});

let server;
compiler.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  if (server || !chunk.toString().includes("Watching for file changes")) return;
  server = spawn(process.execPath, ["--watch", "dist/main.js"], { stdio: "inherit" });
  server.on("exit", (code) => stop(code ?? 1));
});
compiler.on("exit", (code) => stop(code ?? 1));

function stop(code) {
  compiler.kill();
  server?.kill();
  process.exit(code);
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
