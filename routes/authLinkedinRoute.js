import express from "express";
import askgpt from "../scraper.js";
import axios from "axios";
import generator  from "generate-password";



// import LinkedinToken from "../Models/LinkedinToken.js";

import "dotenv/config";

// Twitter API init

const router = express.Router();




// LinkedIn API credentials
const clientId = "86lul93kck70ij";
const clientSecret = "Gyp4eloqJEhW6ent";
const redirectUri = "http://127.0.0.1:5000/api/linkedin/callback";

// LinkedIn API endpoints

// const postUrl = "https://api.linkedin.com/v2/shares";
const postUrl = "https://api.linkedin.com/v2/ugcPosts"

// Route for initiating the authentication process
// router.get("/auth", async (req, res) => {
//     try {
//         const state = generator.generate({
//                 length: 14,
//               });
//     const token = new LinkedinToken({ state });
//     await token.save();
    
//         res.redirect(
//             `https://www.linkedin.com/oauth/v2/authorization?response_type=code&state=${state}&client_id=${clientId}&redirect_uri=${redirectUri}&state=fooobar&scope=openid%20w_member_social%20profile%20email`
//           );
        
//       } catch (error) {
//         console.error(error);
//       }


// });

// Route for handling the callback from LinkedIn
// router.get("/callback", async (req, res) => {
//   const { code, state } = req.query;
//   const token = await LinkedinToken.findOne({ state }).sort({ createdAt: -1 });

//   // Exchange authorization code for access token
//   if (!token) {
//     res.send({ error:"Error state does not match" });
//   }
//   try {

//     const {data} = await axios.post("https://www.linkedin.com/oauth/v2/accessToken", {
//         grant_type: 'authorization_code',
//         code,
//         redirect_uri: redirectUri,
//         client_id: clientId,
//         client_secret: clientSecret
//       }, {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       });

//     console.log("data",data);
//     const accessToken = data.access_token;
//     const idToken = data.id_token;
//     const expires_in = data.expires_in;
//     token.accessToken = accessToken;
//     token.id_token = idToken;
//     token.expires_in = expires_in;
//     await token.save();

//     res.send({ access_token: accessToken });
//   } catch (error) {
//     console.error("Error exchanging code for access token:", error);
//     res.status(500).send("Error exchanging code for access token");
//   }

// });
// router.post("/try", async (req, res) => {
//   // const token = await XToken.findOne().sort({ createdAt: -1 });
//   const prompt = req?.body;

//   const data = await askgpt(prompt?.Prompt);
 
//   // console.log("data returned", data)
//   res.send({ status: "Success", data });
// });

// Route for posting on LinkedIn
router.get("/post", async (req, res) => {
  const { accessToken, message } = req.body;
  const post = "Second Post";
  

  try {
    const token = await LinkedinToken.findOne().sort({ createdAt: -1 });
    console.log("ttoken",token)
    console.log("ttoken",token?.accessToken)
    const resp = await axios.get("https://api.linkedin.com/v2/userinfo",{

        headers:{
            Authorization: `Bearer ${token?.accessToken}`
            // Authorization: "Bearer AQWCKgakB2PYQnOJ8H7WNGI9IT2D84E5BMqf4tuXWZ5N9KpkKcI8I8svh-Mowc3hm4FnLdBWKOxzcvT8Av2YXQLxbueLr5_WlaDWdd07xRE1-A4B7Keh5P3UMn5ASnrqlg9mC5_rQwQejrzjlibT6x9D8JZq8UBsQqj1QRI7-wYLmCNKu0EkmwBEQxYSif_IO0MM1CvwGHwFHYPZKVuDh48glgnAUeiNGlqZzI926LcV4UuXtwYWi6JPKIKqAhoK7VWQgC0cKQW-l6ceMmS6MiYIKuFkAez3zBjjWNzLYhvSr0WeayyvlUSg6EB3QT9WfjyF89oN2mn2Lq8VUACbWLwSvtZ5DQ"
        }
    })
    const urn = resp?.data?.sub;
    try {
        const { data } = await axios.post(postUrl, {
          author: `urn:li:person:${urn}`, // Replace with your LinkedIn user ID
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: "Seconds one"
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': "PUBLIC"
          }
        }, {
          headers: {
            // "Content-Type": "application/X-Restli-Protocol-Version: 2.0.0",
            'Authorization': `Bearer ${token?.accessToken}`,
          }
        });
    
        console.log('Post response:', data);
        res.send('Post successfully posted on LinkedIn');
      } catch (error) {
        console.error('Error posting on LinkedIn:', error);
        res.send('Error posting on LinkedIn');
      }

  } catch (error) {
    console.error("Error posting on LinkedIn:", error);
    res.status(500).send("Error posting on LinkedIn");
  }
});

export default router;
