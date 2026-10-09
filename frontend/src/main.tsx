import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErroBackend } from "./components/ErroBackend";
import "./index.css";
import { entrada, saida } from "./lib/modulo-atual";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  // /artes-marciais/* abre as telas da Academia com a loja do dojo (lib/modulo-atual.ts).
  rewrite: { input: ({ url }) => entrada(url), output: ({ url }) => saida(url) },
  defaultPreload: "intent",
  defaultErrorComponent: ErroBackend,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
