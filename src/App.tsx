import { Routes, Route } from "react-router-dom";
import { getRegisteredRoutes } from "@/compat/tanstack-router";
// Importing this module triggers createFileRoute() registrations for every route file.
import "@/compat/route-register";
import { NotFound } from "@/components/not-found";

function tssPathToReactRouter(path: string): string {
  if (path === "/" || path === "/__root__") return path;
  // TanStack uses $param, React Router uses :param
  let p = path.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, ":$1");
  // Strip trailing slash so /devis/ becomes /devis
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

export default function App() {
  const routes = getRegisteredRoutes().filter(
    (r) => r.__path !== "/__root__" && r.__component,
  );

  return (
    <Routes>
      {routes.map((r) => {
        const Comp = r.__component!;
        return (
          <Route
            key={r.__path}
            path={tssPathToReactRouter(r.__path)}
            element={<Comp />}
          />
        );
      })}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
