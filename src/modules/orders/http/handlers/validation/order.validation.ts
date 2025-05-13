import { z } from "zod";

export const validationOrderSchema = z.object({
  name: z.string().nonempty("Name is required."),
  description: z.string().nonempty("Description is required."),
});
