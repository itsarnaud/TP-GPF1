import * as z from 'zod';

const SessionDayEnum = z.enum(['FRIDAY', 'SATURDAY', 'SUNDAY']);
const TypeEnum = z.enum(['PRACTICE', 'QUALIFYING', 'SPRINT', 'RACE']);

const SessionSchema = z.object({
  day: SessionDayEnum,
  date: z.iso.datetime(),
  type: TypeEnum,
  priceMultiplier: z.number().positive().optional(),
});

export { SessionSchema };
