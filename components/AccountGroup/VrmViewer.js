import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import VrmLoader from './vrmLoader';
import AvatarAnimation from './AvatarAnimation';
import Controls from './Controls';
import { createWalkingAnimation } from './createWalkingAnimation';

extend({ OrbitControls });

const CameraControls = () => {
  const { camera, gl: { domElement } } = useThree();
  const controlsRef = useRef();

  useFrame(() => controlsRef.current.update());

  return <orbitControls ref={controlsRef} args={[camera, domElement]} />;
};

const VrmViewer = ({ vrmFile }) => {
  const cameraRef = useRef(new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000));
  const sceneRef = useRef(new THREE.Scene());
  const avatarRef = useRef(new THREE.Group());
  const [animation, setAnimation] = useState(null);

  const handleLoaded = async (vrm, defaultGlbFiles) => {
    console.log('VRM loaded:', vrm);

    const mergedGroup = new THREE.Group();
    mergedGroup.add(vrm.scene);
    avatarRef.current.add(vrm.scene);

    const gltfLoader = new GLTFLoader();
    for (const glbFile of defaultGlbFiles) {
      const gltf = await new Promise((resolve, reject) => {
        gltfLoader.load(glbFile, resolve, undefined, reject);
      });
      mergedGroup.add(gltf.scene);
    }

    avatarRef.current = mergedGroup;
    sceneRef.current.add(avatarRef.current);

    if (vrm.animations && vrm.animations.length > 0) {
      const walkingClip = createWalkingAnimation(vrm);
      setAnimation(walkingClip);
      console.log('Walking animation created and set:', walkingClip);
    }

    return mergedGroup;
  };

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.4, 5);
      console.log('Camera initialized:', cameraRef.current.position);
    }
    sceneRef.current.add(avatarRef.current);
  }, []);

  useEffect(() => {
    const defaultGlbFiles = ['/3d/Platform.glb'];

    if (vrmFile) {
      handleLoaded(vrmFile, defaultGlbFiles)
        .then(mergedGroup => {
          console.log('VRMs and GLBs merged:', mergedGroup);
        })
        .catch(error => {
          console.error('Error merging VRMs and GLBs:', error);
        });
    }
  }, [vrmFile]);

  return (
    <div style={{ width: '100%', height: '80vh', overflow: 'hidden' }}>
      <Canvas camera={cameraRef.current}>
        <spotLight position={[0, 5, 10]} intensity={0.9} />
        <ambientLight intensity={0.5} />
        <primitive object={sceneRef.current} />
        {vrmFile && <VrmLoader file={vrmFile} onLoaded={handleLoaded} />}
        <CameraControls />
        {avatarRef.current && <AvatarAnimation avatarRef={avatarRef} animation={animation} />}
        {avatarRef.current && <Controls avatarRef={avatarRef} />}
      </Canvas>
    </div>
  );
};

export default VrmViewer;
