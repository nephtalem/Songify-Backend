import mongoose from "mongoose";
const SongSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
    },
    Artist: {
      type: String,
    },  
    Album: {
      type: String,
    },
    Genre:{
      type: String,
    },
  }

);

export default mongoose.model("Song", SongSchema);
