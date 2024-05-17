import mongoose from "mongoose";
const XtokenSchema = new mongoose.Schema({
    codeVerifier: String,
    state: String,
    accessToken: String,
    refreshToken: String,
    userId: String,
},
{
    timestamps: true,
  }
);
export default mongoose.model('XToken', XtokenSchema);
