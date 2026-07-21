import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const modelsToTest = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash'
];

async function testModels() {
  for (const model of modelsToTest) {
    try {
      console.log(`Testing model: ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: 'Hi! Just say "hello" back if you are working.'
      });
      console.log(`✅ Success for ${model}:`, response.text.trim());
    } catch (error) {
      if (error.message.includes("429") || error.message.includes("quota")) {
        console.log(`❌ Failed for ${model}: Quota limit exceeded (429)`);
      } else {
        console.log(`❌ Failed for ${model}:`, error.message);
      }
    }
  }
}

testModels();
