
import { scrapeQueue } from './redis.js';

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
 await addJobToQueue({prompt: "OPEN AI Safty",postOn:"Twitter",userId:"6611dbe711ccf838a1efad6c"})
// await clearQueue()
