import  puppeteer  from 'puppeteer-extra';
import fs from 'fs';
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import 'dotenv/config'
import {setTimeout} from "node:timers/promises";

puppeteer.use(StealthPlugin());



(async () => {
    const browser = await puppeteer.launch({
    headless: "false",
    executablePath: 'C:\\Users\\cv\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe',
    userDataDir: 'C:\\Users\\cv\\AppData\\Local\\Google\\Chrome SxS\\User Data',
  });
  const page = await browser.newPage();

  const url = "https://www.linkedin.com/posts/simran-sachdeva-b88258222_hiring-jobs-internships-activity-7187464587871453184-ONiL/"
  // "https://www.linkedin.com/posts/senankhawaja_if-youre-looking-for-a-remote-compensated-activity-7172694912700727296-oyYY/"
  // "https://www.linkedin.com/posts/abigaylepeterson_do-you-know-the-student-who-cold-emailed-activity-7168651092921139202-RGdB/"
  // "https://www.linkedin.com/posts/avi-agola_still-open-for-internships-drop-your-email-activity-7189750122002411520-TeU_/"
  // "https://www.linkedin.com/posts/simran-sachdeva-b88258222_hiring-jobs-internships-activity-7187464587871453184-ONiL?utm_source=share&utm_medium=member_desktop"
  // "https://www.linkedin.com/posts/avnibarman_should-i-share-the-cold-email-template-that-activity-7149112327756275713-kDdf?utm_source=share&utm_medium=member_desktop"
  // "https://www.linkedin.com/posts/mercor-ai_i-need-to-hire-300-remote-software-engineers-activity-7159984706262908930-06fn?utm_source=share&utm_medium=member_desktop"
  // "https://www.linkedin.com/posts/abigaylepeterson_internships-jobs-career-activity-7156375203957141505-iWRq?utm_source=share&utm_medium=member_desktop"
  // 'https://www.linkedin.com/posts/luke-geel_boston-ai-artificialintelligence-activity-7183174561041928192-YeZK/?utm_source=share&utm_medium=member_desktop'
  // Navigate to the LinkedIn post URL
  await page.goto(url);

  // Wait for the comments section to load
  await page.waitForSelector('.comments-comments-list');

  async function loadAllComments() {
    let i = 0;
    while (true) {
      const loadMoreButton = await page.$('.comments-comments-list__load-more-comments-button');
      if (!loadMoreButton || i==100 ) break; // Break the loop if the button is not found
      // || i==70
      await loadMoreButton.click();
      await setTimeout(3000)
      i++;
    }
  }

  await loadAllComments();


  const comments = await page.evaluate(() => {
    const commentsList = document.querySelectorAll('.comments-comment-item');

    // Convert NodeList to Array and map to extract comment text
    let i=0
    const commentsArray = Array.from(commentsList).map((comment,index) => {
        const emailElement = comment.querySelector('a[href^="mailto:"]');
        let emailOnly
        if (emailElement) {
          emailOnly = emailElement.getAttribute('href').replace('mailto:', '');
        }

        let detail = comment.querySelector('.comments-post-meta__profile-info-wrapper').innerText.trim();
        const lines = detail.split('\n');

        // The first part is the name
        const name = lines[0];
        const first_namearr = name.split(' ');

        // The first part is the name
        const firstname = first_namearr[0];
        const lastname = first_namearr[(first_namearr.length-1)];
        
        // The last part is the user details
        const userDetails = lines[(lines.length-1)];

        // comment.querySelector('.update-components-text').innerText.trim()
if(!emailOnly) return null
i+=1;
      return {
        firstname,
        lastname,
        index:i,
        name: name,
        email: emailOnly,
        userDetails
      };
    
    }).filter(notUndefined => notUndefined !== null);

    return commentsArray;
  });

  let users = []

console.log(typeof(comments))
users.push(comments)
fs.writeFile(
  "users.json",
  JSON.stringify(users),
  err => {
      // Checking for errors 
      if (err) throw err;

      // Success 
      console.log("Done writing");
  }); 

  console.log(comments);

  await browser.close();
})();