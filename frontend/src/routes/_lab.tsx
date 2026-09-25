import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "../components/Sidebar";
import { api } from "../lib/api";

// Layout do laboratório (visão geral + páginas dos módulos).
export const Route = createFileRoute("/_lab")({
  loader: () => api.modulos(),
  component: Layout,
});

function Layout() {
  const modulos = Route.useLoaderData();
  return (
    <div className="flex h-full">
      <Sidebar modulos={modulos} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
