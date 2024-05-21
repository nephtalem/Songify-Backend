import cron from 'node-cron'
import User from './models/User.js';
import XToken from './models/XToken.js';
import { askpplx } from './perplexity.js';
import { scrapeQueue } from './redis.js';
import { TwitterApi } from "twitter-api-v2";

// import askgpt from './scraper.js';
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
    console.log(`UserId: ${userId}`);

    const token = await XToken.findOne({userId});
    console.log(`token: `,token);
    console.log(`refreash token: `,token.refreshToken);

    
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

async function clearQueue() {

    try {
  
        await scrapeQueue.empty();  // Empties the waiting and delayed jobs
  
        await scrapeQueue.clean(0, 'completed');  // Clean completed jobs
  
        await scrapeQueue.clean(0, 'failed');     // Clean failed jobs
  
        await scrapeQueue.clean(0, 'active');     // Clean active jobs (if supported by Bull)
  
        console.log('Queue cleared successfully');
  
    } catch (error) {
  
        console.error('Error clearing queue:', error);
  
    } 
  }

async function addJobToQueue({prompt,postOn ,userId}) {
    await scrapeQueue.add({prompt,postOn ,userId });
    
}
// await addJobToQueue({prompt: "OPEN AI Safty news",postOn:"Twitter",userId:"6611dbe711ccf838a1efad6c"})
// await clearQueue()
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


