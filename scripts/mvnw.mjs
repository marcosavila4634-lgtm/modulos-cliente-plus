// Roda o Maven Wrapper do backend (backend/mvnw) com os argumentos recebidos.
// Ex.: node scripts/mvnw.mjs quarkus:dev
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backend = join(dirname(fileURLToPath(import.meta.url)), "..", "backend");
const windows = process.platform === "win32";

// Se o Java acabou de ser instalado, o terminal aberto ainda não conhece o
// JAVA_HOME. Nesse caso procura o JDK 21 na pasta padrão do Temurin.
function javaHome() {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME;
  const pasta = "C:\\Program Files\\Eclipse Adoptium";
  if (!windows || !existsSync(pasta)) return undefined;
  const jdk = readdirSync(pasta).filter((d) => d.startsWith("jdk-21")).sort().pop();
  return jdk && join(pasta, jdk);
}

const env = { ...process.env };
const home = javaHome();
if (home) env.JAVA_HOME = home;

const argumentos = process.argv.slice(2).join(" ");
const filho = windows
  ? spawn(`.\\mvnw.cmd ${argumentos}`, { cwd: backend, env, stdio: "inherit", shell: true })
  : spawn("./mvnw", process.argv.slice(2), { cwd: backend, env, stdio: "inherit" });

filho.on("exit", (codigo) => process.exit(codigo ?? 1));
for (const sinal of ["SIGINT", "SIGTERM"]) process.on(sinal, () => filho.kill(sinal));
