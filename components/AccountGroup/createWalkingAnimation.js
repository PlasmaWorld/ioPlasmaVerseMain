// components/AccountGroup/createWalkingAnimation.js
import * as THREE from 'three';

export const createWalkingAnimation = (vrm) => {
  const tracks = [];

  // Assuming we have leg bones named "leftLeg" and "rightLeg"
  const leftLeg = vrm.humanoid.getBoneNode('leftLeg');
  const rightLeg = vrm.humanoid.getBoneNode('rightLeg');

  if (leftLeg && rightLeg) {
    const times = [0, 0.5, 1];
    const leftLegValues = [0, Math.PI / 4, 0];
    const rightLegValues = [0, -Math.PI / 4, 0];

    tracks.push(
      new THREE.QuaternionKeyframeTrack('.quaternion', times, leftLegValues),
      new THREE.QuaternionKeyframeTrack('.quaternion', times, rightLegValues)
    );
  }

  const clip = new THREE.AnimationClip('walking', 1, tracks);
  return clip;
};
