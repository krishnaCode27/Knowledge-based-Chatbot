 "use client";

import { Canvas } from "@react-three/fiber";
import { Float, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";

function Stack() {
  return (
    <group rotation={[0.18, -0.38, 0]}>
      <mesh position={[-0.28, -0.03, -0.25]} rotation={[0, -0.13, -0.08]} castShadow>
        <boxGeometry args={[1.35, 1.72, 0.12]} />
        <meshStandardMaterial color="#d9a441" roughness={0.42} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[0, 0.05, 0.02]} castShadow>
        <boxGeometry args={[1.35, 1.72, 0.12]} />
        <meshStandardMaterial color="#343943" roughness={0.55} />
      </mesh>
      <mesh position={[0.28, 0.08, 0.25]} rotation={[0, 0.16, 0.06]} castShadow>
        <boxGeometry args={[1.35, 1.72, 0.12]} />
        <meshStandardMaterial color="#f0eee8" roughness={0.35} />
      </mesh>
      <mesh position={[0.28, 0.08, 0.318]} rotation={[0, 0.16, 0.06]}>
        <boxGeometry args={[0.92, 0.015, 0.008]} />
        <meshStandardMaterial color="#c8c4b9" />
      </mesh>
    </group>
  );
}

export default function DocumentStack() {
  return <div className="stack-canvas" aria-label="Three-dimensional stack of documents">
    <Canvas camera={{ position: [0, 0, 4.6], fov: 35 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.3} />
      <directionalLight position={[3, 4, 5]} intensity={2.4} castShadow />
      <pointLight position={[-3, -1, 2]} intensity={0.7} color="#d9a441" />
      <Suspense fallback={null}>
        <Float speed={1.25} rotationIntensity={0.12} floatIntensity={0.22}>
          <Stack />
        </Float>
        <ContactShadows position={[0, -1.15, 0]} opacity={0.28} scale={4} blur={2.5} />
      </Suspense>
    </Canvas>
  </div>;
}