import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const loadVRM = async (url: string): Promise<VRM> => {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (vrm) {
          resolve(vrm);
        } else {
          reject(new Error('VRM model not found in GLTF'));
        }
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
};
