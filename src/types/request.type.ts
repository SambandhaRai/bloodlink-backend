import z from "zod";

export const RequestSchema = z.object({
    recipientBloodId: z.string().trim(),
    recipientDetails: z.string(),
    recipientCondition: z.string(),
    hospitalId: z.string().trim(),
    recipientId: z.string().trim(),
    donorId: z.string().trim(),
    requestStatus: z.enum(['pending','accepted','finished']).default('pending'),
});

export type RequestType = z.infer<typeof RequestSchema>;