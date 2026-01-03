import { z } from 'zod';

// User validation
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  image: z.string().url().optional().or(z.literal('')),
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

// Instrument Availability validation
export const createInstrumentAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6), // 0=Domingo, 1=Lunes, ..., 6=Sábado
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido. Use HH:mm'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido. Use HH:mm'),
  isAvailable: z.boolean().default(true),
}).refine((data) => {
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endTime'],
});

export const updateInstrumentAvailabilitySchema = z.array(createInstrumentAvailabilitySchema).optional();

// Post validation
export const createPostSchema = z.object({
  instrumentId: z.string().min(1),
  city: z.string().min(1).max(500), // Aumentado para permitir direcciones completas
  areaText: z.string().max(200).optional(), // Aumentado para zonas/barrios más largos
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

// Request validation
export const createRequestSchema = z.object({
  postId: z.string().min(1),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(2000),
  accessories: z.string().max(500).optional(),
}).refine((data) => {
  const from = new Date(data.fromDate);
  const to = new Date(data.toDate);
  return to > from;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['toDate'],
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED']),
});

