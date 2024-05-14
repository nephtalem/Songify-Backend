import fs from "fs";
import path from "path";
import OpenAI from "openai";
import 'dotenv/config'

const openai = new OpenAI();

const speechFile = path.resolve("./speech.mp3");

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: "Hello Everybody, my name is Natnael ,I have built the best resume builder out there. Have you ever tried websites that lets you edit everything on your resume then at last when you click on Download, then BOOM , you are hit with a payment page. Unlike those bad boys, resumez.tech does not charge you a penny, maybe a few hundred dollars, just kidding!!! Remember resumez with the Z not s dot tech, go and try it.",
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
main();