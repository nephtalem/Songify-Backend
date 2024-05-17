import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ConversationSchema = new Schema(
  {
    user: {
      type: String,
      required: true,
    },
    conversation: {
      type: String,
    },
    embedding: {
      type: [Number], 
      default:[],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Conversation", ConversationSchema);
