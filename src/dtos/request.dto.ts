import z from "zod";

export const CreateRequestDtoSchema = z.object({
    recipientBloodId: z.string().trim().min(1, "Blood ID is required"),
    recipientDetails: z.string().min(1, "Recipient details are required"),
    recipientCondition: z.string().min(1, "Recipient condition is required"),
    hospitalId: z.string().trim().min(1, "Hospital ID is required"),
});

export type CreateRequestDto = z.infer<typeof CreateRequestDtoSchema>;