import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

type ConnectDatabaseOptions = {
    exitOnError?: boolean;
};

export async function connectDatabase(
    uri: string = MONGODB_URI,
    options: ConnectDatabaseOptions = {}
) {
    const { exitOnError = true } = options;
    try {
        await mongoose.connect(uri);
        console.log("Database connected succesfully");
    } catch (error) {
        console.log("Database error: ", error);
        if (exitOnError) {
            process.exit(1); // exit application on exception
        }
        throw error;
    }
}