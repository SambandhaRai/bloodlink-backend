const mockUserRepository = {
    createUser: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    updateOneUser: jest.fn(),
    deleteOneUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserbyPhoneNumber: jest.fn(),
    uploadProfilePicture: jest.fn(),
    updateUserLocation: jest.fn(),
    lockDonorActiveRequest: jest.fn(),
    unlockDonorActiveRequest: jest.fn(),
};

const mockBcrypt = {
    hash: jest.fn(),
    compare: jest.fn(),
};

const mockJwt = {
    sign: jest.fn(),
    verify: jest.fn(),
};

const mockSendEmail = jest.fn();

const mockFs = {
    existsSync: jest.fn(),
    promises: {
        unlink: jest.fn(),
    },
};

jest.mock("../../repositories/user.repository", () => ({
    UserRepository: jest.fn(() => mockUserRepository),
}));

jest.mock("bcryptjs", () => ({
    __esModule: true,
    default: mockBcrypt,
}));

jest.mock("jsonwebtoken", () => ({
    __esModule: true,
    default: mockJwt,
}));

jest.mock("../../config/email", () => ({
    sendEmail: mockSendEmail,
}));

jest.mock("fs", () => ({
    __esModule: true,
    ...mockFs,
    default: mockFs,
}));

import mongoose from "mongoose";
import { UserService } from "../../services/user.service";

describe("UserService Unit Tests", () => {
    const userService = new UserService();

    beforeEach(() => {
        jest.clearAllMocks();
        mockFs.existsSync.mockReturnValue(false);
    });

    describe("registerUser", () => {
        test("should throw when email already exists", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue({ _id: "u1" });

            await expect(
                userService.registerUser({
                    fullName: "Unit User",
                    phoneNumber: "9851009901",
                    dob: new Date("2000-01-01"),
                    gender: "Male",
                    bloodId: new mongoose.Types.ObjectId().toString(),
                    healthCondition: "none",
                    email: "exists@test.com",
                    password: "test123",
                    confirmPassword: "test123",
                })
            ).rejects.toMatchObject({ statusCode: 403, message: "Email is already in use" });
        });

        test("should hash password and create user for valid data", async () => {
            const createdUser = { _id: "u2", email: "new@test.com" };
            const bloodId = new mongoose.Types.ObjectId().toString();

            mockUserRepository.getUserByEmail.mockResolvedValue(null);
            mockUserRepository.getUserbyPhoneNumber.mockResolvedValue(null);
            mockBcrypt.hash.mockResolvedValue("hashed-password");
            mockUserRepository.createUser.mockResolvedValue(createdUser);

            const result = await userService.registerUser({
                fullName: "Unit User",
                phoneNumber: "9851009902",
                dob: new Date("2000-01-01"),
                gender: "Male",
                bloodId,
                healthCondition: "none",
                email: "new@test.com",
                password: "test123",
                confirmPassword: "test123",
            });

            expect(mockBcrypt.hash).toHaveBeenCalledWith("test123", 10);
            expect(mockUserRepository.createUser).toHaveBeenCalled();
            const payload = mockUserRepository.createUser.mock.calls[0][0];
            expect(payload.password).toBe("hashed-password");
            expect(payload.bloodId).toBeInstanceOf(mongoose.Types.ObjectId);
            expect(result).toEqual(createdUser);
        });

        test("should throw when phone number already exists", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(null);
            mockUserRepository.getUserbyPhoneNumber.mockResolvedValue({ _id: "u9" });

            await expect(
                userService.registerUser({
                    fullName: "Unit User",
                    phoneNumber: "9851009909",
                    dob: new Date("2000-01-01"),
                    gender: "Male",
                    bloodId: new mongoose.Types.ObjectId().toString(),
                    healthCondition: "none",
                    email: "phone-exists@test.com",
                    password: "test123",
                    confirmPassword: "test123",
                })
            ).rejects.toMatchObject({ statusCode: 403, message: "Phone Number is already in use" });
        });

        test("should throw when user is below 18", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(null);
            mockUserRepository.getUserbyPhoneNumber.mockResolvedValue(null);

            await expect(
                userService.registerUser({
                    fullName: "Teen User",
                    phoneNumber: "9851009910",
                    dob: new Date("2012-01-01"),
                    gender: "Male",
                    bloodId: new mongoose.Types.ObjectId().toString(),
                    healthCondition: "none",
                    email: "teen@test.com",
                    password: "test123",
                    confirmPassword: "test123",
                })
            ).rejects.toMatchObject({ statusCode: 403, message: "User must be at least 18 years old" });
        });
    });

    describe("loginUser", () => {
        test("should return token when credentials are valid", async () => {
            const existingUser = {
                _id: new mongoose.Types.ObjectId(),
                email: "user@test.com",
                phoneNumber: "9851009903",
                role: "user",
                password: "hashed",
            };
            mockUserRepository.getUserByEmail.mockResolvedValue(existingUser);
            mockBcrypt.compare.mockResolvedValue(true);
            mockJwt.sign.mockReturnValue("jwt-token");

            const result = await userService.loginUser({
                email: "user@test.com",
                password: "test123",
            });

            expect(mockBcrypt.compare).toHaveBeenCalledWith("test123", "hashed");
            expect(mockJwt.sign).toHaveBeenCalled();
            expect(result).toEqual({ token: "jwt-token", existingUser });
        });

        test("should throw when password is invalid", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue({
                _id: "u3",
                email: "user@test.com",
                password: "hashed",
            });
            mockBcrypt.compare.mockResolvedValue(false);

            await expect(
                userService.loginUser({ email: "user@test.com", password: "wrong123" })
            ).rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
        });

        test("should throw when user does not exist", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(null);

            await expect(
                userService.loginUser({ email: "missing@test.com", password: "test123" })
            ).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
        });
    });

    describe("getUserById", () => {
        test("should return user when found", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const user = { _id: userId, email: "found@test.com" };
            mockUserRepository.getUserById.mockResolvedValue(user);

            const result = await userService.getUserById(userId);

            expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
            expect(result).toEqual(user);
        });

        test("should throw when user is not found", async () => {
            mockUserRepository.getUserById.mockResolvedValue(null);

            await expect(
                userService.getUserById(new mongoose.Types.ObjectId().toString())
            ).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
        });
    });

    describe("updateUser", () => {
        test("should throw when email is already in use by another user", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            mockUserRepository.getUserById.mockResolvedValue({ _id: userId, email: "old@test.com" });
            mockUserRepository.getUserByEmail.mockResolvedValue({ _id: "another-user" });

            await expect(
                userService.updateUser(userId, { email: "taken@test.com" } as any)
            ).rejects.toMatchObject({ statusCode: 403, message: "Email already in use" });
        });

        test("should hash password and convert bloodId when updating user", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const bloodId = new mongoose.Types.ObjectId().toString();
            mockUserRepository.getUserById.mockResolvedValue({ _id: userId, email: "same@test.com" });
            mockBcrypt.hash.mockResolvedValue("updated-hash");
            mockUserRepository.updateOneUser.mockResolvedValue({ _id: userId, email: "same@test.com" });

            const result = await userService.updateUser(userId, {
                email: "same@test.com",
                password: "new12345",
                bloodId,
            } as any);

            expect(mockBcrypt.hash).toHaveBeenCalledWith("new12345", 10);
            const payload = mockUserRepository.updateOneUser.mock.calls[0][1];
            expect(payload.password).toBe("updated-hash");
            expect(payload.bloodId).toBeInstanceOf(mongoose.Types.ObjectId);
            expect(result).toEqual({ _id: userId, email: "same@test.com" });
        });
    });

    describe("updateUserLocation", () => {
        test("should throw when longitude is invalid", async () => {
            await expect(
                userService.updateUserLocation(new mongoose.Types.ObjectId().toString(), 200, 27.7)
            ).rejects.toMatchObject({ statusCode: 400, message: "Invalid longitude" });
        });

        test("should update location for valid inputs", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const updatedUser = { _id: userId, location: { type: "Point", coordinates: [85.32, 27.71] } };
            mockUserRepository.updateUserLocation.mockResolvedValue(updatedUser);

            const result = await userService.updateUserLocation(userId, 85.32, 27.71);

            expect(mockUserRepository.updateUserLocation).toHaveBeenCalledWith(userId, 85.32, 27.71);
            expect(result).toEqual(updatedUser);
        });
    });

    describe("uploadProfilePicture", () => {
        test("should throw when file is missing", async () => {
            await expect(
                userService.uploadProfilePicture(new mongoose.Types.ObjectId().toString())
            ).rejects.toMatchObject({ statusCode: 400, message: "Please upload a file" });
        });

        test("should persist uploaded file name", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const file = { filename: "profile-new.jpg" } as Express.Multer.File;
            const existingUser = { _id: userId, profilePicture: "" };
            const updatedUser = { _id: userId, profilePicture: "profile-new.jpg" };

            mockUserRepository.getUserById.mockResolvedValue(existingUser);
            mockUserRepository.uploadProfilePicture.mockResolvedValue(updatedUser);

            const result = await userService.uploadProfilePicture(userId, file);

            expect(mockUserRepository.uploadProfilePicture).toHaveBeenCalledWith(userId, "profile-new.jpg");
            expect(result).toEqual(updatedUser);
        });

        test("should delete old profile file when it exists", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const file = { filename: "profile-next.jpg" } as Express.Multer.File;
            mockUserRepository.getUserById.mockResolvedValue({ _id: userId, profilePicture: "old.jpg" });
            mockUserRepository.uploadProfilePicture.mockResolvedValue({ _id: userId, profilePicture: "profile-next.jpg" });
            mockFs.existsSync.mockReturnValue(true);

            await userService.uploadProfilePicture(userId, file);

            expect(mockFs.promises.unlink).toHaveBeenCalled();
            expect(mockUserRepository.uploadProfilePicture).toHaveBeenCalledWith(userId, "profile-next.jpg");
        });
    });

    describe("sendResetPasswordEmail", () => {
        test("should send reset email when user exists", async () => {
            const user = { _id: new mongoose.Types.ObjectId(), email: "mail@test.com" };
            mockUserRepository.getUserByEmail.mockResolvedValue(user);
            mockJwt.sign.mockReturnValue("reset-token");

            const result = await userService.sendResetPasswordEmail("mail@test.com");

            expect(mockJwt.sign).toHaveBeenCalled();
            expect(mockSendEmail).toHaveBeenCalled();
            expect(result).toEqual(user);
        });

        test("should throw when email is not provided", async () => {
            await expect(userService.sendResetPasswordEmail()).rejects.toMatchObject({
                statusCode: 400,
                message: "Email is required",
            });
        });

        test("should throw when user for reset email is not found", async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(null);

            await expect(
                userService.sendResetPasswordEmail("missing@test.com")
            ).rejects.toMatchObject({ statusCode: 404, message: "User not found" });
        });
    });

    describe("resetPassword", () => {
        test("should hash new password and update user", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            mockJwt.verify.mockReturnValue({ id: userId });
            mockUserRepository.getUserById.mockResolvedValue({ _id: userId, email: "r@test.com" });
            mockBcrypt.hash.mockResolvedValue("new-hash");
            mockUserRepository.updateOneUser.mockResolvedValue({ _id: userId });

            await userService.resetPassword("valid-token", "newpass123");

            expect(mockBcrypt.hash).toHaveBeenCalledWith("newpass123", 10);
            expect(mockUserRepository.updateOneUser).toHaveBeenCalledWith(userId, { password: "new-hash" });
        });

        test("should throw invalid or expired token when verify fails", async () => {
            mockJwt.verify.mockImplementation(() => {
                throw new Error("invalid token");
            });

            await expect(
                userService.resetPassword("bad-token", "newpass123")
            ).rejects.toMatchObject({ statusCode: 400, message: "Invalid or expired token" });
        });

        test("should throw invalid or expired token when token or password is missing", async () => {
            await expect(
                userService.resetPassword(undefined, "newpass123")
            ).rejects.toMatchObject({ statusCode: 400, message: "Invalid or expired token" });
        });

        test("should throw invalid or expired token when decoded user is not found", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            mockJwt.verify.mockReturnValue({ id: userId });
            mockUserRepository.getUserById.mockResolvedValue(null);

            await expect(
                userService.resetPassword("valid-token", "newpass123")
            ).rejects.toMatchObject({ statusCode: 400, message: "Invalid or expired token" });
        });
    });
});
