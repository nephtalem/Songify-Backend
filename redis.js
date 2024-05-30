import Queue from 'bull';
import "dotenv/config";
// process.env.REDIS_URL || 
const REDIS_URL =  || 'redis://127.0.0.1:6379';
export const scrapeQueue = new Queue('scrapQueue', REDIS_URL);


// redis://:p657bfdbe652a36b3ef3fcb1149ed821181ed55e6e81d5ce173c0d8fcce1b82b0@ec2-52-201-28-106.compute-1.amazonaws.com:26779
// TLS rediss://:p657bfdbe652a36b3ef3fcb1149ed821181ed55e6e81d5ce173c0d8fcce1b82b0@ec2-52-201-28-106.compute-1.amazonaws.com:26780
