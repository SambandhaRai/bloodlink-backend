import mongoose from "mongoose";
import { MONGODB_URI } from "../config";

export async function connectDatabase() {
    try{
        await mongoose.connect(MONGODB_URI);
        console.log("Database connected succesfully");
    } catch (error) {
        console.log("Database error: ", error);
        process.exit(1); // exit application on exception
    }
}