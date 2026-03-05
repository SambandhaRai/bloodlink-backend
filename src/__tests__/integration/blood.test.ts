import request from "supertest";
import app from "../../app";
import { BloodGroupModel } from "../../models/blood.model";

describe("Blood Group Integration Tests", () => {
    const testBloodGroup = { bloodGroup: "INT-BG-A1" };
    let bloodId = "";

    beforeAll(async () => {
        await BloodGroupModel.deleteMany({ bloodGroup: testBloodGroup.bloodGroup });
        const created = await BloodGroupModel.create(testBloodGroup);
        bloodId = String(created._id);
    });

    afterAll(async () => {
        await BloodGroupModel.deleteMany({ bloodGroup: testBloodGroup.bloodGroup });
    });

    describe("GET /api/bloodGroup", () => {
        test("Should fetch all blood groups", async () => {
            const response = await request(app).get("/api/bloodGroup");

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe("GET /api/bloodGroup/:id", () => {
        test("Should fetch single blood group by id", async () => {
            const response = await request(app).get(`/api/bloodGroup/${bloodId}`);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("_id", bloodId);
        });
    });
});
