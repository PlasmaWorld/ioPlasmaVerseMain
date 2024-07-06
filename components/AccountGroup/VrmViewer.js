import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree, extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
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

const GroundPlane = () => {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="green" />
      </mesh>
      <gridHelper args={[10, 10]} />
    </>
  );
};

const VrmViewer = ({ vrmFile }) => {
  const cameraRef = useRef(new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000));
  const avatarRef = useRef();
  const [animation, setAnimation] = useState(null);

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.4, 5);
      console.log('Camera initialized:', cameraRef.current.position);
    }
  }, []);

  useEffect(() => {
    if (vrmFile) {
      const url = URL.createObjectURL(vrmFile);
      console.log('VRM file URL created:', url);
    }
  }, [vrmFile]);

  const handleLoaded = (vrm) => {
    console.log('VRM loaded:', vrm);
    avatarRef.current = vrm.scene;
    if (vrm.animations && vrm.animations.length > 0) {

    const walkingClip = createWalkingAnimation(vrm);
    setAnimation(walkingClip);
    console.log('Walking animation created and set:', walkingClip);
    }
  };

  return (
    <div style={{ width: '100%', height: '80vh', overflow: 'hidden' }}>
      <Canvas camera={cameraRef.current}>
        <spotLight position={[0, 5, 10]} intensity={0.9} />
        <ambientLight intensity={0.5} />
        <GroundPlane />
        {vrmFile && <VrmLoader file={vrmFile} onLoaded={handleLoaded} />}
        <CameraControls />
        {avatarRef.current && <AvatarAnimation avatarRef={avatarRef} animation={animation} />}
        {avatarRef.current && <Controls avatarRef={avatarRef} />}
      </Canvas>
    </div>
  );
};

export default VrmViewer;