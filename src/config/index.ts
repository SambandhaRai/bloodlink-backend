import dotenv from "dotenv";
dotenv.config();

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5050;
export const MONGODB_URI: string = process.env.MONGODB_URI || "mogodb://localhost:27017/bloodlink_database";
export const MONGODB_URI_TEST: string = process.env.MONGODB_URI_TEST || "";
export const JWT_SECRET: string = process.env.JWT_SECRET || "default_secret";