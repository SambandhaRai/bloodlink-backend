import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

describe(
    "Authentication Integration Tests",
    () => {
        const testUser = {
            fullName: "test",
            phoneNumber: "9851009077",
            dob: "2000-01-01",
            gender: "Male",
            bloodId: "507f1f77bcf86cd799439011",
            healthCondition: "test",
            email: "test@email.com",
            password: "test123",
            confirmPassword: "test123",
            profilePicture: "",
        };

        const under18User = {
            ...testUser,
            phoneNumber: "9851009070",
            email: "test2@email.com",
            dob: "2011-01-01",
        };

        const samePhoneDifferentEmail = {
            ...testUser,
            phoneNumber: "9851212277",
            email: "another@email.com",
        };

        beforeAll(async () => {
            await UserModel.deleteMany({ email: testUser.email });
            await UserModel.deleteMany({ email: under18User.email });
            await UserModel.deleteMany({ email: samePhoneDifferentEmail.email });
        });
        afterAll(async () => {
            await UserModel.deleteMany({ email: testUser.email });
            await UserModel.deleteMany({ email: under18User.email });
            await UserModel.deleteMany({ email: samePhoneDifferentEmail.email });
        });

        describe(
            "POST /api/auth/register",
            () => {
                test(
                    "Should register a new user successfully",
                    async () => {
                        const response = await request(app)
                            .post('/api/auth/register')
                            .send(testUser)

                        expect(response.status).toBe(201);
                        expect(response.body).toHaveProperty("data");
                    }
                );

                test(
                    "Should fail to register a user with existing email",
                    async () => {
                        const response = await request(app)
                            .post('/api/auth/register')
                            .send(testUser)

                        expect(response.status).toBe(403);
                        expect(response.body).toHaveProperty("message", "Email is already in use");
                    }
                );

                test(
                    "Should fail to register a user with existing phone number",
                    async () => {
                        const response = await request(app)
                            .post('/api/auth/register')
                            .send(samePhoneDifferentEmail)

                        expect(response.status).toBe(403);
                        expect(response.body).toHaveProperty("message", "Phone Number is already in use");
                    }
                );

                test(
                    "Should fail to register a user below the age of 18",
                    async () => {
                        const response = await request(app)
                            .post('/api/auth/register')
                            .send(under18User)

                        expect(response.status).toBe(403);
                        expect(response.body).toHaveProperty("message", "User must be at least 18 years old");
                    }
                );
            }
        )
    }
)