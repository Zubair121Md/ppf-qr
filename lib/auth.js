import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './db';
import { getJwtSecret } from './env';

const TOKEN_COOKIE = 'farmscan_token';
const JWT_EXPIRY = '7d';

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request) {
  return request.cookies.get(TOKEN_COOKIE)?.value || null;
}

export async function getWorkerFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded?.worker_id) return null;

  const { data: worker } = await supabaseAdmin
    .from('workers')
    .select('*')
    .eq('worker_id', decoded.worker_id)
    .eq('is_active', true)
    .single();

  return worker || null;
}

export function setAuthCookie(response, token) {
  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export function clearAuthCookie(response) {
  response.cookies.set(TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
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

  const { data: worker } = await supabaseAdmin
    .from('workers')
    .select('*')
    .eq('worker_id', decoded.worker_id)
    .eq('is_active', true)
    .single();

  return worker || null;
}

export const STAFF_ROLES = ['manager', 'admin'];

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function requireStaff(worker) {
  return worker && isStaffRole(worker.role);
}

export function requireAdmin(worker) {
  return worker && worker.role === 'admin';
}
