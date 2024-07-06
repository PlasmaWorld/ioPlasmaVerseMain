import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterManager } from "./characterManager";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function sceneInitializer(canvasId) {
    const scene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    const sceneElements = new THREE.Object3D();
    scene.add(sceneElements);

    const camera = new THREE.PerspectiveCamera(
        30,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 1.3, 2);

    const characterManager = new CharacterManager({
        parentModel: scene,
        createAnimationManager: true,
        renderCamera: camera,
    });
    characterManager.addLookAtMouse(80, canvasId, camera, true);

    const canvasRef = document.getElementById(canvasId);
    if (!canvasRef) {
        throw new Error(`Canvas element with ID ${canvasId} not found`);
    }

    const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = true;
    controls.target = new THREE.Vector3(0, 1, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    const minPan = new THREE.Vector3(-0.5, 0, -0.5);
    const maxPan = new THREE.Vector3(0.5, 1.5, 0.5);

    const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const animate = () => {
        requestAnimationFrame(animate);
        controls.target.clamp(minPan, maxPan);
        controls?.update();
        characterManager.update();
        renderer.render(scene, camera);
    };

    animate();

    const handleMouseClick = (event) => {
        const isCtrlPressed = event.ctrlKey;
        const rect = canvasRef.getBoundingClientRect();
        const mousex = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mousey = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        characterManager.cameraRaycastCulling(mousex, mousey, isCtrlPressed);
    };

    const fetchScene = async () => {
        try {
            const modelPath = "./3d/Platform.glb";
            const loader = new GLTFLoader();
            const gltf = await loader.loadAsync(modelPath);
            sceneElements.add(gltf.scene);
        } catch (error) {
            console.error("Error loading model:", error);
        }
    };

    fetchScene();
    canvasRef.addEventListener("click", handleMouseClick);

    return {
        scene,
        camera,
        controls,
        characterManager,
        sceneElements,
    };
}
