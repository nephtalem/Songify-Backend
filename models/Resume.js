import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ResumeSchema = new Schema(
  {
    user: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
    name: {
      type: String,
    },
    template: {
      type: Number,
    },
    Profile: {
      type: Schema.Types.Mixed, 
    },
    Other: {
      type: [Schema.Types.Mixed], 
      default:[],
    },
    Education: {
      type: Schema.Types.Mixed,
    },
    Certifications: {
      type: Schema.Types.Mixed,
    },
    Education: {
      type: Schema.Types.Mixed,
    },
    KeySkills:{
      type: Schema.Types.Mixed,
    },
      Employment: {
        type: Schema.Types.Mixed,
      },
         Projects:  {
          type: Schema.Types.Mixed,
        },
            Socials:  {
              type: Schema.Types.Mixed,
            },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Resume", ResumeSchema);
