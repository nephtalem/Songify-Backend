import  puppeteer  from 'puppeteer-extra';
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import OpenAI from 'openai'
import readline from 'readline'
import fs from 'fs'
import 'dotenv/config'

puppeteer.use(StealthPlugin());

const openai = new OpenAI();
const timeout = 10000;

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

async function sleep( milliseconds ) {
    return await new Promise((r, _) => {
        setTimeout( () => {
            r();
        }, milliseconds );
    });
}

async function highlight_links( page ) {
    await page.evaluate(() => {
        document.querySelectorAll('[gpt-link-text]').forEach(e => {
            e.removeAttribute("gpt-link-text");
        });
    });

    const elements = await page.$$(
        "a, button, input, textarea, [role=button], [role=treeitem]"
    );

    elements.forEach( async e => {
        await page.evaluate(e => {
            function isElementVisible(el) {
                if (!el) return false; // Element does not exist

                function isStyleVisible(el) {
                    const style = window.getComputedStyle(el);
                    return style.width !== '0' &&
                           style.height !== '0' &&
                           style.opacity !== '0' &&
                           style.display !== 'none' &&
                           style.visibility !== 'hidden';
                }

                function isElementInViewport(el) {
                    const rect = el.getBoundingClientRect();
                    return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );
                }

                // Check if the element is visible style-wise
                if (!isStyleVisible(el)) {
                    return false;
                }

                // Traverse up the DOM and check if any ancestor element is hidden
                let parent = el;
                while (parent) {
                    if (!isStyleVisible(parent)) {
                    return false;
                    }
                    parent = parent.parentElement;
                }

                // Finally, check if the element is within the viewport
                return isElementInViewport(el);
            }

            e.style.border = "1px solid red";

            const position = e.getBoundingClientRect();

            if( position.width > 5 && position.height > 5 && isElementVisible(e) ) {
                const link_text = e.textContent.replace(/[^a-zA-Z0-9 ]/g, '');
                e.setAttribute( "gpt-link-text", link_text );
            }
        }, e);
    } );
}

async function waitForEvent(page, event) {
    return page.evaluate(event => {
        return new Promise((r, _) => {
            document.addEventListener(event, function(e) {
                r();
            });
        });
    }, event)
}



export async function askgpt  (userPrompt,postOn)  {
    console.log( "###########################################" );
    console.log( "# GPT4V-Browsing by Unconventional Coding #" );
    console.log( "###########################################\n" );


    const browser = await puppeteer.launch( {
        // headless: "false",
        // executablePath: 'C:\\Users\\cv\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe',
        // userDataDir: 'C:\\Users\\cv\\AppData\\Local\\Google\\Chrome SxS\\User Data\\Default',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH? process.env.PUPPETEER_EXECUTABLE_PATH : false,
        args: ['--no-sandbox', "--disabled-setupid-sandbox"],
        ignoreDefaultArgs: ['--disable-extensions'],
        // args: [
        //     '--user-data-dir=C:\\Users\\cv\\AppData\\Local\\Google\\Chrome SxS\\User Data',
        //         '--profile-directory=Profile 1',
        //     ]
    } );

    const page = await browser.newPage();

    await page.setViewport( {
        width: 1200,
        height: 2400,
        deviceScaleFactor: 1,
    } );

    // 3. If there is a form to type in a text, you can write the text by answering in the following JSON format:
    // {"write": "Text to write"}

    const messages = [
        {
            "role": "system",
            "content": `You are a website crawler. You will be given instructions on what to do by browsing. You are connected to a web browser and you will be given the screenshot of the website you are on.
            
            The links on the website will be highlighted in red in the screenshot. Always read what is in the screenshot. Don't guess link names.

            You can only respond with the following task
            
            1. You can go to a specific URL by answering with the following JSON format:
            {"url": "url goes here"}

            2. You can click links on the website by referencing the text inside of the link/button, by answering in the following JSON format:
            {"click": "Text in link"}

            3. Once you are on a URL and you have found the news to the user's question, you can answer with a regular ${postOn} post. tags should be at first.
            When You find the information asked, you will make twitter post 280 characters only for the first sentence, please avoid summary and other stuff just prepare a post.
            then on the next line, I need small paragraphs about about 5 news in 5 paragraph about the news. Remember the paragraphs should be really short.

            Use google search by set a sub-page like 'https://google.com/search?q=search' if applicable. Prefer to use Google for simple queries. If the user provides a direct URL, go to that one. Do not make up links.
            Remember if you are asked to do something you can not do, just provide the url go to. Please don't ask just perform the tasks like giving url or clinking.
            When you finally output the ${postOn} post , start with the sentence "Here is what is happening today: then on the same line give your short ${postOn} post with max 280 characters including tags
            `,
        }
    ];

    console.log("GPT: How can I assist you today?")
    // const prompt = await input("You: ");
    console.log("Prompt was: ",userPrompt)
    const prompt = userPrompt ||  "what is happening in top AI startups";
    // console.log();

    messages.push({
        "role": "user",
        "content": prompt,
    });

    let url;
    let screenshot_taken = false;

    while( true ) {
        if( url ) {
            console.log("Crawling " + url);
            await page.goto( url, {
                waitUntil: "domcontentloaded",
                timeout: timeout,
            } );

            await Promise.race( [
                waitForEvent(page, 'load'),
                sleep(timeout)
            ] );

            await highlight_links( page );
            const pdfConfig = {
                path: 'url.pdf', // Saves pdf to disk. 
                format: 'A4',
                printBackground: true,
                margin: { // Word's default A4 margins
                    top: '2.54cm',
                    bottom: '2.54cm',
                    left: '2.54cm',
                    right: '2.54cm'
                }
            };
            await page.pdf(pdfConfig); // Return the pdf buffer. Useful for saving the file not to disk. 
    

            await page.screenshot( {
                path: "screenshot.jpg",
                fullPage: true,
            } );

            screenshot_taken = true;
            url = null;
        }

        if( screenshot_taken ) {
            const base64_image = await image_to_base64("screenshot.jpg");

            messages.push({
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": base64_image},
                        // "image_url": base64_image,
                    },
                    {
                        "type": "text",
                        "text": `
                        Here's the screenshot of the website you are on right now. 
                        You can click on links with {\"click\": \"Link text\"} or you can crawl to another URL if this one is incorrect. 
                        If you find the answer to the user's question, you can respond normally.
                        Remember until you find the information you are asked, continue to navigate but don't navigate that much.
                        Remember if you are asked to do something you can not do, just provide link to click nothing else. Please don't ask just perform the tasks like giving url or clinking.
                        `,
                    }
                ]
            });

            screenshot_taken = false;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            // "gpt-4-vision-preview",
            max_tokens: 1024,
            messages: messages,
        });

        const message = response.choices[0].message;
        const message_text = message.content;

        messages.push({
            "role": "assistant",
            "content": message_text,
        });

        console.log( "GPT: " + message_text );

        if (message_text.indexOf('{"click": "') !== -1) {
            let parts = message_text.split('{"click": "');
            parts = parts[1].split('"}');
            const link_text = parts[0].replace(/[^a-zA-Z0-9 ]/g, '');
        
            console.log("Clicking on " + link_text)
        
            try {
                const elements = await page.$$('[gpt-link-text]');
        
                let partial;
                let exact;
        
                for (const element of elements) {
                    const attributeValue = await element.evaluate(el => el.getAttribute('gpt-link-text'));
        
                    if (attributeValue.includes(link_text)) {
                        partial = element;
                    }
        
                    if (attributeValue === link_text) {
                        exact = element;
                    }
                }
        
                if (exact || partial) {
                    const [response] = await Promise.all([
                        page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(e => console.log("Navigation timeout/error:", e.message)),
                        (exact || partial).click()
                    ]);
        
                    // Additional checks can be done here, like validating the response or URL
                    await Promise.race( [
                        waitForEvent(page, 'load'),
                        sleep(timeout)
                    ] );

                    await highlight_links(page);
        
                    await page.screenshot({
                        path: "screenshot.jpg",
                        // quality: 100,
                        fullpage: true
                    });
        
                    screenshot_taken = true;
                } else {
                    throw new Error("Can't find link");
                }
            } catch (error) {
                console.log("ERROR: Clicking failed", error);
        
                messages.push({
                    "role": "user",
                    "content": "ERROR: I was unable to click that element",
                });
            }
        
            continue;
        } else if (message_text.indexOf('{"url": "') !== -1) {
            let parts = message_text.split('{"url": "');
            parts = parts[1].split('"}');
            url = parts[0];
        
            continue;
        }

        if( message_text.startsWith("Here")){
            await browser.close();
            return message_text
            
        }else{
            messages.push({
                "role": "user",
                "content": "If you do not find the information on the page, then search on google by using different phrase",
            });
            continue;
        }
       

        // const prompt = await input("You: ");
        // console.log();

        // messages.push({
        //     "role": "user",
        //     "content": prompt,
        // });
    }
}


export default askgpt
