import cron from 'node-cron'
import User from './models/User.js';
import XToken from './models/XToken.js';
import { askpplx } from './perplexity.js';
import { scrapeQueue } from './redis.js';
import { TwitterApi } from "twitter-api-v2";

import askgpt from './scraper.js';
let maxJobsPerWorker = 2;

const twitterClient = new TwitterApi({
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
  });
  



scrapeQueue.process(maxJobsPerWorker,async (job) => {
    try{
    console.log(`Job Started`);
    const { prompt,postOn ,userId} = job.data;
    console.log(`Processing job: ${job.id}`);

    const token = await XToken.find({userId});
    
    
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

export async function addJobToQueue({prompt,postOn ,userId}) {
    return await scrapeQueue.add({prompt,postOn ,userId });
    
}
// scrapQueue.on('completed', (job, result) => {
//     console.log(`Job completed with result: ${result}`);
//     // Perform actions after job completion
//   });
  


// REDIS_URL=your-redis-url-here



// Update your Procfile to include both the web and worker processes:

// web: node server.js
// worker: node worker.js


// 3. **Scale the worker dyno:**


//    heroku ps:scale worker=1


