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
    console.log(base64Data);

    try {
      const resp = await fetch('http://localhost:3000/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
        }),
      }).then((result) => result.json());

      if (resp.document_type) {
        statusSpan.innerText = `Image is ${resp.document_type}`;
      } else {
        statusSpan.innerText = 'Error processing image';
      }
    } catch (error) {
      console.error(error);
      statusSpan.innerText = 'Error processing image';
    } finally {
      return false;
    }
  });
