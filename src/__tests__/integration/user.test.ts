import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";

describe("User Integration Tests", () => {
    const testUser = {
        fullName: "User Test",
        phoneNumber: "9851009001",
        dob: "2000-01-01",
        gender: "Male",
        bloodId: "507f1f77bcf86cd799439011",
        healthCondition: "none",
        email: "user@test.com",
        password: "test123",
        confirmPassword: "test123",
        profilePicture: "",
    };

    let token: string;
    let userId: string;

    beforeAll(async () => {
        // cleanup before tests
        await UserModel.deleteMany({ email: testUser.email });

        // register
        await request(app)
            .post("/api/auth/register")
            .send(testUser);

        // login
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        token = response.body.token;
        userId = response.body.data._id;
    });

    afterAll(async () => {
        await UserModel.deleteMany({ email: testUser.email });
    });

    describe("GET /api/user/profile", () => {
        test("Should fetch logged-in user profile", async () => {
            const response = await request(app)
                .get("/api/user/profile")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("email", testUser.email);
        });

        test("Should fail without token", async () => {
            const response = await request(app)
                .get("/api/user/profile");

            expect([400, 401, 403]).toContain(response.status);
        });
    });

    describe("PUT /api/user/update-profile", () => {
        test("Should update user profile successfully", async () => {
            const response = await request(app)
                .put("/api/user/update-profile")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    fullName: "Updated User",
                    email: testUser.email,
                    phoneNumber: testUser.phoneNumber,
                    dob: testUser.dob,
                    gender: testUser.gender,
                    bloodId: testUser.bloodId,
                    healthCondition: "updated condition",
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("fullName", "Updated User");
        });
    });

    describe("PATCH /api/user/location", () => {
        test("Should update user location successfully", async () => {
            const response = await request(app)
                .patch("/api/user/location")
                .set("Authorization", `Bearer ${token}`)
                .send({ lng: 85.324, lat: 27.7172 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("message", "Location updated successfully");
            expect(response.body.data).toHaveProperty("location");
            expect(response.body.data.location).toHaveProperty("coordinates");
        });
    });

    describe("PUT /api/user/profile/upload", () => {
        test("Should fail when file is missing", async () => {
            const response = await request(app)
                .put("/api/user/profile/upload")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("success", false);
            expect(response.body).toHaveProperty("message", "Please upload a file");
        });
    });

    describe("POST /api/user/request-password-reset", () => {
        test("Should fail when email is missing", async () => {
            const response = await request(app)
                .post("/api/user/request-password-reset")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Email is required");
        });

        test("Should fail when user is not found", async () => {
            const response = await request(app)
                .post("/api/user/request-password-reset")
                .send({ email: "missing_user_for_reset@test.com" });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("message", "User not found");
        });
    });

    describe("POST /api/user/reset-password/:token", () => {
        test("Should reset password successfully", async () => {
            const resetToken = jwt.sign(
                { id: userId },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            const response = await request(app)
                .post(`/api/user/reset-password/${resetToken}`)
                .send({ newPassword: "newpass123" });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty(
                "message",
                "Password has been reset successfully."
            );

            // confirm login works with new password
            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testUser.email,
                    password: "newpass123",
                });

            expect(loginResponse.status).toBe(201);
            expect(loginResponse.body).toHaveProperty("token");
        });

        test("Should fail with invalid token", async () => {
            const response = await request(app)
                .post("/api/user/reset-password/invalid-token")
                .send({ newPassword: "whatever123" });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty(
                "message",
                "Invalid or expired token"
            );
        });
    });
});
