import mongoose from "mongoose";
const PaymentSchema = new mongoose.Schema(

  {
    id: {
      type: String,
      required: true,
    },
    amount_paid: {
      type: Number,
      required: true,
    },
    billing_reason: {
      type: String,
      required: true,
    },
    collection_method: {
      type: String,
      required: true,
    },
    customer_email: {
      type: String,
      required: true,
    },
    hosted_invoice_url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    subscription: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }

);

export default mongoose.model("Payment", PaymentSchema);
