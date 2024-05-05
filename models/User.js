import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
  
    },  
    stripe_customer_id:{
      type: String,
    },
    current_subscription_id:{
      type: String,
    },
    plan:{
      type: String,
      default:"Free"
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    address: {
      type: String,
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
    campaigns: {
      type: [String],
      default:[],
    }
  }

);

export default mongoose.model("User", UserSchema);
