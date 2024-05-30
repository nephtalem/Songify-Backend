import mongoose from "mongoose";
import Campaign from "./models/Campaign.js";
import { scrapeQueue } from "./redis.js"
import cron from 'node-cron';
import "dotenv/config";


async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);

    process.exit(1); // Exit the process if connection fails
  }
}

const scheduleDailyTweets = async () => {
  try{
    await connectToMongoDB();
  console.log("Started")
    const getCronExpressions = (timesPerDay) => {
      const interval = Math.floor(1440 / timesPerDay); // 1440 minutes in a day / number of times per day
      const cronExpressions = [];
      cronExpressions.push(`13 16 * * *`);
      
      for (let i = 0; i < timesPerDay; i++) {
        let hour = Math.floor((i * interval) / 60);
        let minute = (i * interval) % 60;
        cronExpressions.push(`${minute} ${hour} * * *`);
      }
    
      return cronExpressions;
    };

    const campaign = await Campaign.find({ status: "Active" }); 
    campaign.forEach(c => {
  
      const cronExpressions = getCronExpressions(c.schedule);
      console.log(`time for ${c.title}`, cronExpressions)
      cronExpressions.forEach(cronTime => {
        scrapeQueue.add(
          { prompt: c.prompt,
            postOn: c.type ,
            userId: c.user
           },
          { repeat: { cron: cronTime } }
        );
    });

});
} catch (error) {
  res.send({status: "error", data:error});
}
}


(async () => {
// Schedule the job to run every day at midnight
cron.schedule('12 16 * * *', async() => {
    scheduleDailyTweets();
    // await clearQueue()
});
})();
