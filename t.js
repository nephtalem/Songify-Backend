import fs from "fs";
import path from "path";
import OpenAI from "openai";
import 'dotenv/config'

const openai = new OpenAI();

const speechFile = path.resolve("./speech.mp3");

async function main() {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "shimmer",
    input: "Bem-vindo!.  Eu sou Velda, a IA mais inteligente de todas!!! Serei seu assistente pessoal. Como posso ajudá-lo hoje?",
  });
  console.log(speechFile);
  const buffer = Buffer.from(await mp3.arrayBuffer());
  await fs.promises.writeFile(speechFile, buffer);
}
main();