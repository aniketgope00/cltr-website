import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

function buildNodeCloud(users = 44) {
  return Array.from({ length: users }, (_, index) => {
    const radius = 1.2 + Math.random() * 2.0;
    const angle = (index / users) * Math.PI * 2;
    // bias some nodes towards clusters to mimic friend groups
    const clusterOffset = (Math.random() - 0.5) * 0.9;
    const height = (Math.random() - 0.5) * 1.6;
    return new Vector3(
      Math.cos(angle) * radius + clusterOffset,
      height,
      Math.sin(angle) * radius + clusterOffset * 0.8,
    );
  });
}

export default function ConnectionGraphScene({ className = "" }) {
  const containerRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new Scene();
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // example social graph data (users + interests + activities)
    const userCount = 40;
    const nodeVectors = buildNodeCloud(userCount + 8); // include a few "activity" nodes
    const pointPositions = [];
    const pointColors = [];
    const nodeMeta = [];
    const linePositions = [];

    // synthesize node metadata: first N are users, rest are activity/interest nodes
    for (let i = 0; i < nodeVectors.length; i++) {
      if (i < userCount) {
        nodeMeta.push({ type: "user", name: `User ${i + 1}`, score: Math.floor(Math.random() * 32) });
      } else {
        nodeMeta.push({ type: "activity", name: `Interest ${i - userCount + 1}`, score: Math.floor(Math.random() * 80) });
      }
    }

    nodeVectors.forEach((vector, index) => {
      pointPositions.push(vector.x, vector.y, vector.z);
      const meta = nodeMeta[index];
      const color = new Color(meta.type === "user" ? 0xff39bb : 0x87ffd9);
      pointColors.push(color.r, color.g, color.b);
    });

    // connect users more densely within clusters and to activities
    for (let outer = 0; outer < nodeVectors.length; outer += 1) {
      for (let inner = outer + 1; inner < nodeVectors.length; inner += 1) {
        const distance = nodeVectors[outer].distanceTo(nodeVectors[inner]);
        const bothUsers = nodeMeta[outer].type === "user" && nodeMeta[inner].type === "user";
        const oneActivity = nodeMeta[outer].type !== nodeMeta[inner].type;
        let threshold = bothUsers ? 1.6 : 2.4;
        // higher chance to link users to nearby activities
        const p = Math.random();
        if (distance < threshold && (p > (bothUsers ? 0.45 : 0.22))) {
          linePositions.push(
            nodeVectors[outer].x,
            nodeVectors[outer].y,
            nodeVectors[outer].z,
            nodeVectors[inner].x,
            nodeVectors[inner].y,
            nodeVectors[inner].z,
          );
        }
      }
    }

    const pointsGeometry = new BufferGeometry();
    pointsGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(pointPositions, 3),
    );
    pointsGeometry.setAttribute(
      "color",
      new Float32BufferAttribute(pointColors, 3),
    );

    const linesGeometry = new BufferGeometry();
    linesGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(linePositions, 3),
    );
    linesGeometry.setDrawRange(0, prefersReducedMotion ? linePositions.length / 3 : 0);

    // create slightly larger points for activity nodes and smaller for users
    const points = new Points(pointsGeometry, new PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
    }));

    // add labeled sprites for a few higher-score nodes
    const labelSprites = [];
    function makeLabel(name, colorHex) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 96;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "left";
      ctx.fillText(name, 8, 32);
      const tx = new Texture(c);
      tx.needsUpdate = true;
      return new Sprite(new SpriteMaterial({ map: tx, transparent: true }));
    }
    nodeMeta.forEach((meta, idx) => {
      if ((meta.type === "user" && meta.score > 20) || (meta.type === "activity" && meta.score > 40)) {
        const sprite = makeLabel(meta.name, meta.type === "user" ? 0xff39bb : 0x87ffd9);
        sprite.scale.set(0.9, 0.3, 1);
        sprite.position.copy(nodeVectors[idx]);
        sprite.position.y += 0.24;
        labelSprites.push(sprite);
        scene.add(sprite);
      }
    });

    const lines = new LineSegments(
      linesGeometry,
      new LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
      }),
    );

    const group = new Group();
    group.add(points);
    group.add(lines);
    scene.add(group);
    scene.add(new AmbientLight(0xffffff, 0.82));

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
    let progress = prefersReducedMotion ? 0.72 : 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.32 },
    );
    observer.observe(container);

    let frameId = 0;
    const animate = () => {
      const target = visible ? 1 : 0.18;
      progress += (target - progress) * 0.03;
      linesGeometry.setDrawRange(0, Math.floor((linePositions.length / 3) * progress));

      if (!prefersReducedMotion) {
        group.rotation.y += 0.0022;
        group.rotation.x = Math.sin(performance.now() * 0.00022) * 0.16;
        // nudge label sprites to face camera
        labelSprites.forEach((s) => s.lookAt(camera.position));
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
      pointsGeometry.dispose();
      linesGeometry.dispose();
      points.material.dispose();
      lines.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion]);

  return <div className={className} ref={containerRef} />;
}
