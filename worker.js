import mongoose from "mongoose";
import { TwitterApi } from "twitter-api-v2";
import XToken from "./models/XToken.js";
import LinkedinToken from "./models/LinkedinToken.js";
import { askpplx } from "./perplexity.js";
import { scrapeQueue } from "./redis.js";
import "dotenv/config";
import axios from "axios";

// import askgpt from './scraper.js';
let maxJobsPerWorker = 2;

const twitterClient = new TwitterApi({
  clientId: process.env.X_CLIENT_ID,
  clientSecret: process.env.X_CLIENT_SECRET,
});

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);

    process.exit(1); // Exit the process if connection fails
  }
}

(async () => {
  await connectToMongoDB();


scrapeQueue.process(maxJobsPerWorker, async (job) => {
  const { prompt, postOn, userId } = job.data;
  console.log(`Job Started`, prompt, postOn, userId);
  if (postOn === "Twitter") {
    try {
      console.log(`Processing job: ${job.id} for ${userId}`);

      const token = await XToken.findOne({
        userId,
        refreshToken: { $exists: true, $ne: null },
      }).sort({ updatedAt: -1 });
      console.log(`Token: `, token);

      const {
        client: refreshedClient,
        accessToken,
        refreshToken: newRefreshToken,
      } = await twitterClient.refreshOAuth2Token(token.refreshToken);

      token.accessToken = accessToken;
      token.refreshToken = newRefreshToken;
      await token.save();

      const text = await askpplx(prompt, postOn);
      console.log("Post: ", text);

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

      console.log(`Job completed: ${job.id} for ${userId}`);
      // console.log("data returned", data)
      return data;
    } catch (err) {
      console.log("error", err);
    }
  } else if (postOn === "Linkedin") {
    try {
        const token = await LinkedinToken.findOne({
            userId,
            accessToken: { $exists: true, $ne: null },
          }).sort({ updatedAt: -1 });

      console.log("ttoken", token);
      const resp = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${token?.accessToken}`,
          // Authorization: "Bearer AQWCKgakB2PYQnOJ8H7WNGI9IT2D84E5BMqf4tuXWZ5N9KpkKcI8I8svh-Mowc3hm4FnLdBWKOxzcvT8Av2YXQLxbueLr5_WlaDWdd07xRE1-A4B7Keh5P3UMn5ASnrqlg9mC5_rQwQejrzjlibT6x9D8JZq8UBsQqj1QRI7-wYLmCNKu0EkmwBEQxYSif_IO0MM1CvwGHwFHYPZKVuDh48glgnAUeiNGlqZzI926LcV4UuXtwYWi6JPKIKqAhoK7VWQgC0cKQW-l6ceMmS6MiYIKuFkAez3zBjjWNzLYhvSr0WeayyvlUSg6EB3QT9WfjyF89oN2mn2Lq8VUACbWLwSvtZ5DQ"
        },
      });
      const urn = resp?.data?.sub;
      const text = await askpplx(prompt, postOn);
      console.log("Post: ", text);
      const { data } = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        {
          author: `urn:li:person:${urn}`, // Replace with your LinkedIn user ID
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text,
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        },
        {
          headers: {
            // "Content-Type": "application/X-Restli-Protocol-Version: 2.0.0",
            Authorization: `Bearer ${token?.accessToken}`,
          },
        }
      );

      console.log(`Job completed: ${job.id} for ${userId}`);
      // console.log("data returned", data)
      return data;
    } catch (error) {
      console.error("Error posting on LinkedIn:", error);
    }
  }
});

})();