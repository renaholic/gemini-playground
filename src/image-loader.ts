const imageInput = document.getElementById(
  'selectedImage'
)! as HTMLInputElement;
const imageElement = document.getElementById('image') as HTMLImageElement;

imageInput.onchange = async () => {
  const files = imageInput.files;
  if (!files) return;
  const file = files[0];

  imageElement.src = URL.createObjectURL(file);
};
