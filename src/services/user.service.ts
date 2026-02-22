import { CreateUserDto, LoginUserDto, UpdateUserDto } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { sendEmail } from "../config/email";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const CLIENT_URL = process.env.CLIENT_URL as string;

let userRepository = new UserRepository();

export class UserService {
    async registerUser(data: CreateUserDto) {
        const checkEmail = await userRepository.getUserByEmail(data.email);
        if (checkEmail) {
            throw new HttpError(403, "Email is already in use");
        }
        const checkPhone = await userRepository.getUserbyPhoneNumber(data.phoneNumber);
        if (checkPhone) {
            throw new HttpError(403, "Phone Number is already in use");
        }
        // parse DOB
        const d = new Date(data.dob);
        if (Number.isNaN(d.getTime())) {
            throw new HttpError(400, "Invalid DOB");
        }
        // compute age
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
        // check age
        if (age < 18) {
            throw new HttpError(403, "User must be at least 18 years old");
        }
        const hashedPassword = await bcryptjs.hash(data.password, 10); // 10 complexity
        data.password = hashedPassword;
        const newUser = await userRepository.createUser({
            ...data,
            bloodId: new mongoose.Types.ObjectId(data.bloodId),
        } as any);

        return newUser;
    }

    async loginUser(data: LoginUserDto) {
        const existingUser = await userRepository.getUserByEmail(data.email);
        if (!existingUser) {
            throw new HttpError(404, "User not found");
        }
        const isPassword = await bcryptjs.compare(data.password, existingUser.password);
        if (!isPassword) {
            throw new HttpError(401, "Invalid credentials");
        }
        const payload = {
            id: existingUser._id,
            phoneNumber: existingUser.phoneNumber,
            email: existingUser.email,
            role: existingUser.role
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

        return { token, existingUser };
    }

    async getUserById(userId: string) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        return user;
    }

    async updateUser(userId: string, data: UpdateUserDto) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        if (user.email !== data.email) {
            const emailExists = await userRepository.getUserByEmail(data.email!);
            if (emailExists) {
                throw new HttpError(403, "Email already in use");
            }
        }
        if (data.password) {
            const hashedPassword = await bcryptjs.hash(data.password, 10);
            data.password = hashedPassword;
        }

        const payload: any = { ...data };
        if (data.bloodId) {
            payload.bloodId = new mongoose.Types.ObjectId(data.bloodId);
        }

        const updatedUser = await userRepository.updateOneUser(userId, payload);
        return updatedUser;
    }

    async uploadProfilePicture(userId: string, file?: Express.Multer.File) {
        if (!file) {
            throw new HttpError(400, "Please upload a file");
        }

        const fileName = file.filename;

        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }

        // delete old file if exists
        const oldFileName = user.profilePicture;
        if (oldFileName) {
            const uploadDir = path.join(process.cwd(), "uploads");
            const oldFilePath = path.join(uploadDir, oldFileName);

            if (fs.existsSync(oldFilePath)) {
                await fs.promises.unlink(oldFilePath);
            }
        }

        const updated = await userRepository.uploadProfilePicture(userId, fileName);
        if (!updated) {
            throw new HttpError(404, "User not found");
        }

        return updated;
    }

    async sendResetPasswordEmail(email?: string) {
        if (!email) {
            throw new HttpError(400, "Email is required");
        }
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
        const html = `
            <div style="max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff;border:1px solid #eee;border-radius:8px;overflow:hidden;">
            
            <!-- Header -->
            <div style="background:#A72636;color:#ffffff;padding:20px;text-align:center;">
                <h2 style="margin:0;font-size:22px;">Reset Your Password</h2>
            </div>

            <!-- Body -->
            <div style="padding:24px;color:#333333;line-height:1.6;">
                <p style="margin-top:0;">
                    We received a request to reset your account password.
                </p>

                <p>
                    Click the button below to set a new password. This link will expire in
                    <strong>1 hour</strong>.
                </p>

                <!-- Button -->
                <div style="text-align:center;margin:32px 0;">
                <a
                    href="${resetLink}"
                    style="
                    background:#A72636;
                    color:#ffffff;
                    text-decoration:none;
                    padding:14px 28px;
                    border-radius:6px;
                    display:inline-block;
                    font-weight:bold;
                    "
                >
                    Reset Password
                </a>
                </div>

                <p style="font-size:14px;color:#555;">
                    If you did not request a password reset, you can safely ignore this email.
                </p>
            </div>

            <!-- Footer -->
            <div style="background:#f7f7f7;padding:16px;text-align:center;font-size:12px;color:#777;">
                © ${new Date().getFullYear()} Blood Link. All rights reserved.
            </div>

            </div>
        `;

        await sendEmail(user.email, "Password Reset", html);
        return user;
    }

    async resetPassword(token?: string, newPassword?: string) {
        try {
            if (!token || !newPassword) {
                throw new HttpError(400, "Token and new password are required");
            }
            const decoded: any = jwt.verify(token, JWT_SECRET);
            const userId = decoded.id;
            const user = await userRepository.getUserById(userId);
            if (!user) {
                throw new HttpError(404, "User not found");
            }
            const hashedPassword = await bcryptjs.hash(newPassword, 10);
            await userRepository.updateOneUser(userId, { password: hashedPassword });
            return user;
        } catch (error) {
            throw new HttpError(400, "Invalid or expired token");
        }
    }
}