import Queue from 'bull';
import "dotenv/config";
// process.env.REDIS_URL || 
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const scrapeQueue = new Queue('scrapQueue', REDIS_URL);

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
    const a = await scrapeQueue.add({prompt,postOn ,userId });
    console.log(a)
    
}
 await addJobToQueue({prompt: "interesting post about new gpt4o model, detailed paragpraphs",postOn:"Twitter",userId:"6611dbe711ccf838a1efad6c"})
// await clearQueue()
