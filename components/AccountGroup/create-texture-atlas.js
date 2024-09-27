import * as THREE from 'three';

// Function to load an external texture
function loadTexture(texturePath) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      texturePath,
      (texture) => {
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

export const applyTextureToVRM = async ({ vrm, texturePath = null, meshName = null }) => {
  console.log('Applying texture to VRM.');

  try {
      const newTexture = texturePath ? await loadTexture(texturePath) : null;

      vrm.scene.traverse((child) => {
          if (child.isMesh && (!meshName || child.name === meshName)) {
              console.log(`Found mesh: ${child.name}`);
              const material = Array.isArray(child.material) ? child.material[0] : child.material;

              if (material && material.map) {
                  console.log(`Original material name: ${material.name || '[Unnamed Material]'}`);
                  console.log('Original material texture:', material.map);

                  const existingTexture = material.map;
                  const uvSettings = {
                      repeat: existingTexture.repeat.clone(),
                      offset: existingTexture.offset.clone(),
                      wrapS: existingTexture.wrapS,
                      wrapT: existingTexture.wrapT,
                      rotation: existingTexture.rotation,
                      center: existingTexture.center.clone()
                  };

                  newTexture.repeat.copy(uvSettings.repeat);
                  newTexture.offset.copy(uvSettings.offset);
                  newTexture.wrapS = uvSettings.wrapS;
                  newTexture.wrapT = uvSettings.wrapT;
                  newTexture.rotation = uvSettings.rotation;
                  newTexture.center.copy(uvSettings.center);

                  newTexture.magFilter = existingTexture.magFilter;
                  newTexture.minFilter = existingTexture.minFilter;
                  newTexture.anisotropy = existingTexture.anisotropy;
                  newTexture.flipY = existingTexture.flipY;
                  newTexture.encoding = existingTexture.encoding;
                  newTexture.format = existingTexture.format;
                  newTexture.premultiplyAlpha = existingTexture.premultiplyAlpha;
                  newTexture.generateMipmaps = existingTexture.generateMipmaps;

                  material.map = newTexture;
                  material.needsUpdate = true;

                  console.log(`Applied texture to material: ${material.name || '[Unnamed Material]'}`);
              } else if (material) {
                  console.warn(`No existing texture found on material: ${material.name || '[Unnamed Material]'}, applying new texture if provided.`);
                  if (newTexture) {
                      material.map = newTexture;
                      material.needsUpdate = true;
                      console.log(`Applied new texture to material: ${material.name || '[Unnamed Material]'}`);
                  }
              } else {
                  console.warn(`Material is undefined for mesh: ${child.name}`);
              }
          }
      });

      console.log('Finished applying texture to VRM.');
  } catch (error) {
      console.error(`Error applying texture:`, error);
  }
};
