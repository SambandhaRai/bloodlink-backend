import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { BloodGroupModel } from "../../models/blood.model";
import bcryptjs from "bcryptjs";

describe("Admin User Integration Tests", () => {
    const bloodId = "507f1f77bcf86cd799439011";

    const adminUser = {
        fullName: "Admin Test",
        phoneNumber: "9851009100",
        dob: new Date("2000-01-01"),
        gender: "Male",
        bloodId,
        healthCondition: "none",
        email: "admin@test.com",
        password: "admin123",
        role: "admin",
        profilePicture: "",
    };

    const user1 = {
        fullName: "User One",
        phoneNumber: "9851009101",
        dob: "2000-01-01",
        gender: "Male",
        bloodId,
        healthCondition: "none",
        email: "user1@test.com",
        password: "test123",
        confirmPassword: "test123",
        profilePicture: "",
    };

    const user2 = {
        fullName: "User Two",
        phoneNumber: "9851009102",
        dob: "2000-01-01",
        gender: "Female",
        bloodId,
        healthCondition: "none",
        email: "user2@test.com",
        password: "test123",
        confirmPassword: "test123",
        profilePicture: "",
    };

    const bloodGroupPayload = { bloodGroup: "A+" };

    let adminToken: string;
    let userToken: string;
    let user1Id: string;
    let user2Id: string;

    beforeAll(async () => {
        // cleanup first
        await UserModel.deleteMany({
            $or: [
                { email: adminUser.email },
                { email: user1.email },
                { email: user2.email },
                { phoneNumber: adminUser.phoneNumber },
                { phoneNumber: user1.phoneNumber },
                { phoneNumber: user2.phoneNumber },
            ],
        });

        await BloodGroupModel.deleteMany({ bloodGroup: bloodGroupPayload.bloodGroup });

        const hashed = await bcryptjs.hash(adminUser.password, 10);
        await UserModel.create({
            fullName: adminUser.fullName,
            phoneNumber: adminUser.phoneNumber,
            dob: adminUser.dob,
            gender: adminUser.gender,
            bloodId: adminUser.bloodId,
            healthCondition: adminUser.healthCondition,
            email: adminUser.email,
            password: hashed,
            role: "admin",
            profilePicture: adminUser.profilePicture,
        });

        const register1 = await request(app).post("/api/auth/register").send(user1);
        expect(register1.status).toBe(201);

        const register2 = await request(app).post("/api/auth/register").send(user2);
        expect(register2.status).toBe(201);

        // login admin to get token
        const adminLogin = await request(app).post("/api/auth/login").send({
            email: adminUser.email,
            password: adminUser.password,
        });
        expect(adminLogin.status).toBe(201);
        expect(adminLogin.body).toHaveProperty("token");
        adminToken = adminLogin.body.token;

        // login normal user to test adminOnly blocking
        const userLogin = await request(app).post("/api/auth/login").send({
            email: user1.email,
            password: user1.password,
        });
        expect(userLogin.status).toBe(201);
        userToken = userLogin.body.token;

        // get ids
        const dbUser1 = await UserModel.findOne({ email: user1.email });
        const dbUser2 = await UserModel.findOne({ email: user2.email });
        user1Id = dbUser1?._id.toString() ?? "";
        user2Id = dbUser2?._id.toString() ?? "";
        expect(user1Id).toBeTruthy();
        expect(user2Id).toBeTruthy();
    });

    afterAll(async () => {
        await UserModel.deleteMany({
            $or: [
                { email: adminUser.email },
                { email: user1.email },
                { email: user2.email },
                { phoneNumber: adminUser.phoneNumber },
                { phoneNumber: user1.phoneNumber },
                { phoneNumber: user2.phoneNumber },
            ],
        });

        await BloodGroupModel.deleteMany({ bloodGroup: bloodGroupPayload.bloodGroup });
    });

    describe("POST /api/admin/bloodGroups/create", () => {
        test("Should create a new blood group (admin only)", async () => {
            const response = await request(app)
                .post("/api/admin/bloodGroups/create")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(bloodGroupPayload);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("bloodGroup", bloodGroupPayload.bloodGroup);
        });

        test("Should fail to create duplicate blood group", async () => {
            const response = await request(app)
                .post("/api/admin/bloodGroups/create")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(bloodGroupPayload);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty("message", "Blood Group already exists");
        });

        test("Should block non-admin user", async () => {
            const response = await request(app)
                .post("/api/admin/bloodGroups/create")
                .set("Authorization", `Bearer ${userToken}`)
                .send({ bloodGroup: "B+" });

            expect([401, 403]).toContain(response.status);
        });

        test("Should fail without token", async () => {
            const response = await request(app)
                .post("/api/admin/bloodGroups/create")
                .send({ bloodGroup: "O+" });

            expect([400, 401, 403]).toContain(response.status);
        });
    });

    describe("GET /api/admin/users", () => {
        test("Should fetch all users (admin only)", async () => {
            const response = await request(app)
                .get("/api/admin/users?page=1&size=10&search=")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("data");
            expect(Array.isArray(response.body.data)).toBe(true);

            expect(response.body).toHaveProperty("pagination");
            expect(response.body.pagination).toHaveProperty("page", 1);
            expect(response.body.pagination).toHaveProperty("size", 10);
            expect(response.body.pagination).toHaveProperty("total");
            expect(response.body.pagination).toHaveProperty("totalPages");
        });

        test("Should block non-admin user", async () => {
            const response = await request(app)
                .get("/api/admin/users?page=1&size=10")
                .set("Authorization", `Bearer ${userToken}`);

            expect([401, 403]).toContain(response.status);
        });
    });

    describe("GET /api/admin/users/:id", () => {
        test("Should fetch a single user (admin only)", async () => {
            const response = await request(app)
                .get(`/api/admin/users/${user1Id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("_id", user1Id);
            expect(response.body.data).toHaveProperty("email", user1.email);
        });

        test("Should return 404 for non-existing user", async () => {
            const response = await request(app)
                .get(`/api/admin/users/507f1f77bcf86cd799439099`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("message", "User not found");
        });
    });

    describe("PUT /api/admin/users/:id", () => {
        test("Should update a user (admin only)", async () => {
            const response = await request(app)
                .put(`/api/admin/users/${user1Id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    fullName: "User One Updated",
                    healthCondition: "updated",
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("message", "User updated successfully");
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("fullName", "User One Updated");
        });

        test("Should fail if bloodId is invalid (admin only)", async () => {
            const response = await request(app)
                .put(`/api/admin/users/${user1Id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    bloodId: "invalid-blood-id",
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Invalid bloodId");
        });

        test("Should block non-admin user", async () => {
            const response = await request(app)
                .put(`/api/admin/users/${user1Id}`)
                .set("Authorization", `Bearer ${userToken}`)
                .send({ fullName: "Hacker Update" });

            expect([401, 403]).toContain(response.status);
        });
    });

    describe("DELETE /api/admin/users/:id", () => {
        test("Should delete a user (admin only)", async () => {
            const response = await request(app)
                .delete(`/api/admin/users/${user2Id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("message", "User deleted successfully");

            const check = await UserModel.findById(user2Id);
            expect(check).toBeNull();
        });

        test("Should return 404 when deleting non-existing user", async () => {
            const response = await request(app)
                .delete(`/api/admin/users/507f1f77bcf86cd799439099`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("message", "User not found");
        });

        test("Should block non-admin user", async () => {
            const response = await request(app)
                .delete(`/api/admin/users/${user1Id}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect([401, 403]).toContain(response.status);
        });
    });
});
