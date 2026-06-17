/**
 * Compatibility shim for @tanstack/react-start used during the SPA migration.
 * `useServerFn` becomes an identity wrapper because every former server
 * function now runs directly in the browser via the supabase client.
 */
export function useServerFn<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn;
}

// Anything still calling createServerFn / createMiddleware / createStart is
// dead after the migration, but we keep harmless stubs so accidental imports
// don't break the build.
type AnyFn = (...args: unknown[]) => unknown;

export function createServerFn(_opts?: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    inputValidator(_v: unknown) {
      return builder;
    },
    middleware(_m: unknown) {
      return builder;
    },
    handler(fn: AnyFn) {
      return fn;
    },
  };
  return builder;
}

export function createMiddleware() {
  return {
    server: (_fn: unknown) => null,
    client: (_fn: unknown) => null,
  };
}

export function createStart(_factory?: unknown) {
  return {};
}
