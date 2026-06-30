import { z } from 'zod';

export const zIsoDatetime = z.coerce.date();
(zIsoDatetime as any)._zod.toJSONSchema = () => {
  return { type: 'string', format: 'date-time' };
};

export const zDate = z.date();
(zDate as any)._zod.toJSONSchema = () => {
  return { type: 'string', format: 'date-time' };
};
