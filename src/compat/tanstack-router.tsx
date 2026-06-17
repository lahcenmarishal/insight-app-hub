/**
 * Compatibility shim — re-exposes the slice of the @tanstack/react-router API
 * that the rest of the app uses, implemented on top of react-router-dom v6.
 *
 * This module is aliased as `@tanstack/react-router` from vite.config.ts so we
 * can migrate without touching every component import.
 */
import React from "react";
import {
  Link as RRLink,
  useLocation,
  useNavigate as useRRNavigate,
  useParams as useRRParams,
  useSearchParams,
  Outlet as RROutlet,
  type LinkProps as RRLinkProps,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

// ---------- URL helpers ----------

function replaceParams(to: string, params?: Record<string, string | number | undefined | null>) {
  if (!params) return to;
  let out = to;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(`$${k}`, encodeURIComponent(String(v ?? "")));
  }
  return out;
}

function toQuery(search?: Record<string, unknown> | string | undefined): string {
  if (!search) return "";
  if (typeof search === "string") return search.startsWith("?") ? search : `?${search}`;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function buildHref(to: string, params?: Record<string, unknown>, search?: Record<string, unknown> | string) {
  let path = replaceParams(to, params as Record<string, string> | undefined);
  // Drop trailing slash on non-root paths so /devis/ matches /devis
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path + toQuery(search);
}

// ---------- <Link> ----------

type CompatLinkProps = Omit<RRLinkProps, "to"> & {
  to: string;
  params?: Record<string, unknown>;
  search?: Record<string, unknown> | string;
  activeProps?: { className?: string };
  inactiveProps?: { className?: string };
  preload?: unknown;
};

export const Link = React.forwardRef<HTMLAnchorElement, CompatLinkProps>(
  function CompatLink({ to, params, search, activeProps: _a, inactiveProps: _i, preload: _p, ...rest }, ref) {
    const href = buildHref(to, params, search);
    return <RRLink ref={ref} to={href} {...rest} />;
  },
);

// ---------- Navigation hooks ----------

type NavigateOpts = {
  to: string;
  params?: Record<string, unknown>;
  search?: Record<string, unknown> | string;
  replace?: boolean;
};

export function useNavigate() {
  const nav = useRRNavigate();
  return (opts: NavigateOpts | string) => {
    if (typeof opts === "string") return nav(opts);
    nav(buildHref(opts.to, opts.params, opts.search), { replace: opts.replace });
  };
}

export function useRouterState<T = unknown>({
  select,
}: {
  select: (state: { location: { pathname: string; search: string; hash: string } }) => T;
}): T {
  const loc = useLocation();
  return select({ location: { pathname: loc.pathname, search: loc.search, hash: loc.hash } });
}

export function useRouter() {
  const qc = useQueryClient();
  const nav = useNavigate();
  return {
    invalidate: () => qc.invalidateQueries(),
    navigate: (opts: NavigateOpts | string) => nav(opts),
  };
}

export const Outlet = RROutlet;

// ---------- notFound / redirect ----------

export function notFound() {
  const err = new Error("NotFound") as Error & { isNotFound: true };
  (err as { isNotFound: true }).isNotFound = true;
  return err;
}

export function redirect(opts: { to: string; replace?: boolean }) {
  const err = new Error("Redirect") as Error & { isRedirect: true; to: string; replace?: boolean };
  err.isRedirect = true;
  err.to = opts.to;
  err.replace = opts.replace;
  return err;
}

// ---------- SSR-only no-ops ----------

export const HeadContent: React.FC = () => null;
export const Scripts: React.FC = () => null;

// ---------- File-route registry ----------

type LoaderCtx = { params: Record<string, string>; deps?: unknown };
type AnyConfig = {
  component?: React.ComponentType;
  notFoundComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; reset: () => void }>;
  shellComponent?: React.ComponentType<{ children: React.ReactNode }>;
  loader?: (ctx: LoaderCtx) => unknown;
  validateSearch?: (s: Record<string, unknown>) => unknown;
  head?: unknown;
  beforeLoad?: unknown;
  [k: string]: unknown;
};

export type RouteHandle = {
  __path: string;
  __component?: React.ComponentType;
  __notFound?: React.ComponentType;
  __config: AnyConfig;
  useLoaderData: <T = unknown>() => T;
  useParams: <T = Record<string, string>>() => T;
  useSearch: <T = Record<string, string>>() => T;
  useRouteContext: () => { queryClient: ReturnType<typeof useQueryClient> };
};

const REGISTERED: RouteHandle[] = [];

export function getRegisteredRoutes(): RouteHandle[] {
  return REGISTERED;
}

export function createFileRoute(path: string) {
  return (cfg: AnyConfig): RouteHandle => {
    const handle: RouteHandle = {
      __path: path,
      __component: cfg.component,
      __notFound: cfg.notFoundComponent,
      __config: cfg,
      useLoaderData: <T,>() => undefined as unknown as T,
      useParams: <T,>() => useRRParams() as unknown as T,
      useSearch: <T,>() => {
        const [sp] = useSearchParams();
        return Object.fromEntries(sp.entries()) as unknown as T;
      },
      useRouteContext: () => ({ queryClient: useQueryClient() }),
    };
    REGISTERED.push(handle);
    return handle;
  };
}

export function createRootRouteWithContext<_TContext>() {
  return (cfg: AnyConfig) => createFileRoute("/__root__")(cfg);
}

export function createRootRoute(cfg: AnyConfig) {
  return createFileRoute("/__root__")(cfg);
}
