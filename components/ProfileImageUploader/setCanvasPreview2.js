const setCanvasPreview = (
  image, // HTMLImageElement
  canvas, // HTMLCanvasElement
  crop // PixelCrop
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Calculate the scaling factors for the image dimensions
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Calculate the actual crop dimensions based on the scaling factors
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  // Set the canvas dimensions to match the crop dimensions
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  // Clear the canvas before drawing the new image
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );
};

export default setCanvasPreview;
