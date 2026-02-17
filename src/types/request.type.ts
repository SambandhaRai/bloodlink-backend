import z from "zod";

export const RequestSchema = z.object({
    recipientBloodId: z.string().trim(),
    recipientDetails: z.string(),
    recipientCondition: z.enum(["critical", "urgent", "stable"]),
    hospitalId: z.string().trim(),

    postedBy: z.string().trim(),

    requestFor: z.enum(["self", "others"]).default("self"),
    relationToPatient: z.string().trim().min(2).optional(),
    patientName: z.string().trim().min(2).optional(),
    patientPhone: z.string().trim().min(6).optional(),

    donorId: z.string().trim().optional(),

    requestStatus: z.enum(['pending', 'accepted', 'finished']).default('pending'),
});

export type RequestType = z.infer<typeof RequestSchema>;