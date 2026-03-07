import { connectDatabase } from '../database/mongoose';
import mongoose from 'mongoose';
import { MONGODB_URI, MONGODB_URI_TEST } from '../config';

const isIntegrationTestFile = () => {
    const testPath = (expect.getState().testPath || "").replace(/\\/g, "/");
    return testPath.includes("/__tests__/integration/");
};

beforeAll(async () => {
    if (!isIntegrationTestFile()) return;

    if (!MONGODB_URI_TEST) {
        throw new Error(
            "MONGODB_URI_TEST is not set. Refusing to run integration tests against a non-test database."
        );
    }

    if (MONGODB_URI_TEST === MONGODB_URI) {
        throw new Error(
            "MONGODB_URI_TEST matches MONGODB_URI. Use a separate test database URI."
        );
    }

    await connectDatabase(MONGODB_URI_TEST, { exitOnError: false });
});

afterAll(async () => {
    if (!isIntegrationTestFile()) return;
    if (mongoose.connection.readyState === 0) return;
    await mongoose.connection.close();
});