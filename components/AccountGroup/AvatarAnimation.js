// components/AccountGroup/AvatarAnimation.js
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, Clock } from 'three';

const AvatarAnimation = ({ avatarRef, animation }) => {
  const mixerRef = useRef();
  const clockRef = useRef(new Clock());

  useEffect(() => {
    if (avatarRef.current && animation) {
      console.log('Initializing animation mixer for avatar:', avatarRef.current);
      const mixer = new AnimationMixer(avatarRef.current);
      const action = mixer.clipAction(animation);
      action.play();
      mixerRef.current = mixer;
    } else {
      console.log('No animation to play.');
    }
  }, [avatarRef, animation]);

  useFrame(() => {
    if (mixerRef.current) {
      const delta = clockRef.current.getDelta();
      mixerRef.current.update(delta);
      console.log('Mixer frame update:', delta);
    }
  });

  return null;
};

export default AvatarAnimation;
