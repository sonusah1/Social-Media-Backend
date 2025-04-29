import mongoose,{Schema} from 'mongoose';


const postSchema = new Schema({
    userId:{
        type: Schema.Types.ObjectId, 
        ref:'User',
        required: true
    },
    dec:{
        type: String
    },
    image:{
        type:String
    },
    reactions: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
          },
          type: {
            type: String,
            enum: ["like", "love", "haha", "wow", "sad", "angry"],
          },
        },
      ],
},
{
    timestamps: true
})

export const Post = mongoose.model("Post",postSchema);