export const convertToPixelCrop = (percentCrop, imageWidth, imageHeight) => {
    if (!percentCrop || !imageWidth || !imageHeight) {
      return null;
    }
  
    return {
      x: (percentCrop.x / 100) * imageWidth,
      y: (percentCrop.y / 100) * imageHeight,
      width: (percentCrop.width / 100) * imageWidth,
      height: (percentCrop.height / 100) * imageHeight,
    };
  };