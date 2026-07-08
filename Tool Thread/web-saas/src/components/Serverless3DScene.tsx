"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, MeshTransmissionMaterial, Sphere, Icosahedron, Torus } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Nodes() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2;
      group.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[0.4, 32, 32]} position={[2.5, 1, -1]}>
          <MeshTransmissionMaterial thickness={0.5} roughness={0.1} transmission={1} ior={1.2} chromaticAberration={0.04} color="#3b82f6" />
        </Sphere>
      </Float>
      
      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
        <Torus args={[0.3, 0.1, 16, 32]} position={[-2, -1, 1.5]} rotation={[Math.PI / 3, 0, 0]}>
          <MeshTransmissionMaterial thickness={0.2} roughness={0.2} transmission={1} ior={1.5} chromaticAberration={0.1} color="#10b981" />
        </Torus>
      </Float>

      <Float speed={2.5} rotationIntensity={2} floatIntensity={1.5}>
        <Icosahedron args={[0.5, 0]} position={[0, 2, 2]}>
          <MeshTransmissionMaterial thickness={0.5} roughness={0.1} transmission={1} ior={1.3} chromaticAberration={0.05} color="#8b5cf6" />
        </Icosahedron>
      </Float>
    </group>
  );
}

export default function Serverless3DScene() {
  return (
    <div className="w-full h-full relative cursor-move" style={{ background: "transparent" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Icosahedron args={[1.5, 0]} position={[0, 0, 0]}>
            <MeshTransmissionMaterial 
              backside 
              samples={4} 
              thickness={1.5} 
              roughness={0.1} 
              transmission={1} 
              ior={1.1} 
              chromaticAberration={0.03} 
              color="#ffffff" 
            />
          </Icosahedron>
          {/* Inner core */}
          <Icosahedron args={[0.8, 0]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#2563eb" emissive="#3b82f6" emissiveIntensity={2} />
          </Icosahedron>
        </Float>
        
        <Nodes />
        
        <Environment preset="city" />
        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#000000" />
      </Canvas>
    </div>
  );
}
