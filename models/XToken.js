import mongoose from "mongoose";
const Schema = mongoose.Schema;
// Define schema for tokens
const xtokenSchema = new Schema({
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
export default mongoose.model('XToken', xtokenSchema);
