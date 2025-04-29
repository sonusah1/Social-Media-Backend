import app from "./app.js";
import dotenv from "dotenv";

import connectDB from "./db/index.db.js";
import createAdmin from "./utils/CreateAdmin.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then(async ()=>{
    await createAdmin();
    app.listen(process.env.PORT || 3200 ,()=>{
        console.log(`server is running on port ${process.env.PORT || 3200}`)
    })
})
.catch((err)=>{
    console.log("Database connection failed ", err);
})
