import z from "zod";

export const BloodGroupSchema = z.object({
    bloodGroup : z.string().trim()
});

export type BloodGroupType = z.infer<typeof BloodGroupSchema>;