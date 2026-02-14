import z from "zod";

export const HospitalSchema = z.object({
    name: z.string(),
    location: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([
            z.number(), // longitude
            z.number(), // latitude
        ]),
    }),
});

export type HospitalType = z.infer<typeof HospitalSchema>;