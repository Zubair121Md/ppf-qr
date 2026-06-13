const JWT_ISSUER = 'ppf-packing';

export function verifyTokenEdge(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    if (payload.iss && payload.iss !== JWT_ISSUER) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
