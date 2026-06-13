const store = new Map();

function getKey(identifier, action) {
  return `${action}:${identifier}`;
}

function cleanup() {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (data.resetAt < now) store.delete(key);
  }
}

export function rateLimit({ identifier, action, maxRequests, windowSeconds }) {
  cleanup();
  const key = getKey(identifier, action);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}

export function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
  );
}
