import { z } from 'zod';

export const ProductIdSchema = z.string().regex(/^[A-Z]{2,6}-\d{3}$/, 'Invalid product ID format');
export const WorkerIdSchema = z.string().regex(/^WRK-[A-Z0-9-]+$/, 'Invalid worker ID');
export const OrderIdSchema = z.string().regex(/^(ORD|ORD-DEMO)-[\dA-Z-]+$/, 'Invalid order ID');

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password too long')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

export const WorkerPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password too long');

export const LoginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(72),
});

export const AssignOrderSchema = z.object({
  worker_id: z.string().regex(/^WRK-[A-Z0-9-]+$/).nullable(),
});

export const CreateWorkerSchema = z.object({
  worker_id: WorkerIdSchema,
  username: z.string().trim().min(2).max(32).regex(/^[a-z0-9]+$/),
  password: WorkerPasswordSchema,
  full_name: z.string().trim().min(1).max(200),
  preferred_lang: z.enum(['english', 'tamil', 'malayalam', 'hindi']).optional(),
  role: z.enum(['worker', 'manager', 'admin']).optional(),
});

export function parseBody(schema, body) {
  return schema.safeParse(body);
}

export function validationErrorResponse(result) {
  return {
    error: 'Invalid input',
    fields: result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })),
  };
}
