import mongoose from "mongoose";
import { TwitterApi } from "twitter-api-v2";
import XToken from './models/XToken.js';
import { askpplx } from './perplexity.js';
import { scrapeQueue } from './redis.js';
import "dotenv/config";

// import askgpt from './scraper.js';
let maxJobsPerWorker = 2;

const twitterClient = new TwitterApi({
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
  });
  
  async function connectToMongoDB() {

    try {

        await mongoose.connect(process.env.MONGO);
        console.log('Connected to MongoDB');

    } catch (error) {

        console.error('Error connecting to MongoDB:', error);

        process.exit(1); // Exit the process if connection fails

    }

}

  (async () => {

    await connectToMongoDB();


scrapeQueue.process(maxJobsPerWorker, async (job) => {
    try{
    console.log(`Job Started`);
    const { prompt,postOn ,userId} = job.data;
    console.log(`Processing job: ${job.id} for ${userId}`);
    // console.log(`UserId: ${userId}`);

    const token = await XToken.findOne({userId});

    const {
        client: refreshedClient,
        accessToken,
        refreshToken: newRefreshToken,
    } = await twitterClient.refreshOAuth2Token(token.refreshToken);
    
    token.accessToken = accessToken;
    token.refreshToken = newRefreshToken;
    await token.save();
    
    const text = await askpplx(prompt,postOn);
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
}catch(err){
    console.log("error",err)
  }  
    
});

})();