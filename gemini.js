import OpenAI from 'openai'
import readline from 'readline'
import fs from 'fs'
import 'dotenv/config'


const openai = new OpenAI();

async function image_to_base64(image_file) {
    return await new Promise((resolve, reject) => {
        fs.readFile(image_file, (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                reject();
                return;
            }

            const base64Data = data.toString('base64');
            const dataURI = `data:image/jpeg;base64,${base64Data}`;
            resolve(dataURI);
        });
    });
}


async function input( text ) {
    let the_prompt;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await (async () => {
        return new Promise( resolve => {
            rl.question( text, (prompt) => {
                the_prompt = prompt;
                rl.close();
                resolve();
            } );
        } );
    })();

    return the_prompt;
}




export async function askgpt  ()  {
    console.log( "###########################################" );
    console.log( "# GPT4V-Browsing by Unconventional Coding #" );
    console.log( "###########################################\n" );






    const messages = [
        {
            "role": "system",
            "content": "You are expert in math and probability , You will receive an image , andwer the question on the image",
        }
    ];

    console.log("GPT: How can I assist you today?")
    while(true)
{
    const prompt = await input("You: ");
    // const prompt = userPrompt ||  "what is happening in top AI startups";
    // console.log();

    const base64_image = await image_to_base64("b.jpg");

    messages.push({
        "role": "user",
        "content": [
            {
                "type": "image_url",
                "image_url": base64_image,
            },
            {
                "type": "text",
                "text": prompt,
            }
        ]
    });

    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        max_tokens: 1024,
        messages: messages,
    });

    const message = response.choices[0].message;
    const message_text = message.content;

    console.log("GPT: ",message_text);

}
}


askgpt()
