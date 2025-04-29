import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config()

console.log(process.env.CLOUDINARY_CLOUD_NAME);


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const uploadParams = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });

    console.log("✅ File uploaded to Cloudinary:", uploadParams.url);

    fs.unlinkSync(localFilePath); // delete local file
    return uploadParams;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error); // log this!
    
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    return null;
  }
};

export default uploadOnCloudinary;
