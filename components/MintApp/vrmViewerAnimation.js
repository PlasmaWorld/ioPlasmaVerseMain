"use client";
import React, { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { VRMUtils, VRM } from "@pixiv/three-vrm";
import { useCharacterAnimations } from "@/Hooks/VrmViewerContext";

function Woman(props) {
  const group = useRef();
  const { scene } = useGLTF("/character-assets/drophunter/body/drophunter.vrm");
  const { setAnimations, animationIndex } = useCharacterAnimations();
  const fbxLoader = new FBXLoader();
  
  const animations = {
    idle1: '/animations/idle_neurohacker.fbx',
    idle2: '/animations/idle_neurohacker2.fbx',
  };

  const loadFBXAnimation = (url, vrm) => {
    return new Promise((resolve, reject) => {
      fbxLoader.load(url, (fbx) => {
        const clip = fbx.animations[0];
        const action = vrm.getAnimationAction(clip);
        resolve(action);
      }, undefined, reject);
    });
  };

  useEffect(() => {
    const applyAnimations = async () => {
      const vrm = scene.userData.vrm;
      VRMUtils.rotateVRM0(vrm);

      const loadedActions = [];
      for (const [key, path] of Object.entries(animations)) {
        try {
          const action = await loadFBXAnimation(path, vrm);
          loadedActions.push(action);
        } catch (error) {
          console.error(`Failed to load animation ${key}:`, error);
        }
      }

      const animationNames = loadedActions.map(action => action.getClip().name);
      setAnimations(animationNames);

      if (animationNames.length > 0 && loadedActions[animationIndex]) {
        loadedActions[animationIndex].reset().fadeIn(0.5).play();
        return () => {
          loadedActions[animationIndex].fadeOut(0.5);
        };
      }
    };

    applyAnimations();
  }, [animationIndex, setAnimations]);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

export default Woman;
