import z from "zod";
import { UserSchema } from "../types/user.type";

const parseToDate = z.preprocess((val) => {
    if (typeof val === "string" || val instanceof Date) return new Date(val);
    return undefined;
}, z.date());

export const CreateUserDto = UserSchema.pick(
    {
        fullName: true,
        phoneNumber: true,
        dob: true,
        gender: true,
        bloodId: true,
        healthCondition: true,
        email: true,
        password: true,
    }
).extend(
    {
        dob: parseToDate,
        confirmPassword: z.string().trim().min(6),
    }
).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }
);
export type CreateUserDto = z.infer<typeof CreateUserDto>;

export const UpdateUserDto = UserSchema.pick(
    {
        fullName: true,
        phoneNumber: true,
        dob: true,
        gender: true,
        bloodId: true,
        healthCondition: true,
        email: true,
        password: true,
    }
).extend({ dob: parseToDate.optional() }).partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

// Login
export const LoginUserDto = z.object({
    email: z.email(),
    password: z.string().trim().min(6, "Password can't be less than 6 characters"),
});
export type LoginUserDto = z.infer<typeof LoginUserDto>;