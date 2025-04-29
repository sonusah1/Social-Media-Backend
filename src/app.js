import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

const app= express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.static('public'));
app.use('/images',express.static('images'));

app.use(express.json({limit:"16kb"}));

app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(cookieParser())

import userRoutes from "./routes/Auth.routes.js";
app.use("/api/v1/Auth",userRoutes);


export default app;