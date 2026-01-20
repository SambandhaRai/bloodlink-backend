import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { PORT } from "./config";
import dotenv from "dotenv";
import { connectDatabase } from "./database/mongoose";
import cors from "cors";

dotenv.config();
console.log(process.env.PORT);

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin/admin.routes";
import bloodGroupRoutes from './routes/blood.routes';

const app: Application = express();

let corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:3003"],
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bloodGroup', bloodGroupRoutes);

async function start() {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server: http:localhost:${PORT}`);
    })
}
start().catch((error) => console.log(error));