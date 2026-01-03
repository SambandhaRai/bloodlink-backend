import z from "zod";

export const UserSchema = z.object ({
    fullName: z.string().trim().min(2, "Full name should be more than 2 characters"),
    phoneNumber: z.string().trim().min(10, "Phone number can't be less than 10").max(10, "Phone number can't be more than 10"),
    dob: z.date(),
    gender: z.string().trim(),
    bloodGroup: z.string().trim(),
    healthCondition: z.string().optional(),
        email: z.string().email(),
    password: z.string().trim().min(6, "Password can't be less than 6 characters"),
    role: z.enum(['admin','user']).default('user'),
});

export type UserType = z.infer<typeof UserSchema>;