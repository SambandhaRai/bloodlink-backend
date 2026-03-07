import z from "zod";
import { RequestSchema } from "../types/request.type";

export const CreateRequestDtoSchema = RequestSchema.pick({
    recipientBloodId: true,
    recipientDetails: true,
    recipientCondition: true,
    hospitalId: true,

    requestFor: true,
    relationToPatient: true,
    patientName: true,
    patientPhone: true,
}).superRefine((data, ctx) => {
    if (data.requestFor === "others") {
        if (!data.relationToPatient) {
            ctx.addIssue({
                code: "custom",
                message: "relationToPatient is required when requestFor is 'others'",
                path: ["relationToPatient"],
            });
        }
        if (!data.patientName) {
            ctx.addIssue({
                code: "custom",
                message: "patientName is required when requestFor is 'others'",
                path: ["patientName"],
            });
        }
        if (!data.patientPhone) {
            ctx.addIssue({
                code: "custom",
                message: "patientPhone is required when requestFor is 'others'",
                path: ["patientPhone"],
            });
        }
    }
});

export type CreateRequestDto = z.infer<typeof CreateRequestDtoSchema>;

export const UpdateRequestDtoSchema = RequestSchema.pick({
    recipientBloodId: true,
    recipientDetails: true,
    recipientCondition: true,
    hospitalId: true,
    requestFor: true,
    relationToPatient: true,
    patientName: true,
    patientPhone: true,
}).partial();

export type UpdateRequestDto = z.infer<typeof UpdateRequestDtoSchema>;
