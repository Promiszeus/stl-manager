import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { AlertCircle, RotateCcw, Play, Pause, Grid, Layers, RefreshCw } from 'lucide-react';
import { useI18n } from './i18n';

interface ThreeViewerProps {
  url: string;
  filename: string;
}

const MATERIAL_COLORS = [
  { name: 'Cyan', color: '#00d2ff', hex: 0x00d2ff },
  { name: 'Silver', color: '#d4d4d8', hex: 0xd4d4d8 },
  { name: 'Orange', color: '#f97316', hex: 0xf97316 },
  { name: 'Gold', color: '#f59e0b', hex: 0xf59e0b },
  { name: 'Slate', color: '#475569', hex: 0x475569 },
  { name: 'Emerald', color: '#10b981', hex: 0x10b981 }
];

export default function ThreeViewer({ url, filename }: ThreeViewerProps) {
  const { t } = useI18n();
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 3D Studio State
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedColor, setSelectedColor] = useState(MATERIAL_COLORS[0].hex);

  // Three.js References
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const fitCameraRef = useRef<(() => void) | null>(null);

  // Update wireframe mode dynamically
  useEffect(() => {
    meshesRef.current.forEach(mesh => {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m: any) => {
          if ('wireframe' in m) m.wireframe = wireframe;
        });
      } else if (mesh.material && 'wireframe' in mesh.material) {
        (mesh.material as any).wireframe = wireframe;
      }
    });
  }, [wireframe]);

  // Update material color dynamically
  useEffect(() => {
    meshesRef.current.forEach(mesh => {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => {
          if ('color' in m) (m as THREE.MeshStandardMaterial).color.setHex(selectedColor);
        });
      } else if (mesh.material && 'color' in mesh.material) {
        (mesh.material as THREE.MeshStandardMaterial).color.setHex(selectedColor);
      }
    });
  }, [selectedColor]);

  // Update grid floor visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Update auto rotate in OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.5;
    }
  }, [autoRotate]);

  const handleResetCamera = useCallback(() => {
    if (fitCameraRef.current) {
      fitCameraRef.current();
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    setIsLoading(true);
    setLoadProgress(0);
    setErrorMessage(null);
    meshesRef.current = [];

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c101d');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.5;
    controlsRef.current = controls;

    // Middle mouse = Pan, Left = Rotate, Right/Scroll = Zoom
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.DOLLY
    };

    // --- Studio Lighting Setup ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88bbff, 1.2);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 1.0);
    rimLight.position.set(0, -3, 2);
    scene.add(rimLight);

    let animationFrameId: number;
    let loadedPivot: THREE.Group | null = null;
    let rendererReady = false;

    // Fit camera to bounding box
    const fitCameraToModel = (w: number, h: number) => {
      if (!loadedPivot || !rendererReady) return;

      renderer.setSize(w, h);
      camera.aspect = w / h;

      const box = new THREE.Box3().setFromObject(loadedPivot);
      const size = box.getSize(new THREE.Vector3()).length();
      const minY = box.min.y;

      // Position grid helper under the model
      if (gridHelperRef.current) {
        scene.remove(gridHelperRef.current);
        gridHelperRef.current.dispose();
      }
      const gridSize = Math.max(size * 1.6, 20);
      const grid = new THREE.GridHelper(gridSize, 20, 0x00d2ff, 0x1e293b);
      grid.position.y = minY - 0.5;
      grid.visible = showGrid;
      scene.add(grid);
      gridHelperRef.current = grid;

      camera.near = size * 0.001;
      camera.far = size * 100;
      camera.position.set(size * 0.7, size * 0.6, size * 1.1);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.maxDistance = size * 12;

      camera.updateProjectionMatrix();
      controls.update();
      setIsLoading(false);
    };

    fitCameraRef.current = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        fitCameraToModel(container.clientWidth, container.clientHeight);
      }
    };

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const createStudioMaterial = () => {
      return new THREE.MeshStandardMaterial({
        color: selectedColor,
        roughness: 0.35,
        metalness: 0.25,
        wireframe: wireframe
      });
    };

    // Load Model Handler
    const onLoad = (obj: any) => {
      try {
        let meshGroup: THREE.Object3D;
        if (obj instanceof THREE.BufferGeometry) {
          const mat = createStudioMaterial();
          const mesh = new THREE.Mesh(obj, mat);
          mesh.rotation.x = -Math.PI / 2;
          meshesRef.current.push(mesh);
          meshGroup = mesh;
        } else {
          obj.traverse((child: any) => {
            if (child.isMesh) {
              child.material = createStudioMaterial();
              meshesRef.current.push(child);
            }
          });
          obj.rotation.x = -Math.PI / 2;
          meshGroup = obj;
        }

        const pivot = new THREE.Group();
        pivot.add(meshGroup);
        scene.add(pivot);
        pivot.updateMatrixWorld(true);

        // Center the model at 0,0,0
        const box = new THREE.Box3().setFromObject(pivot);
        const center = box.getCenter(new THREE.Vector3());
        pivot.position.sub(center);

        loadedPivot = pivot;

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
      new ThreeMFLoader().load(url, onLoad, onProgress, () => {
        new STLLoader().load(url, onLoad, onProgress, onError);
      });
    }

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        if (!rendererReady) {
          rendererReady = true;
        }
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

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
      scene.clear();
      renderer.dispose();
      controls.dispose();
    };
  }, [url, filename, retryCount]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '14px', overflow: 'hidden', background: '#0c101d' }}>
      {/* Floating 3D Studio Controls Bar */}
      {!isLoading && !errorMessage && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 20, 35, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          padding: '4px 8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Auto Rotate Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title={t('autoRotate')}
            style={{
              background: autoRotate ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'rgba(255,255,255,0.06)',
              color: autoRotate ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {autoRotate ? <Pause size={14} /> : <Play size={14} />}
          </button>

          {/* Wireframe Toggle */}
          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            title={t('wireframe')}
            style={{
              background: wireframe ? 'rgba(0, 210, 255, 0.25)' : 'rgba(255,255,255,0.06)',
              color: wireframe ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: wireframe ? '1px solid var(--accent-cyan)' : 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Layers size={14} />
          </button>

          {/* Grid Floor Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title={t('gridFloor')}
            style={{
              background: showGrid ? 'rgba(0, 210, 255, 0.25)' : 'rgba(255,255,255,0.06)',
              color: showGrid ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: showGrid ? '1px solid var(--accent-cyan)' : 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Grid size={14} />
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            title={t('resetCamera')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-muted)',
              border: 'none',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <RefreshCw size={14} />
          </button>

          {/* Separator */}
          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

          {/* Color Picker Swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {MATERIAL_COLORS.map(mc => (
              <button
                key={mc.name}
                type="button"
                onClick={() => setSelectedColor(mc.hex)}
                title={mc.name}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: mc.color,
                  border: selectedColor === mc.hex ? '2px solid #fff' : '1px solid rgba(0,0,0,0.5)',
                  boxShadow: selectedColor === mc.hex ? `0 0 8px ${mc.color}` : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.15s'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {errorMessage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#0c101d', zIndex: 20, color: '#fff', gap: '14px', padding: '24px', textAlign: 'center'
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

      {/* Loading State */}
      {isLoading && !errorMessage && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#0c101d', zIndex: 10, color: '#8899bb', gap: '16px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>3D-Studio wird initialisiert...</div>
          <div style={{ width: '220px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${loadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #00d2ff, #3b82f6)', transition: 'width 0.2s ease', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '600' }}>{loadProgress > 0 ? `${loadProgress}% geladen` : 'Verbindung zum Modell...'}</div>
          <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>🖱️ Drehen: Linke Maustaste • Bewegen: Mittlere Maustaste • Zoom: Scrollrad</div>
        </div>
      )}

      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
