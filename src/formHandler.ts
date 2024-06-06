const PROJECT_ID = 'okini-home';
const REGION = 'us-central1';
const MODEL_ID = 'gemini-experimental';

const url = `https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL_ID}:generateContent`;

const statusSpan = document.getElementById('status')!;

const reader = new FileReader();

function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

const generationConfig = {
  maxOutputTokens: 120,
  temperature: 1,
  topP: 0.95,
};
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_NONE',
  },
];

document
  .getElementById('form')
  ?.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    statusSpan.innerText = 'Processing...';

    const image = document.getElementById('selectedImage') as HTMLInputElement;
    const files = image.files;
    if (!files || files.length === 0) {
      statusSpan.innerText = 'Please select an image file';
      return false;
    }
    const file = files[0];

    const arr = await file.arrayBuffer();
    const base64Data = _arrayBufferToBase64(arr);

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

    const data = {
      contents: [{ role: 'user', parts: [image1, text1] }],
      generationConfig,
      safetySettings,
    };

    try {
      const result = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TOKEN}`,
        },
        body: JSON.stringify(data),
      });

      const resp = await result.json();

      for (const candidate of resp.candidates) {
        if (candidate.finishReason === 'STOP') {
          const content = candidate.content;
          for (const part of content.parts) {
            const { text } = part;
            console.log(JSON.parse(text));
            const result = JSON.parse(text);
            statusSpan.innerText = `Image is ${result.document_type}`;
          }
        }
      }
    } catch (error) {
      console.error(error);
      statusSpan.innerText = 'Error processing image';
    } finally {
      return false;
    }
  });
