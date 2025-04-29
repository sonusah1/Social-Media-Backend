import { User } from "../models/user.models.js";
import asyncHandler from "./asyncHandler.js";

const createAdmin = asyncHandler(async () => {
    try {
        const existingAdmin = await User.findOne({ email: "admin@example.com" });

        if (existingAdmin) {
            console.log("⚠️ Admin already exists.");
            return;
        }

        const adminUser = new User({
            email: "admin@example.com",
            password: "Admin@123", // ✅ Corrected as a string
            username:"Admin",
            profilePicture:"https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.facebook.com%2FCuteBabyGirlsPics%2F&psig=AOvVaw1Me9BL6do5Vx09AWOzJwjE&ust=1745089216998000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCICesI2i4owDFQAAAAAdAAAAABAE",
            isAdmin: true,
        });

        await adminUser.save();
        console.log("✅ Admin created successfully!");
    } catch (err) {
        console.error("❌ Error creating admin:", err.message);
    }
});

export default createAdmin;

