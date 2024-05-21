import Queue from 'bull';
import "dotenv/config";
// process.env.REDIS_URL || 
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const scrapeQueue = new Queue('scrapQueue', REDIS_URL);
