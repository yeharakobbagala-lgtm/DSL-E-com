/**
 * Image URL resolver & fallback utility for DSL Stationery E-Commerce.
 *
 * Ensures all image paths (whether relative uploads, static assets, or absolute URLs)
 * are resolved correctly across both local development and remote deployed environments.
 */

export function getBackendOrigin(): string {
  // 1. Runtime environment variable injected into window.__ENV__ (e.g. CapRover or Docker)
  if (typeof window !== 'undefined') {
    const runtimeEnv = (window as any).__ENV__;
    if (runtimeEnv?.NEXT_PUBLIC_API_URL && typeof runtimeEnv.NEXT_PUBLIC_API_URL === 'string') {
      return runtimeEnv.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    }
  }

  // 2. Build-time environment variable if explicitly pointing to a remote backend
  const envApi =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL;

  if (envApi && !envApi.includes('localhost') && !envApi.includes('127.0.0.1')) {
    return envApi.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
  }

  // 3. In browser on non-localhost domain (e.g. dsl-frontend.fivora.dartcodes.com)
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const protocol = window.location.protocol;
      // Pair dsl-frontend -> dsl-server
      if (host.includes('dsl-frontend')) {
        const backendHost = host.replace('dsl-frontend', 'dsl-server');
        return `${protocol}//${backendHost}`;
      }
      return window.location.origin;
    }
  }

  return 'http://localhost:4000';
}

export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '/products/default.png';
  }

  const trimmed = url.trim();

  // Fully qualified or data/blob URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Backend uploads folder: /uploads/...
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const origin = getBackendOrigin();
    return `${origin}${cleanPath}`;
  }

  return trimmed;
}
