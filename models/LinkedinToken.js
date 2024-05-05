import mongoose from "mongoose";
const Schema = mongoose.Schema;
// Define schema for tokens
const linkedintokenSchema = new Schema({
    state: String,
    accessToken: String,
    id_token: String,
    expires_in: Number,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
},
{
    timestamps: true,
  }
);
export default mongoose.model('LinkedinToken', linkedintokenSchema);
