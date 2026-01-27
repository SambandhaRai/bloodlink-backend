import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { PORT } from "./config";
import dotenv from "dotenv";
import { connectDatabase } from "./database/mongoose";
import cors from "cors";

dotenv.config();
console.log(process.env.PORT);

import authRouter from "./routes/auth.routes";
import adminRouter from "./routes/admin/admin.routes";
import bloodGroupRouter from './routes/blood.routes';
import userRouter from "./routes/user.routes";

const app: Application = express();

let corsOptions = {
    origin: ["http://localhost:3000", "http://localhost:3003"],
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bloodGroup', bloodGroupRouter);
app.use('/api/user', userRouter);

async function start() {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server: http:localhost:${PORT}`);
    })
}
start().catch((error) => console.log(error));