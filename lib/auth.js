import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './db';
import { getJwtSecret } from './env';

const TOKEN_COOKIE = 'farmscan_token';
const JWT_EXPIRY = '7d';
const JWT_ISSUER = 'ppf-packing';

export const STAFF_ROLES = ['manager', 'admin'];

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload) {
  const safePayload = {
    worker_id: payload.worker_id,
    username: payload.username,
    full_name: payload.full_name,
    role: payload.role,
    preferred_lang: payload.preferred_lang,
    jti: randomUUID(),
  };

  return jwt.sign(safePayload, getJwtSecret(), {
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: payload.role,
  });
}

export function verifyToken(token, expectedAudience = null) {
  try {
    const options = {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
    };
    if (expectedAudience) {
      options.audience = expectedAudience;
    }
    return jwt.verify(token, getJwtSecret(), options);
  } catch {
    return null;
  }
}

export async function isTokenRevoked(jti) {
  if (!jti) return false;
  const { data } = await supabaseAdmin
    .from('revoked_tokens')
    .select('jti')
    .eq('jti', jti)
    .maybeSingle();
  return Boolean(data);
}

export async function revokeToken(jti, reason = 'logout') {
  if (!jti) return;
  await supabaseAdmin.from('revoked_tokens').insert({ jti, reason }).catch(() => {});
}

export function getTokenFromRequest(request) {
  return request.cookies.get(TOKEN_COOKIE)?.value || null;
}

export async function getWorkerFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.worker_id) return null;

  if (await isTokenRevoked(decoded.jti)) return null;

  const { data: worker } = await supabaseAdmin
    .from('workers')
    .select('*')
    .eq('worker_id', decoded.worker_id)
    .eq('is_active', true)
    .single();

  if (!worker || decoded.role !== worker.role) return null;

  return worker;
}

export function setAuthCookie(response, token, role = 'worker') {
  const isStaff = STAFF_ROLES.includes(role);
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: isStaff ? 'strict' : 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export function clearAuthCookie(response) {
  response.cookies.set(TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

export async function getWorkerFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.worker_id) return null;

  if (await isTokenRevoked(decoded.jti)) return null;

  const { data: worker } = await supabaseAdmin
    .from('workers')
    .select('*')
    .eq('worker_id', decoded.worker_id)
    .eq('is_active', true)
    .single();

  if (!worker || decoded.role !== worker.role) return null;

  return worker;
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function requireStaff(worker) {
  return worker && isStaffRole(worker.role);
}

export function requireAdmin(worker) {
  return worker && worker.role === 'admin';
}

export async function verifyOrderOwnership(orderId, workerId) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('assigned_worker_id, locked_by')
    .eq('order_id', orderId)
    .single();

  if (!data) return false;
  return data.assigned_worker_id === workerId || data.locked_by === workerId;
}
