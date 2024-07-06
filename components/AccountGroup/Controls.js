// components/AccountGroup/Controls.js
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const Controls = ({ avatarRef }) => {
  const directionRef = useRef({ forward: false, backward: false, left: false, right: false });

  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'w':
          directionRef.current.forward = true;
          break;
        case 's':
          directionRef.current.backward = true;
          break;
        case 'a':
          directionRef.current.left = true;
          break;
        case 'd':
          directionRef.current.right = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'w':
          directionRef.current.forward = false;
          break;
        case 's':
          directionRef.current.backward = false;
          break;
        case 'a':
          directionRef.current.left = false;
          break;
        case 'd':
          directionRef.current.right = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (avatarRef.current) {
      const speed = 0.05;
      const direction = directionRef.current;

      if (direction.forward) avatarRef.current.position.z -= speed;
      if (direction.backward) avatarRef.current.position.z += speed;
      if (direction.left) avatarRef.current.position.x -= speed;
      if (direction.right) avatarRef.current.position.x += speed;
    }
  });

  return null;
};

export default Controls;
