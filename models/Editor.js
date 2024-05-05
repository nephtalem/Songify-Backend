import mongoose from "mongoose";
const EditorSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,

    },
    userName:{
      type: String,
      unique: true,
    },
    prefix:{
      type: String,
    },
    activated:{
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,

    },
    orcidId:{
      type: String,
    },
    rewardPoints:{
      type: Number,
      default: 0,
    },
    affiliation: { type: String },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    address: {
      type: String,
    },
    passwordChangeOTP:{
      type:String
    },
    resetOTPExpires:{
      type:Date
    },
    phone: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    researchArea: {
      type: [String],
      default:[],
    },
    papersReviewing: {
      type: [String],
      default:[],
    },
    papersReviewed: {
      type: [String],
      default:[],
    }
  }

);

export default mongoose.model("Editor", EditorSchema);
