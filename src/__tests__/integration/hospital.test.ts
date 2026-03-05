import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { HospitalModel } from "../../models/hospital.model";
import bcryptjs from "bcryptjs";

describe("Admin Hospital Integration Tests", () => {
    const bloodId = "507f1f77bcf86cd799439011";

    const adminUser = {
        fullName: "Admin Test",
        phoneNumber: "9851009200",
        dob: "2000-01-01",
        gender: "Male",
        bloodId,
        healthCondition: "none",
        email: "admin_hospital@test.com",
        password: "admin123",
        role: "admin",
        profilePicture: "",
    };

    const normalUser = {
        fullName: "User Test",
        phoneNumber: "9851009201",
        dob: "2000-01-01",
        gender: "Male",
        bloodId,
        healthCondition: "none",
        email: "user_hospital@test.com",
        password: "test123",
        confirmPassword: "test123",
        profilePicture: "",
    };

    const hospitalPayload = {
        name: "Test Hospital",
        location: {
            type: "Point",
            coordinates: [85.324, 27.7172], // [lng, lat]
        },
    };

    let adminToken: string;
    let userToken: string;
    let createdHospitalId: string;

    beforeAll(async () => {
        // cleanup users
        await UserModel.deleteMany({
            $or: [
                { email: adminUser.email },
                { email: normalUser.email },
                { phoneNumber: adminUser.phoneNumber },
                { phoneNumber: normalUser.phoneNumber },
            ],
        });

        // cleanup hospital
        await HospitalModel.deleteMany({ name: hospitalPayload.name });

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

        const registerUser = await request(app).post("/api/auth/register").send(normalUser);
        expect(registerUser.status).toBe(201);

        // login admin
        const adminLogin = await request(app).post("/api/auth/login").send({
            email: adminUser.email,
            password: adminUser.password,
        });
        expect(adminLogin.status).toBe(201);
        adminToken = adminLogin.body.token;

        // login normal user
        const userLogin = await request(app).post("/api/auth/login").send({
            email: normalUser.email,
            password: normalUser.password,
        });
        expect(userLogin.status).toBe(201);
        userToken = userLogin.body.token;
    });

    afterAll(async () => {
        // cleanup hospital
        if (createdHospitalId) {
            await HospitalModel.findByIdAndDelete(createdHospitalId);
        }
        await HospitalModel.deleteMany({ name: hospitalPayload.name });

        // cleanup users
        await UserModel.deleteMany({
            $or: [
                { email: adminUser.email },
                { email: normalUser.email },
                { phoneNumber: adminUser.phoneNumber },
                { phoneNumber: normalUser.phoneNumber },
            ],
        });
    });

    describe("POST /api/admin/hospital", () => {
        test("Should add hospital successfully (admin only)", async () => {
            const response = await request(app)
                .post("/api/admin/hospital")
                .set("Authorization", `Bearer ${adminToken}`)
                .send(hospitalPayload);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("name", hospitalPayload.name);
            expect(response.body.data).toHaveProperty("location");
            expect(response.body.data.location).toHaveProperty("type", "Point");
            expect(response.body.data.location).toHaveProperty("coordinates");

            createdHospitalId = response.body.data._id;
            expect(createdHospitalId).toBeTruthy();
        });

        test("Should block non-admin user", async () => {
            const response = await request(app)
                .post("/api/admin/hospital")
                .set("Authorization", `Bearer ${userToken}`)
                .send({
                    name: "Blocked Hospital",
                    location: { type: "Point", coordinates: [85.33, 27.7] },
                });

            expect([401, 403]).toContain(response.status);
        });

        test("Should fail without token", async () => {
            const response = await request(app)
                .post("/api/admin/hospital")
                .send({
                    name: "No Token Hospital",
                    location: { type: "Point", coordinates: [85.33, 27.7] },
                });

            expect([400, 401, 403]).toContain(response.status);
        });

        test("Should fail with invalid coordinates (not length 2)", async () => {
            const response = await request(app)
                .post("/api/admin/hospital")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    name: "Invalid Coords Hospital",
                    location: { type: "Point", coordinates: [85.33] },
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("success", false);
        });

        test("Should fail with missing location", async () => {
            const response = await request(app)
                .post("/api/admin/hospital")
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    name: "Missing Location Hospital",
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("success", false);
        });
    });

    describe("GET /api/hospital", () => {
        test("Should fetch all hospitals for authorized user", async () => {
            const response = await request(app)
                .get("/api/hospital?page=1&size=10&search=")
                .set("Authorization", `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty("pagination");
            expect(response.body.pagination).toHaveProperty("page", 1);
            expect(response.body.pagination).toHaveProperty("size", 10);
        });

        test("Should fetch one hospital by id for authorized user", async () => {
            const response = await request(app)
                .get(`/api/hospital/${createdHospitalId}`)
                .set("Authorization", `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("_id", createdHospitalId);
        });
    });
});
