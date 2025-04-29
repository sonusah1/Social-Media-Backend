import { User } from '../models/user.models.js';
import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import ApiError from '../utils/ApiError.js';
import createAdmin from '../utils/CreateAdmin.js';

import uploadOnCloudinary from '../utils/cloudinary.js'


const getAllUsers = asyncHandler(async (req, res) => {
  try {
    console.log(req.user);

    // Only admin can access
    if (!req.user?.isAdmin) {
      throw new ApiError(403, 'You are not authorized to access this route');
    }

    const users = await User.find({}, "-password -__v"); // Exclude sensitive fields
    res.status(200).json(new ApiResponse(users, 'Users retrieved successfully'));
  } catch (error) {
    throw new ApiError(500, 'Failed to retrieve users');
  }
});

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user._id.toString() !== id && !req.user.isAdmin) {
      throw new ApiError(403, 'You are not authorized to access this route');
    }
    const user = await User.findById(id, "-password -__v");
    if (!user) {
      throw new ApiError(404, 'User not found for getUSer');
    }
    res.status(200).json(new ApiResponse(user, 'User retrieved successfully'));
  } catch (error) {
    throw new ApiError(500, `Failed to retrieve user || ${error.message}`);
  }
});

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      password,
      ...otherFields
    } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(400, "User not found.")
    }

    Object.keys(otherFields).forEach(key => {
      user[key] = otherFields[key];
    });

    // Update password if provided
    if (password) {
      user.password = password; // will be hashed in pre("save")
    }

    // Generate new tokens
    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefereshToken();

    // Save refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save({ validationBefore: false });
    const updatedUsers = await User.findById(id).select("-password -__v -refreshToken");

    const options = {
      httpOnly: true,
      secure: true
    }
    res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { user: updatedUsers }, "User updated successfully."));

  } catch (error) {
    console.error("Error updating user:", error);
    throw new ApiError(500, `Failed to update user || ${error.message}`);
  }
};

const updateProfilePicture = asyncHandler(async (req, res) => {
  const profilepicLocalPath = await req.file?.path;

  if (!profilepicLocalPath) {
    throw new ApiError(400, "please upload a valid profilepicture");
  }

  const profilepic = await uploadOnCloudinary(profilepicLocalPath);

  if (!profilepic.url) {
    throw new ApiError(400, "Error while updating avatar Image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profilePicture: profilepic.url
      }
    },
    {
      new: true
    }
  ).select('-password');

  return res.status(200).json(new ApiResponse(200, user, "Avatar updated Successfully"))

});


const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "upload a valid coverImage");
  }

  const coverimage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverimage.url) {
    throw new ApiError(400, 'Error while updating CoverImage');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverimage.url
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user, "Cover Image Updated Sucessfully"));
})

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { id: currentUserId, isAdmin } = req.body;

  if (currentUserId !== id && !isAdmin) {
    throw new ApiError(403, "Unauthorized Access ... Access Denied!")
  }

  try {
    const deleteduser = await User.findByIdAndDelete(id);

    if (!deleteduser) {
      throw new ApiError(400, "User not found")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(200, {}, "user deleted Sucessfully");


  } catch (error) {
    throw new ApiError(500, `Internal Server Error || ${error.message}`)
  }
});

const followUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user?._id;

  if (targetUserId == currentUserId) {
    throw new ApiError(403, "Action forbidden: Cannot follow yourself")
  }

  try {
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      throw new ApiError(404, "User not found");
    }

    if (targetUser.followers.includes(currentUserId)) {
      throw new ApiError(400, "You are already following this user");
    }

    await targetUser.updateOne({ $push: { followers: currentUserId } });
    await currentUser.updateOne({ $push: { following: targetUserId } });

    return res.status(200).json(new ApiResponse(200, "Successfully followed the user"));
  } catch (error) {
    throw new ApiError(500, `Internal Server Error || ${error.message}`)
  }
});

const unFollowUSer = asyncHandler(async (req,res)=>{
  const targetUserId = req.params?.id;
  const currentUserId = req.user?._id;

  if(targetUserId == currentUserId)
  {
    throw new ApiError(403,"Action forbidden: Cannot Unfollow yourself")
  }

  try {
    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      throw new ApiError(404, "User not found");
    }

    if (!targetUser.followers.includes(currentUserId)) {
      throw new ApiError(400, "You are not following this user");
    }

    await targetUser.updateOne({ $pull: { followers: currentUserId } });
    await currentUser.updateOne({ $pull: { following: targetUserId } });

    return res.status(200).json(new ApiResponse(200, "Successfully unfollowed the user"));
  } catch (error) {
    throw new ApiError(500, `Internal Server Error || ${error.message}`)
  }
})

export { getAllUsers, getUser, updateUser, updateProfilePicture, updateCoverImage, deleteUser,followUser
  , unFollowUSer
 };


