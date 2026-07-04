import { useEffect, useRef } from "react";
import {
  AmbientLight,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  WebGLRenderer,
} from "three";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

export default function WaveScene({ className = "", tone = "hero" }) {
  const containerRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new Scene();
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 1.6, 6.2);
    camera.lookAt(0, 0, 0);

    const waveGroup = new Group();
    waveGroup.rotation.x = -1.06;
    waveGroup.rotation.z = tone === "hero" ? -0.18 : 0.22;
    scene.add(waveGroup);

    const geometry = new PlaneGeometry(14, 10, 64, 48);
    const basePositions = Float32Array.from(geometry.attributes.position.array);

    const surfaceColor = tone === "hero" ? 0x2d31df : 0x14168e;
    const wireColor = tone === "hero" ? 0xffffff : 0xff46bf;
    const material = new MeshStandardMaterial({
      color: surfaceColor,
      flatShading: true,
      roughness: 0.92,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94,
    });
    const wireMaterial = new MeshBasicMaterial({
      color: wireColor,
      wireframe: true,
      transparent: true,
      opacity: tone === "hero" ? 0.16 : 0.2,
    });

    const surface = new Mesh(geometry, material);
    const wire = new Mesh(geometry, wireMaterial);
    waveGroup.add(surface);
    waveGroup.add(wire);

    const ambientLight = new AmbientLight(0xffffff, 0.75);
    const keyLight = new DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(1.8, 2.2, 4.8);
    const accentLight = new PointLight(0xff38b8, 2.4, 16);
    accentLight.position.set(-2.6, 1.5, 3.4);

    scene.add(ambientLight, keyLight, accentLight);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      const bounds = container.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };

    container.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    let frameId = 0;
    const animate = () => {
      const time = performance.now() * 0.00045;
      const position = geometry.attributes.position;

      for (let index = 0; index < position.count; index += 1) {
        const offset = index * 3;
        const x = basePositions[offset];
        const y = basePositions[offset + 1];

        const waveHeight =
          Math.sin(x * 0.75 + time * 8) * 0.34 +
          Math.cos(y * 1.1 - time * 6.5) * 0.22 +
          Math.sin((x + y) * 0.4 + time * 5) * 0.15;

        const pointerWarp = prefersReducedMotion
          ? 0
          : Math.sin(x * 0.4 + time * 4 + pointer.x * 2.4) * 0.05 +
            Math.cos(y * 0.6 + time * 4 + pointer.y * 2.1) * 0.05;

        position.array[offset + 2] = waveHeight + pointerWarp;
      }

      position.needsUpdate = true;
      geometry.computeVertexNormals();

      if (!prefersReducedMotion) {
        waveGroup.rotation.z += 0.0007;
        waveGroup.rotation.y = pointer.x * 0.08;
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      geometry.computeVertexNormals();
      renderer.render(scene, camera);
    } else {
      frameId = window.requestAnimationFrame(animate);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      container.removeEventListener("pointermove", onPointerMove);
      geometry.dispose();
      material.dispose();
      wireMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion, tone]);

  return <div className={className} ref={containerRef} />;
}
