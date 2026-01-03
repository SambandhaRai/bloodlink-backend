import z from "zod";
import { UserSchema } from "../types/user.type";

const parseToDate = z.preprocess((val) => {
  if (typeof val === "string" || val instanceof Date) return new Date(val);
  return undefined;
}, z.date());

const AdultDate = parseToDate.refine((d: Date) => {
  const age = new Date(Date.now() - d.getTime()).getUTCFullYear() - 1970;
  return age >= 18;
}, { message: "User must be 18 or older" });

export const CreateUserDto = UserSchema.pick(
    {
        fullName: true,
        phoneNumber: true,
        dob: true,
        gender: true,
        bloodGroup: true,
        healthCondition: true,
        email: true,
        password: true,
    }
).extend(
    {
        dob: AdultDate,
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
        bloodGroup: true,
        healthCondition: true,
        email: true,
        password: true,
    }
).partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;

// Login
export const LoginUserDto = z.object({
    email: z.string().email(),
    password: z.string().trim().min(6, "Password can't be less than 6 characters"),
});
export type LoginUserDto = z.infer<typeof LoginUserDto>;