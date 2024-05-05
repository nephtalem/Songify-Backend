import mongoose from "mongoose";
const CampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
    },
    type: {
      type: String,
      required: true,
    },
    schedule: {
      type: String,
    },
    status:{
      type: String,
      required: true,
    },
    user:{
      type:String,
      required:true,
    },
    

  },
  {
    timestamps: true,
  }

);

export default mongoose.model("Campaign", CampaignSchema);
