import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { BloodGroupModel } from "../../models/blood.model";
import { HospitalModel } from "../../models/hospital.model";
import { RequestModel } from "../../models/request.model";

describe("Request Integration Tests", () => {
    const donorUser = {
        fullName: "Donor User",
        phoneNumber: "9851009401",
        dob: "2000-01-01",
        gender: "Male",
        healthCondition: "none",
        email: "donor_request@test.com",
        password: "test123",
        confirmPassword: "test123",
        profilePicture: "",
    };

    const requesterUser = {
        fullName: "Requester User",
        phoneNumber: "9851009402",
        dob: "2000-01-01",
        gender: "Female",
        healthCondition: "none",
        email: "requester_request@test.com",
        password: "test123",
        confirmPassword: "test123",
        profilePicture: "",
    };

    const thirdUser = {
        fullName: "Third User",
        phoneNumber: "9851009403",
        dob: "2000-01-01",
        gender: "Male",
        healthCondition: "none",
        email: "third_request@test.com",
        password: "test123",
        confirmPassword: "test123",
        profilePicture: "",
    };

    let donorToken = "";
    let requesterToken = "";
    let thirdUserToken = "";

    let donorBloodId = "";
    let recipientBloodId = "";
    let hospitalId = "";
    let createdRequestId = "";
    let donorUserId = "";
    let requesterUserId = "";
    let thirdUserId = "";

    beforeAll(async () => {
        await RequestModel.deleteMany({});
        await HospitalModel.deleteMany({ name: /Request Test Hospital/i });
        await BloodGroupModel.deleteMany({ bloodGroup: { $in: ["O-", "AB+"] } });
        await UserModel.deleteMany({
            $or: [
                { email: donorUser.email },
                { email: requesterUser.email },
                { email: thirdUser.email },
                { phoneNumber: donorUser.phoneNumber },
                { phoneNumber: requesterUser.phoneNumber },
                { phoneNumber: thirdUser.phoneNumber },
            ],
        });

        const donorBlood = await BloodGroupModel.create({ bloodGroup: "O-" });
        const recipientBlood = await BloodGroupModel.create({ bloodGroup: "AB+" });
        donorBloodId = String(donorBlood._id);
        recipientBloodId = String(recipientBlood._id);

        const hospital = await HospitalModel.create({
            name: "Request Test Hospital",
            location: {
                type: "Point",
                coordinates: [85.324, 27.7172],
            },
        });
        hospitalId = String(hospital._id);

        const donorRegister = await request(app).post("/api/auth/register").send({
            ...donorUser,
            bloodId: donorBloodId,
        });
        expect(donorRegister.status).toBe(201);

        const requesterRegister = await request(app).post("/api/auth/register").send({
            ...requesterUser,
            bloodId: recipientBloodId,
        });
        expect(requesterRegister.status).toBe(201);

        const thirdRegister = await request(app).post("/api/auth/register").send({
            ...thirdUser,
            bloodId: recipientBloodId,
        });
        expect(thirdRegister.status).toBe(201);

        const donorLogin = await request(app).post("/api/auth/login").send({
            email: donorUser.email,
            password: donorUser.password,
        });
        expect(donorLogin.status).toBe(201);
        donorToken = donorLogin.body.token;

        const requesterLogin = await request(app).post("/api/auth/login").send({
            email: requesterUser.email,
            password: requesterUser.password,
        });
        expect(requesterLogin.status).toBe(201);
        requesterToken = requesterLogin.body.token;

        const thirdLogin = await request(app).post("/api/auth/login").send({
            email: thirdUser.email,
            password: thirdUser.password,
        });
        expect(thirdLogin.status).toBe(201);
        thirdUserToken = thirdLogin.body.token;

        const donorInDb = await UserModel.findOne({ email: donorUser.email }).select("_id");
        const requesterInDb = await UserModel.findOne({ email: requesterUser.email }).select("_id");
        const thirdInDb = await UserModel.findOne({ email: thirdUser.email }).select("_id");
        donorUserId = String(donorInDb?._id || "");
        requesterUserId = String(requesterInDb?._id || "");
        thirdUserId = String(thirdInDb?._id || "");
    });

    afterAll(async () => {
        await RequestModel.deleteMany({});
        await HospitalModel.deleteMany({ name: /Request Test Hospital/i });
        await BloodGroupModel.deleteMany({ _id: { $in: [donorBloodId, recipientBloodId] } });
        await UserModel.deleteMany({
            $or: [
                { email: donorUser.email },
                { email: requesterUser.email },
                { email: thirdUser.email },
                { phoneNumber: donorUser.phoneNumber },
                { phoneNumber: requesterUser.phoneNumber },
                { phoneNumber: thirdUser.phoneNumber },
            ],
        });
    });

    describe("POST /api/request", () => {
        test("Should create a request successfully", async () => {
            const response = await request(app)
                .post("/api/request")
                .set("Authorization", `Bearer ${requesterToken}`)
                .send({
                    recipientBloodId,
                    recipientDetails: "Need blood for surgery",
                    recipientCondition: "urgent",
                    hospitalId,
                    requestFor: "others",
                    relationToPatient: "Brother",
                    patientName: "Test Patient",
                    patientPhone: "9800000000",
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("message", "Request Successfully Made");
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("requestStatus", "pending");

            createdRequestId = response.body.data._id;
            expect(createdRequestId).toBeTruthy();
        });

        test("Should fail validation for 'others' without patient fields", async () => {
            const response = await request(app)
                .post("/api/request")
                .set("Authorization", `Bearer ${requesterToken}`)
                .send({
                    recipientBloodId,
                    recipientDetails: "Need blood for surgery",
                    recipientCondition: "critical",
                    hospitalId,
                    requestFor: "others",
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("success", false);
        });

        test("Should fail without token", async () => {
            const response = await request(app)
                .post("/api/request")
                .send({
                    recipientBloodId,
                    recipientDetails: "No token request",
                    recipientCondition: "stable",
                    hospitalId,
                    requestFor: "self",
                });

            expect([400, 401, 403]).toContain(response.status);
        });

        test("Should fail when hospital id is invalid", async () => {
            const response = await request(app)
                .post("/api/request")
                .set("Authorization", `Bearer ${requesterToken}`)
                .send({
                    recipientBloodId,
                    recipientDetails: "Need blood for surgery",
                    recipientCondition: "urgent",
                    hospitalId: "invalid-hospital-id",
                    requestFor: "self",
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Invalid hospitalId");
        });
    });

    describe("GET /api/request/my/history", () => {
        test("Should fetch request history for logged-in user", async () => {
            const response = await request(app)
                .get("/api/request/my/history")
                .set("Authorization", `Bearer ${requesterToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data).toHaveProperty("donated");
            expect(response.body.data).toHaveProperty("ongoing");
            expect(response.body.data).toHaveProperty("received");
        });
    });

    describe("GET /api/request", () => {
        test("Should fetch all pending requests excluding self-posted ones", async () => {
            const response = await request(app)
                .get("/api/request?page=1&size=10")
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty("pagination");
            expect(response.body.pagination).toHaveProperty("page", 1);
            expect(response.body.pagination).toHaveProperty("size", 10);
        });

        test("Should fail without token", async () => {
            const response = await request(app).get("/api/request?page=1&size=10");
            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/request/:id", () => {
        test("Should fetch a single request by id", async () => {
            const response = await request(app)
                .get(`/api/request/${createdRequestId}`)
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("_id", createdRequestId);
        });

        test("Should return 404 for non-existing request id", async () => {
            const response = await request(app)
                .get(`/api/request/${new mongoose.Types.ObjectId()}`)
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("message", "Request not found");
        });

        test("Should fail without token", async () => {
            const response = await request(app).get(`/api/request/${createdRequestId}`);
            expect(response.status).toBe(401);
        });
    });

    describe("PATCH /api/request/:id/accept", () => {
        test("Should block accepting own request", async () => {
            const response = await request(app)
                .patch(`/api/request/${createdRequestId}/accept`)
                .set("Authorization", `Bearer ${requesterToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Cannot accept your own request");
        });

        test("Should accept request successfully by another user", async () => {
            const response = await request(app)
                .patch(`/api/request/${createdRequestId}/accept`)
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("requestStatus", "accepted");
        });

        test("Should fail with invalid request id", async () => {
            const response = await request(app)
                .patch("/api/request/invalid-id/accept")
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("message", "Invalid Request Id");
        });

        test("Should return 404 when request is not found", async () => {
            const response = await request(app)
                .patch(`/api/request/${new mongoose.Types.ObjectId()}/accept`)
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("message", "Request not found");
        });

        test("Should fail when request is already accepted", async () => {
            const pending = await RequestModel.create({
                recipientBloodId: new mongoose.Types.ObjectId(recipientBloodId),
                recipientDetails: "Already accepted case",
                recipientCondition: "urgent",
                hospitalId: new mongoose.Types.ObjectId(hospitalId),
                postedBy: new mongoose.Types.ObjectId(requesterUserId),
                requestFor: "self",
                requestStatus: "pending",
            });

            const acceptByThird = await request(app)
                .patch(`/api/request/${pending._id}/accept`)
                .set("Authorization", `Bearer ${thirdUserToken}`);
            expect(acceptByThird.status).toBe(200);

            const secondAccept = await request(app)
                .patch(`/api/request/${pending._id}/accept`)
                .set("Authorization", `Bearer ${donorToken}`);

            expect(secondAccept.status).toBe(400);
            expect(secondAccept.body).toHaveProperty("message", "Request already accepted");
        });
    });

    describe("PATCH /api/request/:id/finish", () => {
        test("Should block non-donor from finishing accepted request", async () => {
            const response = await request(app)
                .patch(`/api/request/${createdRequestId}/finish`)
                .set("Authorization", `Bearer ${thirdUserToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty("message", "Only the donor who accepted this request can finish it");
        });

        test("Should finish request successfully by donor", async () => {
            const response = await request(app)
                .patch(`/api/request/${createdRequestId}/finish`)
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("requestStatus", "finished");
        });

        test("Should fail with invalid request id", async () => {
            const response = await request(app)
                .patch("/api/request/invalid-id/finish")
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Invalid Request Id");
        });

        test("Should return 404 when request to finish is not found", async () => {
            const response = await request(app)
                .patch(`/api/request/${new mongoose.Types.ObjectId()}/finish`)
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty("message", "Request not found");
        });

        test("Should fail without token", async () => {
            const response = await request(app).patch(`/api/request/${createdRequestId}/finish`);
            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/request/matched", () => {
        test("Should fetch matched requests near a location", async () => {
            const response = await request(app)
                .get("/api/request/matched?lng=85.324&lat=27.7172&km=10&page=1&size=10")
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty("pagination");
            expect(response.body.pagination).toHaveProperty("page", 1);
            expect(response.body.pagination).toHaveProperty("size", 10);
        });

        test("Should fail when lng/lat are missing", async () => {
            const response = await request(app)
                .get("/api/request/matched")
                .set("Authorization", `Bearer ${donorToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "lng and lat are required numbers");
        });

        test("Should fail without token", async () => {
            const response = await request(app).get("/api/request/matched?lng=85.324&lat=27.7172");
            expect(response.status).toBe(401);
        });
    });
});
