import * as z from 'zod';

const CategoryEnum = z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);

const GrandstandSchema = z.object({
  name: z.string().trim().min(2),
  location: z.string().trim().min(2),
  category: CategoryEnum,
  capacity: z.number().int().min(1),
  basePrice: z.number(),
  isCovered: z.boolean(),
});

const GrandstandQuerySchema = z.object({
  category: CategoryEnum.optional(),
});

export { GrandstandSchema, GrandstandQuerySchema };
