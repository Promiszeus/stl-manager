import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ThreeViewerProps {
  url: string;
  filename: string;
}

export default function ThreeViewer({ url, filename }: ThreeViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    setIsLoading(true);
    setLoadProgress(0);
    setErrorMessage(null);

    // --- Three.js objects ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1d2f');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;

    // Middle mouse = Pan (move), Left = Rotate, Right/Scroll = Zoom
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.DOLLY
    };

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dl1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dl1.position.set(1, 2, 3);
    scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0xffffff, 1.0);
    dl2.position.set(-1, -1, -2);
    scene.add(dl2);

    let animationFrameId: number;
    let loadedPivot: THREE.Group | null = null;
    let rendererReady = false;

    // ---- STEP 1: This function is called once we have BOTH the geometry AND real container size ----
    const fitCameraToModel = (w: number, h: number) => {
      if (!loadedPivot || !rendererReady) return;

      renderer.setSize(w, h);
      camera.aspect = w / h;

      // Compute world-space bounding box of the centered pivot
      const box = new THREE.Box3().setFromObject(loadedPivot);
      const size = box.getSize(new THREE.Vector3()).length();

      camera.near = size * 0.001;
      camera.far = size * 100;
      camera.position.set(0, size * 0.5, size * 1.2);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.maxDistance = size * 10;

      camera.updateProjectionMatrix();
      controls.update();
      setIsLoading(false);
    };

    // ---- STEP 2: Start animation loop immediately ----
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ---- STEP 3: Load the 3D model in background ----
    const onLoad = (obj: any) => {
      try {
        let mesh: THREE.Object3D;
        if (obj instanceof THREE.BufferGeometry) {
          const mat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.6, metalness: 0.1 });
          mesh = new THREE.Mesh(obj, mat);
          // STL files are Z-up, so rotate to Y-up (Three.js default)
          mesh.rotation.x = -Math.PI / 2;
        } else {
          mesh = obj;
          // 3MF meshes are typically Z-up as well
          mesh.rotation.x = -Math.PI / 2;
        }

        const pivot = new THREE.Group();
        pivot.add(mesh);
        scene.add(pivot);
        pivot.updateMatrixWorld(true);

        // Center the pivot by offsetting by its bounding box center
        const box = new THREE.Box3().setFromObject(pivot);
        const center = box.getCenter(new THREE.Vector3());
        pivot.position.sub(center);

        loadedPivot = pivot;

        // If the container already has a size, fit camera immediately
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (rendererReady && w > 0 && h > 0) {
          fitCameraToModel(w, h);
        }
      } catch (err) {
        console.error("[ThreeViewer] Error mounting mesh:", err);
        setErrorMessage("3D-Modell konnte nicht im Renderer platziert werden.");
        setIsLoading(false);
      }
    };

    const onProgress = (evt: ProgressEvent) => {
      if (evt.lengthComputable) {
        setLoadProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    const onError = (err: any) => {
      console.error("[ThreeViewer] Error loading 3D model:", err);
      setIsLoading(false);
      setErrorMessage("3D-Modell konnte nicht geladen werden (Datei nicht gefunden oder nicht lesbar).");
    };

    const cleanName = (filename || url || '').toLowerCase();
    const is3mf = cleanName.endsWith('.3mf') || cleanName.includes('.3mf');
    const isStl = cleanName.endsWith('.stl') || cleanName.includes('.stl');

    if (isStl) {
      new STLLoader().load(url, onLoad, onProgress, onError);
    } else if (is3mf) {
      new ThreeMFLoader().load(url, onLoad, onProgress, onError);
    } else {
      // Default fallback: try 3MF then STL
      new ThreeMFLoader().load(url, onLoad, onProgress, () => {
        new STLLoader().load(url, onLoad, onProgress, onError);
      });
    }

    // ---- STEP 4: ResizeObserver fires with true pixel dimensions once modal is laid out ----
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        if (!rendererReady) {
          // First time we get real dimensions: set renderer and mark as ready
          rendererReady = true;
        }
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        // If the model has already been loaded, fit it now
        if (loadedPivot) {
          fitCameraToModel(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [url, filename, retryCount]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      {errorMessage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#1a1d2f', zIndex: 20, color: '#fff', gap: '14px', padding: '24px', textAlign: 'center'
        }}>
          <AlertCircle size={36} color="#ff6b6b" />
          <div style={{ fontSize: '15px', fontWeight: 'bold' }}>3D-Vorschau nicht verfügbar</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px' }}>{errorMessage}</div>
          <button
            onClick={() => setRetryCount(c => c + 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              border: 'none', borderRadius: '10px', padding: '8px 16px', color: '#fff',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginTop: '6px'
            }}
          >
            <RotateCcw size={15} /> Erneut versuchen
          </button>
        </div>
      )}

      {isLoading && !errorMessage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#1a1d2f', zIndex: 10, color: '#8899bb', gap: '16px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>Loading 3D Model...</div>
          <div style={{ width: '200px', height: '4px', background: '#2a2d3f', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${loadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #00d2ff, #8e2de2)', transition: 'width 0.2s ease', borderRadius: '2px' }} />
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>{loadProgress > 0 ? `${loadProgress}%` : 'Connecting...'}</div>
          <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '4px' }}>🖱️ Left: Rotate • Middle: Pan • Scroll: Zoom</div>
        </div>
      )}
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
