import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { PORT } from "./config";
import dotenv from "dotenv";
import { connectDatabase } from "./database/mongoose";

dotenv.config();
console.log(process.env.PORT);

import authRoutes from "./routes/auth.routes";
import bloodGroupRoutes from "./routes/admin/admin.routes"

const app: Application = express();

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', bloodGroupRoutes);

async function start() {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server: http:localhost:${PORT}`);
    })
}
start().catch((error) => console.log(error));