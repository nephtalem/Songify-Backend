import mongoose from "mongoose";
const Schema = mongoose.Schema;
// Define schema for tokens
const XtokenSchema = new mongoose.Schema({
    codeVerifier: String,
    state: String,
    accessToken: String,
    refreshToken: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
},
{
    timestamps: true,
  }
);
export default mongoose.model('XToken', XtokenSchema);
