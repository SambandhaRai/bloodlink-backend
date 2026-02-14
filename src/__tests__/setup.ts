import { connectDatabase } from '../database/mongoose';
import mongoose from 'mongoose';

beforeAll(async () => {
    // can be used to connect to test database
    await connectDatabase();
});

afterAll(async () => {
    await mongoose.connection.close();
});