import z from "zod";
import { BloodGroupSchema } from "../types/blood.type";

export const CreateBloodGroupDto = BloodGroupSchema.pick(
    {
        bloodGroup: true
    }
);
export type CreateBloodGroupDto = z.infer<typeof CreateBloodGroupDto>;

export const UpdateBloodGroupDto = CreateBloodGroupDto.partial();
export type UpdateBloodGroupDto = z.infer<typeof UpdateBloodGroupDto>;
