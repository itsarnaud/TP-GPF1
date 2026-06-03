import * as z from 'zod';

const LoyaltyProgramEnum = z.enum(['NONE', 'SILVER', 'GOLD']);

const SpectatorSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  birthDate: z.iso.date().refine((val) => new Date(val) < new Date(), {
    message: 'birthDate must be in the past',
  }),
  loyaltyProgram: LoyaltyProgramEnum,
});

export { SpectatorSchema };
