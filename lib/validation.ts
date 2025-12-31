import { z } from 'zod';

// User validation
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  whatsappUrl: z.string().url().optional().or(z.literal('')),
  addressText: z.string().max(200).optional(),
  locationText: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  termsAccepted: z.boolean().optional(),
});

// Auth validation
export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Instrument validation
export const createInstrumentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(5).max(5000),
  categoryId: z.string().min(1),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  extras: z.string().max(1000).optional(),
});

export const updateInstrumentSchema = createInstrumentSchema.partial();

// Instrument Location validation
export const createInstrumentLocationSchema = z.object({
  city: z.string().min(1).max(100),
  areaText: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isPrimary: z.boolean().default(false),
});

// Post validation
export const createPostSchema = z.object({
  instrumentId: z.string().min(1),
  city: z.string().min(1).max(100),
  areaText: z.string().max(100).optional(),
  // expiresAt se calcula automáticamente (30 días)
});

export const updatePostStatusSchema = z.object({
  status: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'BANNED', 'EXPIRED']),
});

// Search validation
export const searchPostsSchema = z.object({
  city: z.string().max(100).optional(),
  categoryId: z.string().optional(),
  search: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0).max(100).optional(), // km
});

