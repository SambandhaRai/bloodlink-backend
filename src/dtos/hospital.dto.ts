import z from "zod";
import { HospitalSchema } from "../types/hospital.type";

export const CreateHospitalDto = HospitalSchema.pick({
  name: true,
  location: true,
});
export type CreateHospitalDto = z.infer<typeof CreateHospitalDto>;

export const UpdateHospitalDto = HospitalSchema.pick({
  name: true,
  location: true,
}).extend({
  isActive: z.boolean().optional(),
}).partial();

export type UpdateHospitalDto = z.infer<typeof UpdateHospitalDto>;
