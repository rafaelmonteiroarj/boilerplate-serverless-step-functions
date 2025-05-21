import { z } from "zod";

export const validationOrderSchema = z.object({
  name: z.string().nonempty("Name is required."),
  description: z.string().nonempty("Description is required."),
  phoneNumber: z
    .string()
    .regex(/^\+\d{10,15}$/, "Phone number must be in international format")
    .optional(),
});
