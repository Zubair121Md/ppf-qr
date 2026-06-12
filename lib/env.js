const REQUIRED_SERVER = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

export function getMissingServerEnv() {
  return REQUIRED_SERVER.filter((key) => !process.env[key]?.trim());
}

export function getMissingPublicEnv() {
  return REQUIRED_PUBLIC.filter((key) => !process.env[key]?.trim());
}

export function assertServerEnv() {
  const missing = getMissingServerEnv();
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}
