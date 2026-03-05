import z from "zod";

const GeoPointSchema = z.object({
    type: z.literal("Point").default("Point"),
    // GeoJSON format: [longitude, latitude]
    coordinates: z.tuple([z.number(), z.number()]),
});

export const UserSchema = z.object({
    fullName: z.string().trim().min(2, "Full name should be more than 2 characters"),
    phoneNumber: z.string().trim().min(10, "Phone number can't be less than 10").max(10, "Phone number can't be more than 10"),
    dob: z.coerce.date(),
    gender: z.string().trim(),
    bloodId: z.string().trim(),
    healthCondition: z.string().optional(),
    email: z.email(),
    password: z.string().trim().min(6, "Password can't be less than 6 characters"),
    profilePicture: z.string().optional(),
    activeAcceptedRequestId: z.string().trim().nullable().optional(),
    role: z.enum(['admin', 'user']).default('user'),
    location: GeoPointSchema.optional(),
});

export type UserType = z.infer<typeof UserSchema>;
