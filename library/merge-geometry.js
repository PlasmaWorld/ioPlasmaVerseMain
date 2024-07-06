import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { findChildrenByType, getMeshesSortedByMaterialArray } from './utils.js';
import { createTextureAtlas } from './create-texture-atlas.js';
import { BufferAttribute } from 'three';

export function cloneSkeleton(skinnedMesh) {
    const boneClones = new Map();
    for (const bone of skinnedMesh.skeleton.bones) {
        const clone = bone.clone(false);
        boneClones.set(bone, clone);
    }
    skinnedMesh.skeleton.bones[0].traverse((o) => {
        if (o.type !== "Bone") return;
        const clone = boneClones.get(o);
        for (const child of o.children) {
            const ch = boneClones.get(child);
            if (ch) clone.add(ch);
        }
    });
    const newSkeleton = new THREE.Skeleton(skinnedMesh.skeleton.bones.map((b) => boneClones.get(b)));
    newSkeleton.boneInverses = skinnedMesh.skeleton.boneInverses;
    newSkeleton.pose();
    return newSkeleton;
}

function changeBoneHandedness(bone) {
    console.log("isvrm0");
    const clone = bone.clone(false);
    clone.scale.x = -clone.scale.x;
    clone.rotation.y = -clone.rotation.y;
    clone.position.set(0, 0, 0);
    return clone;
}

function createMergedSkeleton(meshes, scale) {
    const boneClones = new Map();
    const zxNeg = new THREE.Vector3(-1, 1, -1);
    let index = 0;

    meshes.forEach(mesh => {
        if (mesh.skeleton) {
            const clonedSkeleton = cloneSkeleton(mesh);
            const boneArr = clonedSkeleton.bones;

            clonedSkeleton.bones.forEach((bone, boneInd) => {
                if (boneArr.indexOf(bone) !== -1) {
                    const clone = boneClones.get(bone.name);
                    if (clone == null) {
                        const boneData = {
                            index,
                            boneInverses: clonedSkeleton.boneInverses[boneInd],
                            bone: bone.clone(false),
                            parentName: bone.parent?.type == "Bone" ? bone.parent.name : null
                        };
                        index++;
                        boneClones.set(bone.name, boneData);
                    } else {
                        if (bone.userData.VRMcolliders != null) {
                            if (clone.bone.userData.VRMcolliders == null) {
                                clone.bone.userData.VRMcolliders = bone.userData.VRMcolliders;
                            } else {
                                if (bone.userData.VRMcollidersID != clone.bone.userData.VRMcollidersID) {
                                    clone.bone.userData.VRMcolliders = [
                                        ...clone.bone.userData.VRMcolliders,
                                        ...bone.userData.VRMcolliders
                                    ];
                                }
                            }
                        }
                    }
                }
            });
        }
    });

    const finalBones = [];
    const finalBoneInverses = [];
    let boneClonesArr = [...boneClones.values()];
    boneClonesArr.forEach(bnClone => {
        finalBones.push(bnClone.bone);
        finalBoneInverses.push(bnClone.boneInverses);
        if (bnClone.parentName != null) {
            const parent = boneClones.get(bnClone.parentName)?.bone;
            if (parent) parent.add(bnClone.bone);
        }
    });
    const newSkeleton = new THREE.Skeleton(finalBones, finalBoneInverses);
    newSkeleton.bones.forEach(bn => {
        const restPosition = bn.userData?.vrm0RestPosition;
        if (restPosition) {
            bn.position.set(-restPosition.x, restPosition.y, -restPosition.z);
        }
        bn.position.set(bn.position.x * scale, bn.position.y * scale, bn.position.z * scale);
    });
    return newSkeleton;
}

function getUpdatedSkinIndex(newSkeleton, mesh) {
    if (!mesh.skeleton) return;
    const newBonesIndex = new Map();
    mesh.skeleton.bones.forEach((bone, index) => {
        const filterByName = newSkeleton.bones.filter(newBone => newBone.name === bone.name);
        const newIndex = filterByName.length > 0 ? newSkeleton.bones.indexOf(filterByName[0]) : -1;
        newBonesIndex.set(index, newIndex);
    });

    const newSkinIndexArr = [];
    const skinIndices = mesh.geometry.attributes.skinIndex.array;
    for (let i = 0; i < skinIndices.length; i++) {
        newSkinIndexArr[i] = newBonesIndex.get(skinIndices[i]);
    }

    const indexTypedArray = new Uint16Array(newSkinIndexArr);
    return new THREE.BufferAttribute(indexTypedArray, 4, false);
}

function getOrderedNonDupArray(arr) {
    const sortedArr = [...arr];
    sortedArr.sort();
    return sortedArr.filter((item, index) => sortedArr.indexOf(item) === index);
}

function getTypedArrayType(someTypedArray) {
    const typedArrayTypes = [
        Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array,
        Float32Array, Float64Array, BigInt64Array, BigUint64Array
    ];
    const checked = typedArrayTypes.filter(ta => someTypedArray.constructor === ta);
    return checked.length && checked[0] || null;
}

function removeUnusedAttributes(attribute, arrayMatch) {
    const newArr = [];
    for (let i = 0; i < arrayMatch.length; i++) {
        const ind = i * attribute.itemSize;
        for (let j = 0; j < attribute.itemSize; j++) {
            newArr[ind + j] = attribute.array[arrayMatch[i] * attribute.itemSize + j];
        }
    }
    const type = getTypedArrayType(attribute.array);
    const typedArr = new type(newArr);
    return new BufferAttribute(typedArr, attribute.itemSize, attribute.normalized);
}

function remapBoneIndices(geometry, oldSkeleton, newSkeleton) {
    for (let i = 0; i < geometry.attributes.skinIndex.array.length; i += 4) {
        const skinIndices = [
            geometry.attributes.skinIndex.array[i],
            geometry.attributes.skinIndex.array[i + 1],
            geometry.attributes.skinIndex.array[i + 2],
            geometry.attributes.skinIndex.array[i + 3]
        ];

        for (let j = 0; j < 4; j++) {
            const oldBoneIndex = skinIndices[j];
            const newBoneIndex = mapOldBoneIndexToNew(oldBoneIndex, oldSkeleton, newSkeleton);
            skinIndices[j] = newBoneIndex;
        }

        geometry.attributes.skinIndex.array[i] = skinIndices[0];
        geometry.attributes.skinIndex.array[i + 1] = skinIndices[1];
        geometry.attributes.skinIndex.array[i + 2] = skinIndices[2];
        geometry.attributes.skinIndex.array[i + 3] = skinIndices[3];
    }

    geometry.attributes.skinIndex.needsUpdate = true;
}

function mapOldBoneIndexToNew(oldBoneIndex, oldSkeleton, newSkeleton) {
    const oldBone = oldSkeleton.bones[oldBoneIndex];
    const newBone = newSkeleton.bones.find(bone => bone.name === oldBone.name);
    if (newBone) {
        return newSkeleton.bones.indexOf(newBone);
    } else {
        return -1;
    }
}

export async function combineNoAtlas(avatar, options) {
    const { scale, isVrm0 } = options;
    const clonedMeshes = [];
    const material = [];
    const meshes = findChildrenByType(avatar, "SkinnedMesh");

    meshes.forEach(originalMesh => {
        const clonedMesh = originalMesh.clone();
        clonedMeshes.push(clonedMesh);
        if (Array.isArray(originalMesh.material)) {
            material.push(...originalMesh.material);
        } else {
            material.push(originalMesh.material);
        }
    });

    const newSkeleton = createMergedSkeleton(clonedMeshes, scale);
    const group = new THREE.Object3D();
    group.name = "AvatarRoot";

    clonedMeshes.forEach(mesh => {
        const geometry = new THREE.BufferGeometry();
        const attributes = {};
        for (const attributeName in mesh.geometry.attributes) {
            const attribute = mesh.geometry.attributes[attributeName];
            attributes[attributeName] = attribute.clone();
        }

        if (mesh.userData?.isVRM0) {
            for (let i = 0; i < attributes["position"].array.length; i += 3) {
                attributes["position"].array[i] *= -1;
                attributes["position"].array[i + 2] *= -1;
            }
        }

        const source = {
            attributes,
            morphTargetDictionary: { ...mesh.morphTargetDictionary },
            morphTargetInfluences: mesh.morphTargetInfluences || [],
            index: null,
            animations: {}
        };

        const meshMorphAttributes = new Map([mesh].map(m => [m, m.geometry.morphAttributes]));
        const morphTargetDictionaries = new Map([mesh].map(m => [m, m.morphTargetDictionary || {}]));
        source.morphAttributes = mergeSourceMorphAttributes({
            meshes: [mesh],
            sourceMorphAttributes: meshMorphAttributes,
            sourceMorphTargetDictionaries: morphTargetDictionaries,
            destMorphTargetDictionary: source.morphTargetDictionary,
            scale,
        }, isVrm0);

        if (isVrm0) {
            for (let i = 0; i < source.attributes.position.array.length; i += 3) {
                source.attributes.position.array[i] *= -1;
                source.attributes.position.array[i + 2] *= -1;
            }
        }

        geometry.attributes = source.attributes;
        geometry.morphAttributes = source.morphAttributes;
        geometry.morphTargetsRelative = true;

        const baseIndArr = mesh.geometry.index.array;
        const offsetIndexArr = getOrderedNonDupArray(mesh.geometry.index.array);

        const indArrange = [];
        for (let i = 0; i < baseIndArr.length; i++) {
            indArrange[i] = offsetIndexArr.indexOf(baseIndArr[i]);
        }

        remapBoneIndices(geometry, mesh.skeleton, newSkeleton);

        const indexArr = new Uint32Array(indArrange);
        const indexAttribute = new BufferAttribute(indexArr, 1, false);

        geometry.setIndex(indexAttribute);
        for (const att in geometry.attributes) {
            geometry.setAttribute(att, removeUnusedAttributes(geometry.getAttribute(att), offsetIndexArr));
        }

        for (const att in geometry.morphAttributes) {
            const attribute = geometry.morphAttributes[att];
            for (let i = 0; i < attribute.length; i++) {
                attribute[i] = removeUnusedAttributes(attribute[i], offsetIndexArr);
            }
        }

        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] *= scale;
            vertices[i + 1] *= scale;
            vertices[i + 2] *= scale;
        }

        const newMesh = new THREE.SkinnedMesh(geometry, mesh.material);
        newMesh.name = mesh.name;
        newMesh.morphTargetInfluences = source.morphTargetInfluences;
        newMesh.morphTargetDictionary = source.morphTargetDictionary;

        newMesh.bind(newSkeleton);
        group.add(newMesh);
        group.add(newSkeleton.bones[0]);
    });

    group.userData.atlasMaterial = material;
    return group;
}

function cloneMeshAndSaveSkinInfo(mesh) {
    const boneName = mesh.parent.name;
    const originalGlobalPosition = new THREE.Vector3();
    const originalGlobalScale = new THREE.Vector3();
    mesh.getWorldPosition(originalGlobalPosition);
    mesh.getWorldScale(originalGlobalScale);
    mesh = mesh.clone();

    const rotationMatrix = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    mesh.getWorldQuaternion(rotation);
    rotationMatrix.makeRotationFromQuaternion(rotation);

    mesh.userData.boneName = boneName;
    mesh.userData.globalPosition = originalGlobalPosition;
    mesh.userData.globalScale = originalGlobalScale;
    mesh.userData.globalRotationMatrix = rotationMatrix;

    return mesh;
}

function createSkinnedMeshFromMesh(baseSkeleton, mesh) {
    const skinnedMesh = new THREE.SkinnedMesh(mesh.geometry, mesh.material);
    const skeleton = baseSkeleton.clone();
    const boneIndex = skeleton.bones.findIndex(bone => bone.name === mesh.userData.boneName);
    const globalPosition = mesh.userData.globalPosition;
    const globalScale = mesh.userData.globalScale || new THREE.Vector3(1, 1, 1);
    const globalRotationMatrix = mesh.userData.globalRotationMatrix;

    skinnedMesh.add(skeleton.bones[0]);

    const boneIndices = [];
    const weights = [];

    const vertices = skinnedMesh.geometry.attributes.position.array;
    const vertex = new THREE.Vector3();

    const vrm0Mult = mesh.userData.isVRM0 ? -1 : 1;
    for (let i = 0; i < vertices.length; i += 3) {
        vertex.set(vertices[i], vertices[i + 1], vertices[i + 2]);
        vertex.applyMatrix4(globalRotationMatrix);

        vertices[i] = (vrm0Mult * globalScale.x * vertex.x) + globalPosition.x;
        vertices[i + 1] = (globalScale.y * vertex.y) + globalPosition.y;
        vertices[i + 2] = (vrm0Mult * globalScale.z * vertex.z) + globalPosition.z;
        boneIndices.push(boneIndex, 0, 0, 0);
        weights.push(1.0, 0, 0, 0);
    }

    skinnedMesh.geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(boneIndices, 4));
    skinnedMesh.geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));

    skinnedMesh.bind(skeleton);
    return skinnedMesh;
}

export async function combine(avatar, options) {
    let {
        transparentColor = new THREE.Color(1, 1, 1),
        mToonAtlasSize = 4096,
        mToonAtlasSizeTransp = 4096,
        stdAtlasSize = 4096,
        stdAtlasSizeTransp = 4096,
        exportMtoonAtlas = false,
        exportStdAtlas = true,
        isVrm0 = false,
        scale = 1,
        twoSidedMaterial = false,
    } = options;

    const cloneNonSkinnedMeshes = findChildrenByType(avatar, ["Mesh"]);
    for (let i = 0; i < cloneNonSkinnedMeshes.length; i++) {
        cloneNonSkinnedMeshes[i] = cloneMeshAndSaveSkinInfo(cloneNonSkinnedMeshes[i]);
    }

    const cloneSkinnedMeshes = findChildrenByType(avatar, ["SkinnedMesh"]);
    const allMeshes = [...cloneNonSkinnedMeshes, ...cloneSkinnedMeshes];

    if (exportMtoonAtlas == false && exportStdAtlas == false) exportMtoonAtlas = true;

    let { stdMesh, stdTranspMesh, mToonMesh, mToonTranspMesh, requiresTransparency } = getMeshesSortedByMaterialArray(allMeshes);

    if (exportMtoonAtlas == false) {
        stdMesh = [...stdMesh, ...mToonMesh];
        stdTranspMesh = [...stdTranspMesh, ...mToonTranspMesh];
        mToonTranspMesh = [];
        mToonMesh = [];
    }
    if (exportStdAtlas == false) {
        mToonMesh = [...mToonMesh, ...stdMesh];
        mToonTranspMesh = [...mToonTranspMesh, ...stdTranspMesh];
        stdMesh = [];
        stdTranspMesh = [];
    }

    const group = new THREE.Object3D();
    group.name = "AvatarRoot";
    group.userData.atlasMaterial = [];

    const newSkeleton = createMergedSkeleton(allMeshes, scale);

    const meshArrayData = {
        standard: { meshArray: stdMesh, size: stdAtlasSize, isMtoon: false, transparentMaterial: false },
        standardTransparent: { meshArray: stdTranspMesh, size: stdAtlasSizeTransp, isMtoon: false, transparentMaterial: true },
        mToon: { meshArray: mToonMesh, size: mToonAtlasSize, isMtoon: true, transparentMaterial: false },
        mToonTransparent: { meshArray: mToonTranspMesh, size: mToonAtlasSizeTransp, isMtoon: true, transparentMaterial: true }
    };

    for (const prop in meshArrayData) {
        const meshData = meshArrayData[prop];
        const arr = meshData.meshArray;
        if (arr.length > 0) {
            const { bakeObjects, material } = await createTextureAtlas({
                transparentColor,
                atlasSize: meshData.size,
                meshes: arr,
                mtoon: meshData.isMtoon,
                transparentMaterial: meshData.transparentMaterial,
                transparentTexture: requiresTransparency,
                twoSidedMaterial: twoSidedMaterial
            });
            const meshes = bakeObjects.map(bakeObject => bakeObject.mesh);
            const skinnedMeshes = [];

            meshes.forEach(mesh => {
                if (mesh.type == "Mesh") {
                    mesh = createSkinnedMeshFromMesh(newSkeleton, mesh);
                }

                skinnedMeshes.push(mesh);
                const geometry = mesh.geometry;

                const baseIndArr = geometry.index.array;
                const offsetIndexArr = getOrderedNonDupArray(mesh.geometry.index.array);

                const indArrange = [];
                for (let i = 0; i < baseIndArr.length; i++) {
                    indArrange[i] = offsetIndexArr.indexOf(baseIndArr[i]);
                }
                const indexArr = new Uint32Array(indArrange);
                const indexAttribute = new BufferAttribute(indexArr, 1, false);

                geometry.setIndex(indexAttribute);
                for (const att in geometry.attributes) {
                    geometry.setAttribute(att, removeUnusedAttributes(geometry.getAttribute(att), offsetIndexArr));
                }

                for (const att in geometry.morphAttributes) {
                    const attribute = geometry.morphAttributes[att];
                    for (let i = 0; i < attribute.length; i++) {
                        attribute[i] = removeUnusedAttributes(attribute[i], offsetIndexArr);
                    }
                }

                if (!geometry.attributes.uv2) {
                    geometry.attributes.uv2 = geometry.attributes.uv;
                }

                if (mesh.skeleton != null) mesh.geometry.setAttribute("skinIndex", getUpdatedSkinIndex(newSkeleton, mesh));

                for (let i = 0; i < 8; i++) {
                    delete geometry.attributes[`morphTarget${i}`];
                    delete geometry.attributes[`morphNormal${i}`];
                }
            });

            const { dest } = mergeGeometry({ meshes: skinnedMeshes, scale }, isVrm0);
            const geometry = new THREE.BufferGeometry();

            if (isVrm0) {
                for (let i = 0; i < dest.attributes.position.array.length; i += 3) {
                    dest.attributes.position.array[i] *= -1;
                    dest.attributes.position.array[i + 2] *= -1;
                }
            }

            geometry.attributes = dest.attributes;
            geometry.morphAttributes = dest.morphAttributes;
            geometry.morphTargetsRelative = true;
            geometry.setIndex(dest.index);

            const vertices = geometry.attributes.position.array;
            for (let i = 0; i < vertices.length; i += 3) {
                vertices[i] *= scale;
                vertices[i + 1] *= scale;
                vertices[i + 2] *= scale;
            }

            const mesh = new THREE.SkinnedMesh(geometry, material);
            mesh.name = "CombinedMesh_" + prop;
            mesh.morphTargetInfluences = dest.morphTargetInfluences;
            mesh.morphTargetDictionary = dest.morphTargetDictionary;

            mesh.bind(newSkeleton);
            group.add(mesh);

            group.userData.atlasMaterial.push(material);
        }
    }
    group.add(newSkeleton.bones[0]);
    return group;
}

function mergeMorphTargetInfluences({ meshes, sourceMorphTargetDictionaries, destMorphTargetDictionary }) {
    const destMorphTargetInfluences = [];
    Object.entries(destMorphTargetDictionary).map(([morphName, destIndex]) => {
        const mesh = meshes.find(mesh => sourceMorphTargetDictionaries.get(mesh).hasOwnProperty(morphName));
        const sourceIndex = mesh.morphTargetDictionary[morphName];
        destMorphTargetInfluences[destIndex] = mesh.morphTargetInfluences[sourceIndex];
    });
    return destMorphTargetInfluences;
}

function mergeSourceAttributes({ sourceAttributes }) {
    const propertyNames = new Set();
    const allSourceAttributes = Array.from(sourceAttributes.values());
    allSourceAttributes.forEach(sourceAttributes => {
        Object.keys(sourceAttributes).forEach(name => propertyNames.add(name));
    });
    const destAttributes = {};
    Array.from(propertyNames.keys()).map(name => {
        destAttributes[name] = BufferGeometryUtils.mergeBufferAttributes(allSourceAttributes.map(sourceAttributes => sourceAttributes[name]).flat().filter(attr => attr !== undefined));
    });
    return destAttributes;
}

function mergeSourceMorphTargetDictionaries({ sourceMorphTargetDictionaries }) {
    const morphNames = new Set();
    const allSourceDictionaries = Array.from(sourceMorphTargetDictionaries.values());
    allSourceDictionaries.forEach(dictionary => {
        Object.keys(dictionary).forEach(name => morphNames.add(name));
    });
    const destMorphTargetDictionary = {};
    Array.from(morphNames.keys()).map((name, i) => {
        destMorphTargetDictionary[name] = i;
    });
    return destMorphTargetDictionary;
}

function mergeSourceMorphAttributes({ meshes, sourceMorphTargetDictionaries, sourceMorphAttributes, destMorphTargetDictionary, scale }, isVrm0 = false) {
    const propertyNameSet = new Set();
    const allSourceMorphAttributes = Array.from(sourceMorphAttributes.values());
    allSourceMorphAttributes.forEach(sourceMorphAttributes => {
        Object.keys(sourceMorphAttributes).forEach(name => propertyNameSet.add(name));
    });
    const propertyNames = Array.from(propertyNameSet);

    const unmerged = {};
    propertyNames.forEach(propName => {
        unmerged[propName] = [];
        Object.entries(destMorphTargetDictionary).forEach(([morphName, destMorphIndex]) => {
            unmerged[propName][destMorphIndex] = [];
            meshes.forEach(mesh => {
                let bufferAttribute;
                const morphTargetDictionary = sourceMorphTargetDictionaries.get(mesh);
                if (morphTargetDictionary.hasOwnProperty(morphName) && mesh.geometry.morphAttributes[propName]) {
                    const sourceMorphIndex = morphTargetDictionary[morphName];
                    bufferAttribute = mesh.geometry.morphAttributes[propName][sourceMorphIndex];
                } else {
                    const attribute = mesh.geometry.attributes[propName];
                    const array = new attribute.array.constructor(new Array(attribute.array.length).fill(0));
                    bufferAttribute = new THREE.BufferAttribute(array, attribute.itemSize, attribute.normalized);
                }
                unmerged[propName][destMorphIndex].push(bufferAttribute);
            });
        });
    });

    const merged = {};
    propertyNames.forEach(propName => {
        merged[propName] = [];
        for (let i = 0; i < Object.entries(destMorphTargetDictionary).length; i++) {
            merged[propName][i] = BufferGeometryUtils.mergeBufferAttributes(unmerged[propName][i]);
            const buffArr = merged[propName][i].array;
            for (let j = 0; j < buffArr.length; j += 3) {
                buffArr[j] *= scale;
                buffArr[j + 1] *= scale;
                buffArr[j + 2] *= scale;
            }
        }
    });
    return merged;
}

function mergeSourceIndices({ meshes }) {
    var indexOffset = 0;
    var mergedIndex = [];
    meshes.forEach(mesh => {
        const index = mesh.geometry.index;
        for (var j = 0; j < index.count; ++j) {
            mergedIndex.push(index.getX(j) + indexOffset);
        }
        indexOffset += mesh.geometry.attributes.position.count;
    });
    return mergedIndex;
}

export function mergeGeometry({ meshes, scale }, isVrm0 = false) {
    let uvcount = 0;
    meshes.forEach(mesh => {
        uvcount += mesh.geometry.attributes.uv.count;

        if (mesh.userData?.isVRM0) {
            for (let i = 0; i < mesh.geometry.attributes.position.array.length; i += 3) {
                mesh.geometry.attributes.position.array[i] *= -1;
                mesh.geometry.attributes.position.array[i + 2] *= -1;
            }
        }
    });
    const source = {
        meshes,
        attributes: new Map(meshes.map(m => [m, m.geometry.attributes])),
        morphAttributes: new Map(meshes.map(m => [m, m.geometry.morphAttributes])),
        morphTargetDictionaries: new Map(meshes.map(m => [m, m.morphTargetDictionary || {}])),
        morphTargetInfluences: new Map(meshes.map(m => [m, m.morphTargetInfluences || []])),
    };
    const dest = {
        attributes: null,
        morphTargetDictionary: null,
        morphAttributes: null,
        morphTargetInfluences: null,
        index: null,
        animations: {}
    };
    dest.attributes = mergeSourceAttributes({ sourceAttributes: source.attributes });
    const destMorphTargetDictionary = mergeSourceMorphTargetDictionaries({ sourceMorphTargetDictionaries: source.morphTargetDictionaries });
    dest.morphTargetDictionary = destMorphTargetDictionary;
    dest.morphAttributes = mergeSourceMorphAttributes({
        meshes,
        sourceMorphAttributes: source.morphAttributes,
        sourceMorphTargetDictionaries: source.morphTargetDictionaries,
        destMorphTargetDictionary,
        scale,
    }, isVrm0);
    dest.morphTargetInfluences = mergeMorphTargetInfluences({
        meshes,
        sourceMorphTargetDictionaries: source.morphTargetDictionaries,
        destMorphTargetDictionary,
    });
    dest.index = mergeSourceIndices({ meshes });
    dest.animations = {};

    return { source, dest };
}
