import express from "express";
import askgpt from "../scraper.js";
import { TwitterApi } from "twitter-api-v2";
import cron from 'node-cron';
import XToken from "../models/XToken.js";
import OpenAI from "openai";
import "dotenv/config";
import User from "../models/User.js";

// Twitter API init
const twitterClient = new TwitterApi({
  clientId: process.env.X_CLIENT_ID,
  clientSecret: process.env.X_CLIENT_SECRET,
});

const callbackURL = "http://127.0.0.1:8800/api/x/callback";
//
const router = express.Router();

router.get("/auth", async (req, res) => {
  const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
    callbackURL,
    { scope: ["tweet.read", "tweet.write", "users.read", "offline.access"] }
  );

  // Store verifier
  const token = new XToken({ codeVerifier, state });
  await token.save();

  res.redirect(url);
});

// STEP 2 - Verify callback code, store access_token
router.get("/callback", async (req, res) => {
  const { state, code } = req.query;
  console.log("Hey")

  const token = await XToken.findOne({ state });
  //  const token = await XToken.findOne().sort({ createdAt: -1 });

  if (!token) {
    return res.status(400).send("Stored tokens do not match!");
  }

  const {
    client: loggedClient,
    accessToken,
    refreshToken,
  } = await twitterClient.loginWithOAuth2({
    code,
    codeVerifier: token.codeVerifier,
    redirectUri: callbackURL,
  });
  console.log("access",accessToken)
  console.log("refresh ",refreshToken)
  token.accessToken = accessToken;
  token.refreshToken = refreshToken;
  await token.save();

  const { data } = await loggedClient.v2.me();

  res.send(data);
});



// cron.schedule('*/5 * * * * *', () => {
//   console.log('running a task every five seconds');
// });
// STEP 3 - Refresh tokens and post tweets
router.get("/tweet", async (req, res) => {
  const token = await XToken.findOne().sort({ createdAt: -1 });
  const prompt = req?.query?.prompt;

  const {
    client: refreshedClient,
    accessToken,
    refreshToken: newRefreshToken,
  } = await twitterClient.refreshOAuth2Token(token.refreshToken);

  token.accessToken = accessToken;
  token.refreshToken = newRefreshToken;
  await token.save();

  const text = await askgpt(prompt);
  console.log("text: ", text);

  const myArray = text.split("\n");

  let firstParagraph = myArray[0];
  if (firstParagraph.length >= 280) {
    const a = firstParagraph.split(".");
    firstParagraph = a[0];
    if (firstParagraph.length >= 280) {
      firstParagraph = firstParagraph.slice(0, 270);
    }
  }
  const { data } = await refreshedClient.v2.tweet(firstParagraph);
  for (let i = 0; (i < myArray.length) & (i < 8); i++) {
    let paragraph = myArray[i + 1];
    if (paragraph && paragraph != "") {
      if (paragraph.length >= 280) {
        const a = paragraph.split(".");
        paragraph = a[0];
        if (paragraph.length >= 280) {
          paragraph = paragraph.slice(0, 270);
        }
      }
      await refreshedClient.v2.reply(paragraph, data?.id);
    }
  }

  // console.log("data returned", data)
  res.send({ status: "Twitt Posted, Enjoy", data });
});
router.post("/try", async (req, res) => {
  try{
  const {Prompt:prompt, type, postOn,userId} = req?.body;
  let doc = await User.findById(userId);
  let freeTrial = doc.freeTrial;
  if(!freeTrial){
     doc = await User.findOneAndUpdate(
      { _id: userId },
      { $set: {freeTrial:0} },
      { new: true }
    );
    freeTrial = doc.freeTrial;
  }
  if(freeTrial <=10){


  console.log("prompt", prompt)
  const data = await askgpt(prompt,postOn);
  await User.findOneAndUpdate(
    { _id: userId },
    { $set: {freeTrial:(freeTrial+1)} },
    { new: true }
  );
 
  res.send({ status: "Success", data });
  }else{
    res.send({ status: "error", data: "Trial Ended" });
  }
}catch(err){
  res.send({ status: "error", data: err });
}
});

export default router;
