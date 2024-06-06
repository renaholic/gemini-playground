import {
  HarmBlockThreshold,
  HarmCategory,
  VertexAI,
} from '@google-cloud/vertexai';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { readFileSync } from 'fs';

const MODEL_ID = 'gemini-experimental';

const credentials = JSON.parse(
  readFileSync('serviceAccount.json', 'utf-8')
);

const vertexAI = new VertexAI({
  project: credentials.project_id,
  googleAuthOptions: { credentials },
});

const generativeModel = vertexAI.getGenerativeModel({
  model: MODEL_ID,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
  generationConfig: {
    maxOutputTokens: 120,
    temperature: 1,
    topP: 0.95,
  },
});
const app = express();
app.use(bodyParser({ limit: '100mb' }));
app.use(
  cors({
    origin: '*',
  })
);
app.post('/detect', express.json(), async (req, res) => {
  const { base64Data } = req.body;

  const image1 = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Data,
    },
  };

  const text1 = {
    text: `is this a passport or id card?
    respond by json-parsable string, with no extra characters
    
    "{
      "document_type": "Passport" | "ID Card" | "Neither"
    }"`,
  };

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [image1, text1] }],
    });
    console.log(result);

    if (!result.response.candidates)
      return res.json({ message: 'No candidates' });

    for (const candidate of result.response.candidates) {
      if (candidate.finishReason === 'STOP') {
        const content = candidate.content;
        for (const part of content.parts) {
          const { text } = part;
          if (text) {
            const result = JSON.parse(text);
            return res.json(result);
          }
        }
      }
    }
  } catch (error) {}

  return res.json({
    document_type: 'Neither',
  });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
