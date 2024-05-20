import User from './models/User.js';
import { askpplx } from './perplexity.js';
import { scrapeQueue } from './redis.js';

import askgpt from './scraper.js';
let maxJobsPerWorker = 2;

scrapeQueue.process(maxJobsPerWorker,async (job) => {
    console.log(`Processing job`);
    const { prompt,postOn ,userId} = job.data;
    console.log(`Processing job: ${job.id}`);
    // let data = "hjg"
    

//   const data = await askgpt(prompt,postOn);
  const data = await askpplx(prompt,postOn);
  console.log(`Job completed: ${job.id} for ${userId}`);
//   await User.findOneAndUpdate(
//     { _id: userId },
//     { $set: {freeTrial:(freeTrial+1)} },
//     { new: true }
//   );

    return data;
    // return "com";
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


