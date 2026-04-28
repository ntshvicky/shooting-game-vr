import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Mesh } from "three";
import { Text, Float } from "@react-three/drei";

export function Drone({ drone }: { drone: any }) {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Smooth movement to server position
      meshRef.current.position.lerp(new Vector3(...drone.position), 0.1);
      // Gentle rotation
      meshRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group ref={meshRef as any} userData={{ isTarget: true, id: drone.id }}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* Drone Body */}
        <mesh>
          <octahedronGeometry args={[0.4]} />
          <meshStandardMaterial 
            color="#ff00f2" 
            emissive="#ff00f2" 
            emissiveIntensity={2} 
            wireframe 
          />
        </mesh>
        
        {/* Core */}
        <mesh>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={5} />
        </mesh>

        <group position={[0, 0.7, 0]}>
          <Text
            fontSize={0.15}
            color="#ff00f2"
            anchorX="center"
            anchorY="middle"
          >
            TARGET
          </Text>

          {/* Health Bar Background */}
          <mesh position={[0, -0.15, 0]}>
            <planeGeometry args={[0.6, 0.05]} />
            <meshBasicMaterial color="#000" transparent opacity={0.5} />
          </mesh>
          
          {/* Health Bar Foreground */}
          <mesh position={[(-0.6 + (0.6 * (drone.health / 50))) / 2, -0.15, 0.01]}>
            <planeGeometry args={[0.6 * (drone.health / 50), 0.05]} />
            <meshBasicMaterial color="#ff00f2" />
          </mesh>
        </group>
      </Float>
    </group>
  );
}
