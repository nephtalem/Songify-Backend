import express from "express";
import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
import Payment from "../models/Payment.js";
import Paper from "../models/Campaign.js";
import Editor from "../models/Editor.js";
import User from "../models/User.js";

const router = express.Router();

const stripe = Stripe(
  "sk_test_51P4mwA069Z3UUN5LHjnjR8LVExmVRb2FnGJWkgBtHCGHWNdGJS2KnJfbiwokB28Q1sQDfUQL6ji0jF0RdXTAkIpe00NMBIrhRv"
);

export const checkDiscount = async (req, res, next) => {
  try {
    const rev = await Editor.findOne({ email: req.body.email });
    if (rev) {
      res.status(200).json({ status: "Success", data: rev.rewardPoints });
    } else {
      res.status(200).json({ status: "Success", data: 0 });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    let amount = 1500;
    console.log("id0", amount);
    const rev = await Editor.findOne({ email: req.body.email });
    if (rev) {
      if (rev?.rewardPoints > 0 && rev?.rewardPoints < 50) {
        console.log("id1", amount);
        amount = amount - (rev?.rewardPoints * amount) / 100;
      } else if (rev?.rewardPoints >= 50) {
        amount = amount - amount / 2;
        console.log("id2", amount);
      }
    }
    console.log("id3", amount);
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
      amount: amount * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: "receipt_order_74394",
      notes: {
        paperId: req.body.id,
      },
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const secret = "a-nTJ_yPgRNWH2Q";
    console.log("reqbody", req.body.payload.payment.entity);

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    console.log(digest, req.headers["x-razorpay-signature"]);

    if (digest === req.headers["x-razorpay-signature"]) {
      console.log("request is legit");
      res.json({ status: "ok" });
      next();

      // process it
      // require('fs').writeFileSync('payment1.json', JSON.stringify(req.body, null, 4))
    } else {
      res.json({ status: "ok" });
      console.log("Not legit");
      // pass it
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

export const cancel_subscription = async (req, res) => {
  try {
    const { subscription, customer } = req.body;
    const YOUR_DOMAIN = "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${YOUR_DOMAIN}/subscription`,
      flow_data: {
        type: "subscription_cancel",
        subscription_cancel: {
          subscription: subscription,
        },
      },
    });
    res.send(session.url);
  } catch (error) {
    console.log(error);
    // res.send
  }
};

export const create_checkout_session = async (req, res) => {
  try {
    const YOUR_DOMAIN = "http://localhost:3000";
    const { plan, email, customer } = req.body;
    let price;
    if (plan === "golden_m") {
      price = "price_1P5uf4069Z3UUN5LOjeZjIiU";
    } else if (plan == "golden_y") {
      price = "price_1P5umq069Z3UUN5L6zc1rAGd";
    } else if (plan == "basic_y") {
      price = "price_1P5uoG069Z3UUN5LVWjbZhEP";
    } else {
      price = "price_1P4oiL069Z3UUN5LIbievkgC";
    }

    let session;
    console.log("stripe_cusomter_id", customer, plan, email);

    if (customer) {
      session = await stripe.checkout.sessions.create({
        customer,
        line_items: [
          {
            price,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${YOUR_DOMAIN}?success=true`,
        cancel_url: `${YOUR_DOMAIN}?canceled=true`,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        customer_email: email,
        line_items: [
          {
            price,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${YOUR_DOMAIN}?success=true`,
        cancel_url: `${YOUR_DOMAIN}?canceled=true`,
      });
    }

    res.send(session.url);
  } catch (err) {
    console.log("error", err);
  }
};

export const savePayment = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event = req.body;
  const endpointSecret =
    "whsec_1117f9b4875bb00849cf1c0bb5622543719da89874725baa193bc2d35a360bb9";
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntentSucceeded = event.data.object;

      break;

    case "customer.subscription.updated":
      let plan;
      const planid = event.data.object.items.data[0].plan.id;
      if (planid === "price_1P5uf4069Z3UUN5LOjeZjIiU") {
        plan = "golden_m";
      } else if (planid == "price_1P5umq069Z3UUN5L6zc1rAGd") {
        plan = "golden_y";
      } else if (planid == "price_1P5uoG069Z3UUN5LVWjbZhEP") {
        plan = "basic_y";
      } else if (planid == "price_1P4oiL069Z3UUN5LIbievkgC") {
        plan = "basic_m";
      }
      try {
        const a = await User.findOneAndUpdate(
          { stripe_customer_id: event.data.object.customer },
          { plan, current_subscription_id: event.data.object.id }
        );
        console.log("a is", event.data.object.items.data[0].plan.id);
        // res.status(200).json({ status: "Success", data: a });
      } catch (err) {
        console.error(err);
      }
      break;

    case "customer.created":
      try {
        const a = await User.findOneAndUpdate(
          { email: event.data.object.email },
          { stripe_customer_id: event.data.object.id }
        );
        // res.status(200).json({ status: "Success", data: a });
        console.log("b is", event.data.object.email);
      } catch (err) {
        console.error(err);
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};

router.post("/success", async (req, res) => {
  try {
    // getting the details back from our font-end
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    // Creating our own digest
    // The format should be like this:
    // digest = hmac_sha256(orderCreationId + "|" + razorpayPaymentId, secret);
    const shasum = crypto.createHmac("sha256", "w2lBtgmeuDUfnJVp43UpcaiT");

    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

    const digest = shasum.digest("hex");

    // comaparing our digest with the actual signature
    if (digest !== razorpaySignature)
      return res.status(400).json({ msg: "Transaction not legit!" });

    // THE PAYMENT IS LEGIT & VERIFIED
    // YOU CAN SAVE THE DETAILS IN YOUR DATABASE IF YOU WANT

    res.json({
      msg: "success",
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    res.status(500).send(error);
  }
});
