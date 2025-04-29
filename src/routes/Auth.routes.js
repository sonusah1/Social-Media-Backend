import {Router} from 'express';
import { changeCurrentPassword, loginUser, logOutUser, refreshAccessToken, registerUser } from '../controllers/Auth.controllers.js';
import {upload} from '../middlewares/multer.middlewares.js';
import { verifyJWT } from '../middlewares/Auth.middlewares.js';
import { deleteUser, followUser, getAllUsers, getUser, unFollowUSer, updateCoverImage, updateProfilePicture, updateUser } from '../controllers/user.controllers.js';
import { createPost, deletePost, getPost, like_dislike_Post, timeline, updatePost } from '../controllers/Post.controllers.js';

const router =Router();

router.route('/register').post(
    upload.fields([
        {
            name:"profilePicture",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);


router.route('/login').post(loginUser);

router.route('/logout').post(verifyJWT,logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route('/change-password').post(verifyJWT,changeCurrentPassword);

router.route('/getUser').get(verifyJWT,getAllUsers);
router.route('/user/:id').get(verifyJWT,getUser);
router.route('/update/:id').post(verifyJWT,updateUser);

router.route('/update-profile').patch(verifyJWT,upload.single("profilePicture"),updateProfilePicture);
router.route('/update-CoverImg').patch(verifyJWT,upload.single("coverImage"),updateCoverImage);


router.route('/deleteuser/:id').delete(verifyJWT,deleteUser);

router.route('/folowUser/:id').put(verifyJWT,followUser);
router.route('/unFollow/:id').put(verifyJWT,unFollowUSer);


router.route('/createPost').post(verifyJWT,upload.single('image'),createPost);

router.route('/getPost/:id').get(verifyJWT,getPost);
router.route('/updatePost/:id').post(verifyJWT,upload.single('image'),updatePost);
router.route('/deletePost/:id').get(verifyJWT,deletePost);
router.route('/like_dislike-Post/:id').post(verifyJWT,like_dislike_Post);
router.route('/timeline/:id').get(verifyJWT,timeline);

export default router;