import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();
console.log(process.env.PORT);

import authRouter from "./routes/auth.routes";
import adminRouter from "./routes/admin/admin.routes";
import bloodGroupRouter from './routes/blood.routes';
import requestRouter from "./routes/request.routes";
import hospitalRouter from "./routes/hospital.routes";
import userRouter from "./routes/user.routes";

const app: Application = express();

let corsOptions = {
    origin: [
        "http://localhost:3000", "http://localhost:3003",
        "http://192.168.101.2:3000",
        "http://192.168.101.2:3003",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
app.use(cors(corsOptions));

app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // static file serving

app.use(bodyParser.json());
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bloodGroup', bloodGroupRouter);
app.use('/api/request', requestRouter);
app.use('/api/hospital', hospitalRouter);
app.use('/api/user', userRouter);

export default app;