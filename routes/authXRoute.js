import express from "express";
import askgpt from "../scraper.js";
import { TwitterApi } from "twitter-api-v2";
import cron from 'node-cron';
import XToken from "../models/XToken.js";
import OpenAI from "openai";
import "dotenv/config";
import User from "../models/User.js";
import Queue  from 'bull';
import { addJobToQueue} from "../worker.js";
import { scrapeQueue } from "../redis.js"

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
router.get("/job-status/:id", async (req, res) => {
  try{
    const {id } = req.params;
    const job = await scrapeQueue.getJob(id);
  
    if (!job) {
      res.status(200).json({ status:"error", data: 'Job not found' });
    }
    
    if (job.finishedOn) {
      const result = await job.finished();
      console.log("sending job ",result)
      res.status(200).send({ status:"Success", data:result });
    } else if (job.failedReason) {
      res.status(200).json({ status: 'failed', data: job.failedReason });
    } else {
      res.status(200).json({ status: 'in-progress' });
    }
}catch(err){
  
}
});
router.post("/try", async (req, res) => {
  try{
  const {Prompt:prompt, type, postOn,userId} = req?.body;
  // let doc = await User.findById(userId);
  // let freeTrial = doc.freeTrial;
  // if(!freeTrial){
  //    doc = await User.findOneAndUpdate(
  //     { _id: userId },
  //     { $set: {freeTrial:0} },
  //     { new: true }
  //   );
  //   freeTrial = doc.freeTrial;
  // }
  let freeTrial = 2
  if(freeTrial <=10){


try {
    
      // const job = await scrapQueue.add({prompt,postOn ,userId} )
     const job1 =  await addJobToQueue( {prompt, type, postOn, userId} );
     console.log("job.id",job1.id)
     res.status(200).send({ status:"Success", data:job1.id });
  } catch (error) {
      res.status(200).send({ error: 'Failed to add job to the queue', details: error });
  }

  }else{
    res.send({ status: "error", data: "Trial Ended" });
  }
}catch(err){
  res.send({ status: "error", data: err });
}
});

export default router;
