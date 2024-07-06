"use client";
import React, { useState, useEffect, useContext } from "react";
import styles from "./ModelInformation.module.css";
import { findChildrenByType, getMaterialsSortedByArray } from "../../library/utils";
import { SceneContext } from "../../context/SceneContext";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

export default function ModelInformation({}) {
    const { characterManager } = useContext(SceneContext);

    const [model, setModel] = useState(null);
    const [meshQty, setMeshQty] = useState(0);
    const [skinnedMeshQty, setSkinnedMeshQty] = useState(0);
    const [standardMaterialQty, setStandardMaterialQty] = useState(0);
    const [standardTranspMaterialQty, setStandardTranspMaterialQty] = useState(0);
    const [standardCutoutMaterialQty, setStandardCutoutMaterialQty] = useState(0);
    const [vrmMaterialQty, setVrmMaterialQty] = useState(0);
    const [vrmTranspMaterialQty, setVrmTranspMaterialQty] = useState(0);
    const [vrmCutoutMaterialQty, setVrmCutoutMaterialQty] = useState(0);
    const [trianglesCount, setTrianglesCount] = useState(0);
    const [bonesCount, setBonesCount] = useState(0);
    const [name, setName] = useState("");
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (selectedFile) {
            const url = URL.createObjectURL(selectedFile);
            const loader = new GLTFLoader();
            loader.register(parser => new VRMLoaderPlugin(parser));
            loader.load(
                url,
                (gltf) => {
                    const vrm = gltf.userData.vrm;
                    VRMUtils.rotateVRM0(vrm);
                    setModel(vrm.scene);
                    setName(selectedFile.name);
                    setFiles(prevFiles => [...prevFiles, selectedFile]);
                },
                (progress) => console.log(`Loading model: ${Math.round((progress.loaded / progress.total) * 100)}%`),
                (error) => console.error('Error loading VRM:', error)
            );
        }
    }, [selectedFile]);

    useEffect(() => {
        if (model != null) {
            const meshes = findChildrenByType(model, "Mesh");
            const skinnedMesh = findChildrenByType(model, "SkinnedMesh");
            setMeshQty(meshes.length);
            setSkinnedMeshQty(skinnedMesh.length);
            const allMeshes = meshes.concat(skinnedMesh);

            const { stdMats, stdCutoutpMats, stdTranspMats, mToonMats, mToonCutoutMats, mToonTranspMats } = getMaterialsSortedByArray(allMeshes);

            setStandardMaterialQty(stdMats.length);
            setStandardTranspMaterialQty(stdTranspMats.length);
            setStandardCutoutMaterialQty(stdCutoutpMats.length);

            setVrmMaterialQty(mToonMats.length);
            setVrmTranspMaterialQty(mToonTranspMats.length);
            setVrmCutoutMaterialQty(mToonCutoutMats.length);

            const { triangles, bones } = characterManager.getBoneTriangleCount();
            setTrianglesCount(triangles);
            setBonesCount(bones);
        }
    }, [model, characterManager]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const previousVrm = () => {
        // Implement functionality to navigate to the previous VRM
    };

    const nextVrm = () => {
        // Implement functionality to navigate to the next VRM
    };

    return (
        <div>
            <input type="file" accept=".vrm" onChange={handleFileChange} />
            {model != null ? (
                <div>
                    <div className={styles["InformationContainerPos"]}>
                        <div className={styles["scrollContainer"]}>
                            <div className={styles["flexSelect"]}>
                                {files.length > 1 && (
                                    <div className={`${styles["arrow-button"]} ${styles["left-button"]}`} onClick={previousVrm} />
                                )}
                                {name && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div className={styles["traitInfoTitle"]} style={{
                                            margin: 'auto',
                                            fontSize: '14px',
                                            width: '200px',
                                            textAlign: 'center',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                        }}>
                                            {name}
                                        </div>
                                    </div>
                                )}
                                {files.length > 1 && (
                                    <div className={`${styles["arrow-button"]} ${styles["right-button"]}`} onClick={nextVrm} />
                                )}
                            </div>
                            <div className={styles["traitInfoTitle"]}>
                                Geometry info:
                            </div>
                            <div className={styles["traitInfoText"]}>
                                Meshes: {meshQty}
                            </div>
                            <div className={styles["traitInfoText"]}>
                                SkinnedMeshes: {skinnedMeshQty}
                            </div>
                            <div className={styles["traitInfoText"]}>
                                Triangles: {trianglesCount}
                            </div>
                            <div className={styles["traitInfoText"]}>
                                Bones: {bonesCount}
                            </div>
                            <div className={styles["traitInfoTitle"]}>
                                Standard Material Count:
                            </div>
                            <div className={styles["traitInfoText"]}>
                                opaque: {standardMaterialQty}
                            </div>
                            <div className={styles["traitInfoText"]}>
                                cutout: {standardCutoutMaterialQty}
                            </div>
                            <div className={styles["traitInfoText"]}>
                                transparent: {standardTranspMaterialQty}
                            </div>
                            <div className={styles["traitInfoTitle"]}>
                                MToon Material Count:
                            </div>
                            <div className={styles["traitInfoText"]}>
                                opaque: {vrmMaterialQty}
                            </div>
                            <div className={styles["traitInfoText"]}>
                                cutout: {vrmCutoutMaterialQty}
                            </div>
                            <div className={styles["traitInfoText"]}>
                                transparent: {vrmTranspMaterialQty}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (<></>)}
        </div>
    );
}
