
// import readline from 'readline'

import 'dotenv/config'
import axios from 'axios';

// async function input( text ) {
//     let the_prompt;

//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout
//     });

//     await (async () => {
//         return new Promise( resolve => {
//             rl.question( text, (prompt) => {
//                 the_prompt = prompt;
//                 rl.close();
//                 resolve();
//             } );
//         } );
//     })();

//     return the_prompt;
// }

export async function askpplx  (prompt,postOn)  {
    console.log( "###########################################" );
    console.log( "# pplx-Browsing #" );
    console.log( "###########################################\n" );
    console.log( "#",prompt,postOn );


    const messages = [
        {
            "role": "system",
            "content": `You are a social media manager. You will be given instructions on what to do by browsing write the posts. 
            
            
            When you finally output the ${postOn} post , start with the word Post: then continue.
            first paragraph should be one sentence and other paragraphs with detail about each topic the first paragraph.Write it as a human writes it with tags.
             Remember to include human touches, write the posts as a a normal human being writes it not like news.     
            `,
        }
    ];


    // while( true ) {


        console.log("GPT: How can I assist you today?")
        // const prompt = await input("You: ");
    
        messages.push({
            "role": "user",
            "content": prompt,
        });


    try {
        

        const options = {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: `Bearer ${process.env.PPLX_API_KEY}`
            },
            body: JSON.stringify({
              model: "llama-3-sonar-large-32k-online",
            //   'mixtral-8x7b-instruct',
            //   'llama-3-70b-instruct',
            //   'llama-3-sonar-small-32k-online',
              messages

            })
          };
          let message_text
          await fetch('https://api.perplexity.ai/chat/completions', options)
            .then(response => response.json())
            .then(response =>{
                console.log(response.choices[0].message.content)
                message_text = response.choices[0].message.content
    })
            .catch(err => console.error(err));


        console.log( "GPT: " + message_text );

        if( message_text.startsWith("Post:")){
            return (message_text)
     
            
        }else{
            return (message_text)
            // messages.push({
            //     "role": "user",
            //     "content": "If you do not find the information on the page, then search on google by using different phrase",
            // });
            // continue;
        }
    
} catch (error) {
       console.log("error",error) 
}
}
// }


export default askpplx
//  askpplx()
