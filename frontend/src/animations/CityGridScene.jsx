import { useEffect, useRef } from "react";
import {
  AmbientLight,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
  Texture,
  WebGLRenderer,
} from "three";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

const pinPalette = [0xff3abf, 0xf8f2e3, 0x5860e6, 0xffa537, 0x87ffd9];
const pinData = [
  { x: -2.1, z: -1.4, name: "Anu", activity: 24 },
  { x: -0.8, z: 1.3, name: "Rohit", activity: 9 },
  { x: 0.4, z: -0.2, name: "Mira", activity: 3 },
  { x: 1.8, z: 1.7, name: "Saurav", activity: 18 },
  { x: 2.2, z: -1.1, name: "Ish", activity: 7 },
  { x: -2.4, z: 0.7, name: "Tina", activity: 12 },
  { x: 0.1, z: 2.3, name: "Dev", activity: 30 },
  { x: 2.8, z: 0.1, name: "Priya", activity: 6 },
];

export default function CityGridScene({ className = "" }) {
  const containerRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new Scene();
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(44, 1, 0.1, 100);
    camera.position.set(0, 5, 6.2);
    camera.lookAt(0, 0, 0);

    const stage = new Group();
    scene.add(stage);

    // create a canvas-backed texture that combines a stylized map base and a heatmap
    const mapCanvas = document.createElement("canvas");
    mapCanvas.width = 1024;
    mapCanvas.height = 1024;
    const mapCtx = mapCanvas.getContext("2d");

    const baseGradient = mapCtx.createLinearGradient(0, 0, 0, mapCanvas.height);
    baseGradient.addColorStop(0, "#3f48e6");
    baseGradient.addColorStop(1, "#1f24d6");
    mapCtx.fillStyle = baseGradient;
    mapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    // subtle abstract 'city' shapes to suggest a map silhouette — aesthetic fallback
    mapCtx.fillStyle = "rgba(255,255,255,0.02)";
    for (let i = 0; i < 6; i++) {
      mapCtx.beginPath();
      mapCtx.ellipse(
        120 + i * 140,
        300 + (i % 2) * 80,
        280 - i * 30,
        120 + i * 10,
        0,
        0,
        Math.PI * 2,
      );
      mapCtx.fill();
    }

    const mapTexture = new CanvasTexture(mapCanvas);

    const floor = new Mesh(
      new PlaneGeometry(8.4, 8.4),
      new MeshStandardMaterial({
        map: mapTexture,
        roughness: 0.95,
        metalness: 0.02,
        transparent: true,
        opacity: 0.98,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    stage.add(floor);

    const grid = new GridHelper(8.4, 10, 0xf6f2e8, 0xf6f2e8);
    grid.material.transparent = true;
    grid.material.opacity = 0.32;
    stage.add(grid);

    const pinGroup = new Group();
    stage.add(pinGroup);

    // heatmap overlay canvas texture (updated when pins change)
    const heatCanvas = document.createElement("canvas");
    heatCanvas.width = 1024;
    heatCanvas.height = 1024;
    const heatCtx = heatCanvas.getContext("2d");
    const heatTexture = new CanvasTexture(heatCanvas);

    const heatPlane = new Mesh(
      new PlaneGeometry(8.4, 8.4),
      new MeshBasicMaterial({
        map: heatTexture,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      }),
    );
    heatPlane.rotation.x = -Math.PI / 2;
    heatPlane.position.y = 0.01;
    stage.add(heatPlane);

    function drawHeatmap() {
      heatCtx.clearRect(0, 0, heatCanvas.width, heatCanvas.height);
      // draw multiple radial gradients at pin locations
      pinData.forEach((p, idx) => {
        const intensity = Math.min(1, Math.log2(1 + p.activity) / 5 + 0.1);
        const cx = ((p.x + 4.2) / 8.4) * heatCanvas.width;
        const cy = ((-p.z + 4.2) / 8.4) * heatCanvas.height;
        const grad = heatCtx.createRadialGradient(cx, cy, 10, cx, cy, 220);
        const color = `rgba(${(255,58)}, ${(58 + idx * 10) % 255}, ${191}, ${intensity})`;
        grad.addColorStop(0, `rgba(255,58,191,${0.28 * intensity})`);
        grad.addColorStop(0.35, `rgba(255,150,200,${0.12 * intensity})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        heatCtx.fillStyle = grad;
        heatCtx.beginPath();
        heatCtx.arc(cx, cy, 220, 0, Math.PI * 2);
        heatCtx.fill();
      });
      heatTexture.needsUpdate = true;
    }

    // helper to create a small label texture with initials
    function createLabelTexture(name, color) {
      const cx = document.createElement("canvas");
      cx.width = 256;
      cx.height = 128;
      const ctx = cx.getContext("2d");
      ctx.clearRect(0, 0, cx.width, cx.height);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, cx.width, cx.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 60px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initials = name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      // background circle
      ctx.beginPath();
      ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
      ctx.arc(cx.width / 2, cx.height / 2, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(initials, cx.width / 2, cx.height / 2 + 4);
      return new CanvasTexture(cx);
    }

    const pins = pinData.map((p, index) => {
      const group = new Group();
      const stem = new Mesh(
        new CylinderGeometry(0.08, 0.08, 0.9, 18),
        new MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.55,
        }),
      );
      stem.position.y = 0.45;

      const color = pinPalette[index % pinPalette.length];
      const head = new Mesh(
        new SphereGeometry(0.19, 18, 18),
        new MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.28,
        }),
      );
      head.position.y = 0.98;

      // soft glow sprite behind the head
      const glowTex = (function () {
        const c = document.createElement("canvas");
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext("2d");
        const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
        g.addColorStop(0, "rgba(255,58,191,0.9)");
        g.addColorStop(0.25, "rgba(255,58,191,0.45)");
        g.addColorStop(1, "rgba(255,58,191,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        return new CanvasTexture(c);
      })();
      const glow = new Sprite(
        new SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0.8 }),
      );
      glow.scale.set(0.9, 0.9, 0.9);
      glow.position.y = 1.02;

      // label sprite with initials
      const labelTex = createLabelTexture(p.name, color);
      const label = new Sprite(new SpriteMaterial({ map: labelTex, transparent: true }));
      label.scale.set(0.9, 0.45, 1);
      label.position.set(0.35, 1.36, 0);

      group.position.set(p.x, 0.02, p.z);
      group.scale.setScalar(prefersReducedMotion ? 1 : 0.001);
      group.add(stem);
      group.add(head);
      group.add(glow);
      group.add(label);
      pinGroup.add(group);
      return { group, label };
    });

    scene.add(new AmbientLight(0xffffff, 0.92));
    const keyLight = new DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2.5, 6, 5);
    scene.add(keyLight);

    const accent = new PointLight(0xff3abf, 2.1, 18);
    accent.position.set(-2, 2, 1.5);
    scene.add(accent);

    const resize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    let visible = prefersReducedMotion;
    let progress = prefersReducedMotion ? 1 : 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.28 },
    );
    observer.observe(container);

    let frameId = 0;
    const animate = () => {
      progress += ((visible ? 1 : 0.2) - progress) * 0.04;
      const elapsed = performance.now() * 0.001;

      pins.forEach((pinObj, index) => {
        const reveal = Math.max(0, Math.min(1, progress * 1.25 - index * 0.08));
        const scale = prefersReducedMotion ? 1 : 0.001 + reveal;
        pinObj.group.scale.setScalar(scale);
        pinObj.group.position.y = 0.02 + Math.sin(elapsed * 2 + index) * 0.04;
        // keep label facing camera
        pinObj.label.lookAt(camera.position);
      });

      // update heatmap texture occasionally
      if (Math.floor(elapsed * 2) % 10 === 0) {
        drawHeatmap();
      }

      if (!prefersReducedMotion) {
        stage.rotation.y = Math.sin(elapsed * 0.45) * 0.18;
        stage.rotation.x = -0.16 + Math.cos(elapsed * 0.4) * 0.02;
      } else {
        stage.rotation.x = -0.14;
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      frameId = window.requestAnimationFrame(animate);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      floor.geometry.dispose();
      floor.material.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
      pinGroup.traverse((child) => {
        if ("geometry" in child && child.geometry) {
          child.geometry.dispose();
        }
        if ("material" in child && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      mapTexture && mapTexture.dispose && mapTexture.dispose();
      heatTexture && heatTexture.dispose && heatTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion]);

  return <div className={className} ref={containerRef} />;
}
