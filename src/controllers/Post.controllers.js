
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import { Post } from '../models/post.models.js';
import { User } from '../models/user.models.js';
import mongoose from 'mongoose';

const createPost = asyncHandler(async (req, res) => {
    try {
        const { dec } = req.body;
        const imagelocalpath = req.file?.path

        const user = req.user;

        if (!user || !user.id) {
            throw new ApiError(401, 'Unauthorized access.')
        }

        const images = await uploadOnCloudinary(imagelocalpath);

        if (!images.url) {
            throw new ApiError(500, 'Image upload failed.');
        }

        if (!dec) {
            throw new ApiError(400, 'Post must have a description');
        }

        const post = await Post.create({
            userId: user._id,
            dec,
            image: images.url
        })

        res.status(201).json(new ApiResponse(201, post, 'Post created successfully'));
    } catch (error) {
        throw new ApiError(500, `${error.message} || An unexpected error occurred.`);
    }
});

const getPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {

        const post = await Post.findById(id);

        if (!post) {
            throw new ApiError(404, "Post not found");
        }

        res.status(200).json(new ApiResponse(200, post, 'Post retrieved successfully'));
    } catch (error) {
        throw new ApiError(500, `${error.message} || An unexpected error occurred.`);
    }
});

const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    console.log("user id: ", user._id);



    try {
        const post = await Post.findById(id);
        console.log("postUSer Id: ", post.userId);
        if (!post) {
            throw new ApiError(404, "Post not found");
        } else if (post.userId.toString() !== user._id.toString()) {
            throw new ApiError(403, "You are not authorized to update this post.");
        }

        const { dec } = req.body;
        const imagelocalpath = req.file?.path;

        const images = await uploadOnCloudinary(imagelocalpath);

        post.dec = dec;
        post.image = images.url;

        await post.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(200, post, 'Post updated successfully'));
    } catch (error) {
        throw new ApiError(500, `${error.message} || An unexpected error occurred during the update.`);
    }
});

const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    try {
        const post = await Post.findById(id);
        if (!post) {
            throw new ApiError(404, "Post not found.");
        }
        if (user._id.toString() !== post.userId.toString()) {
            throw new ApiError(403, "You are not authorized to delete this post.");
        }
        await Post.findByIdAndDelete(id);

        return res.status(200).json(new ApiResponse(200, null, 'Post deleted successfully'));
    } catch (error) {
        throw new ApiError(500, `${error.message} || An unexpected error occurred during the deletion.`);
    }
});

const like_dislike_Post = asyncHandler(async (req, res) => {
    const { id } = req.params; // Post ID
    const { type } = req.body; // Reaction type (like, love, etc.)
    const userId = req.user._id;

    const validReactions = ["like", "love", "haha", "wow", "sad", "angry"];

    if (!validReactions.includes(type)) {
        throw new ApiError(400, "Invalid reaction type.");
    }

    const post = await Post.findById(id);
    if (!post) {
        throw new ApiError(404, "Post not found.");
    }

    // Find if user has already reacted
    const existingReactionIndex = post.reactions.findIndex(
        (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
        const existingType = post.reactions[existingReactionIndex].type;

        if (existingType === type) {
            // Same reaction again = remove it (unreact)
            post.reactions.splice(existingReactionIndex, 1);
        } else {
            // Change reaction type
            post.reactions[existingReactionIndex].type = type;
        }
    } else {
        // New reaction
        post.reactions.push({ userId, type });
    }

    await post.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, post.reactions, "Reaction updated successfully."));
});

const timeline = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    try {
        // 1️⃣ Fetch current user's own posts (if any)
        const ownPosts = await Post.find({ userId });
        console.log("Current User's Posts:", ownPosts);

        // 2️⃣ Fetch posts from users that the current user follows (even if user has no posts)
        const [userData] = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) },
            },
            {
                $lookup: {
                    from: "posts",
                    localField: "following",
                    foreignField: "userId",
                    as: "followingUserPosts",
                },
            },
            {
                $project: {
                    followingUserPosts: 1,
                    _id: 0,
                },
            },
        ]);

        // 3️⃣ Check if user is following anyone and if there are posts from followed users
        const followingPosts = userData?.followingUserPosts || [];
        console.log("Following User Posts:", followingPosts);

        // 4️⃣ Merge the current user's posts and the following user's posts, if any
        const timelinePosts = [...ownPosts, ...followingPosts].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        console.log("Merged Timeline Posts:", timelinePosts);

        // 5️⃣ Respond with the full timeline
        if (timelinePosts.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No posts available."));
        }

        return res.status(200).json(
            new ApiResponse(200, timelinePosts, "Timeline fetched successfully")
        );
    } catch (error) {
        throw new ApiError(
            500,
            `Failed to fetch timeline: ${error.message || "Internal Server Error"}`
        );
    }
});

export { createPost, getPost, updatePost, deletePost, like_dislike_Post, timeline };