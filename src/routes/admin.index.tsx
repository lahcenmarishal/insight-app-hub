import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "react-router-dom";
import { AdminGuard } from "@/components/admin-guard";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Connexion administrateur — Innova Lab Solutions" },
      { name: "description", content: "Espace réservé aux administrateurs." },
    ],
  }),
  component: () => (
    <AdminGuard>
      <Navigate to="/app" replace />
    </AdminGuard>
  ),
});
