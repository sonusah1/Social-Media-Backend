import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js';
import {User} from '../models/user.models.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefereshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefereshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false});

        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new ApiError(400, "User already exists");
    }

    const profilepicLocalPath = req.files?.profilePicture?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!profilepicLocalPath) {
        throw new ApiError(400, "Profile Picture is required");
    }

    const profilePicture = await uploadOnCloudinary(profilepicLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!profilePicture) {
        throw new ApiError(400, "Failed to upload Profile Picture");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        profilePicture: profilePicture.url,
        coverImage: coverImage?.url || ""
    });

    const createUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createUser) {
        throw new ApiError(400, "Failed to fetch created user");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {

    const accessTokenFromCookie = req.cookies?.accessToken

    if(accessTokenFromCookie){
        const decoded = jwt.verify(accessTokenFromCookie,process.env.ACCESS_TOKEN_SECRET);

        if (decoded && decoded._id) {
            throw new ApiError(400, "User already logged in");
        }
    }

    const { username,email, password } = req.body;

    if ((!username && !email) || (username && email)) {
        throw new ApiError(400, "Provide either username or email, not both");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(!user){
        throw new ApiError(400, "user not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if(!isPasswordValid)
    {
        throw new ApiError(400, "Invalid Password || user Credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefereshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200, 
        {
            user:loggedInUser,refreshToken
        }, 
        "User logged in successfully"
    ));  
});


const logOutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    );

    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User LoggedOut Successfully"));
})


const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incommingrefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incommingrefreshToken)
    {
        throw new ApiError(401,"No refreshToken is provided")
    }

    const decoded = jwt.verify(incommingrefreshToken,process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded?._id);
    if(!user){
        throw new ApiError(401,"User not found")
    }

    if(incommingrefreshToken != user.refreshToken){
        throw new ApiError(401,"Invalid refreshToken")
    }

    const {accessToken, newrefreshToken} = await generateAccessAndRefereshToken(user?._id);

    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(new ApiResponse(200,{accessToken,refreshToken:newrefreshToken},"user Authenticated"));
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user._id);

    if(!user){
        throw new ApiError(401,"User not found")
    }

    const isPasswordvalid = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordvalid)
    {
        throw new ApiError(401,"Invalid Old Password");
    }

    user.password = newPassword;

    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200,"Password Changed Successfully"));

})

export {registerUser,loginUser,logOutUser,refreshAccessToken,changeCurrentPassword};