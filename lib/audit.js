import { supabaseAdmin } from './db';

export async function logEvent({
  event_type,
  actor_id = null,
  actor_role = null,
  target_type = null,
  target_id = null,
  ip_address = null,
  user_agent = null,
  details = {},
  success = true,
}) {
  try {
    await supabaseAdmin.from('audit_log').insert({
      event_type,
      actor_id,
      actor_role,
      target_type,
      target_id,
      ip_address,
      user_agent,
      details,
      success,
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export function getRequestMeta(request) {
  return {
    ip_address:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    user_agent: request.headers.get('user-agent')?.slice(0, 200) || 'unknown',
  };
}
