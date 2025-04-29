import mongoose, { Schema } from "mongoose";

const coordinateSchema = new Schema({
  name: {
    type: String,
    required: [true, "Location Name is required"]
  },
  location: {
    type: {
      type: String, // Notice: it's type inside type
      enum: ['Point'], // Must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number], // Array of numbers [longitude, latitude]
      required: true
    }
  }
});

// Create 2dsphere index automatically
coordinateSchema.index({ location: "2dsphere" });

export const Coordinate = mongoose.model("Coordinate", coordinateSchema);
