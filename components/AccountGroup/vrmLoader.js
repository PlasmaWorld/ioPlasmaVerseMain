// components/AccountGroup/VrmLoader.js
import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

const VrmLoader = ({ file, onLoaded }) => {
  const { scene } = useThree();
  const loaderRef = useRef(new GLTFLoader());
  const mixerRef = useRef();
  const avatarRef = useRef();

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      console.log('Loading VRM model:', url);
      const loader = loaderRef.current;
      loader.register((parser) => new VRMLoaderPlugin(parser));
      loader.load(
        url,
        (gltf) => {
          const vrm = gltf.userData.vrm;
          console.log('VRM model loaded:', vrm);
          VRMUtils.rotateVRM0(vrm);
          vrm.scene.rotation.y = Math.PI;
          vrm.scene.scale.set(0.5, 0.5, 0.5);

          // Remove existing avatar if any
          if (avatarRef.current) {
            scene.remove(avatarRef.current);
          }
          avatarRef.current = vrm.scene;
          scene.add(avatarRef.current);

          // Check and handle animations
          if (gltf.animations.length > 0) {
            console.log('Animations found:', gltf.animations);
            const mixer = new THREE.AnimationMixer(vrm.scene);
            mixer.clipAction(gltf.animations[0]).play();
            mixerRef.current = mixer;
            onLoaded(vrm, gltf.animations);
          } else {
            console.log('No animations found.');
            onLoaded(vrm, []);
          }
        },
        (progress) => console.log('Loading model: ${Math.round((progress.loaded / progress.total) * 100)}%'),
        (error) => console.error('Error loading VRM:', error)
      );
    }
  }, [file, scene,onLoaded]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
      console.log('Mixer updated:', delta);
    }
  });

  return null;
};

export default VrmLoader;