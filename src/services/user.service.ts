import { CreateUserDto, LoginUserDto, UpdateUserDto } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

let userRepository = new UserRepository();

export class UserService {
    async registerUser(data: CreateUserDto){
        const checkEmail = await userRepository.getUserByEmail(data.email);
        if(checkEmail) {
            throw new HttpError(403, "Email is already in use");
        }
        const checkPhone = await userRepository.getUserbyPhoneNumber(data.phoneNumber);
        if(checkPhone) {
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
        const newUser = await userRepository.createUser(data);

        return newUser;
    }

    async loginUser(data: LoginUserDto){
        const existingUser = await userRepository.getUserByEmail(data.email);
        if(!existingUser) {
            throw new HttpError(404, "User not found");
        }
        const isPassword = await bcryptjs.compare(data.password, existingUser.password);
        if(!isPassword) {
            throw new HttpError(401, "Invalid credentials");
        }
        const payload = {
            id: existingUser._id,
            phoneNumber: existingUser.phoneNumber,
            email: existingUser.email,
            role: existingUser.role
        };
        const token = jwt.sign( payload, JWT_SECRET, { expiresIn: "30d" } );

        return { token, existingUser };
    }

    async getUserById(userId: string) {
        const user = await userRepository.getUserById(userId);
        if(!user) {
            throw new HttpError(404, "User not found");
        }
        return user;
    }

    async updateUser(userId: string, data: UpdateUserDto) {
        const user = await userRepository.getUserById(userId);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        if(user.email !== data.email){
            const emailExists = await userRepository.getUserByEmail(data.email!);
            if(emailExists){
                throw new HttpError(403, "Email already in use");
            }
        }
        if(data.password){
            const hashedPassword = await bcryptjs.hash(data.password, 10);
            data.password = hashedPassword;
        }
        const updatedUser = await userRepository.updateOneUser(userId, data);
        return updatedUser;
    }
}