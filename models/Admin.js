import mongoose from "mongoose";
const AdminSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    userName:{
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    passwordChangeOTP:{
      type:String
    },
    resetOTPExpires:{
      type:Date
    },
  }

);

export default mongoose.model("Admin", AdminSchema);
