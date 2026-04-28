import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Mesh, Euler } from "three";
import { Text } from "@react-three/drei";

export function RemotePlayer({ player }: { player: any }) {
  const meshRef = useRef<Mesh>(null);
  const color = player.team === "Red" ? "#ff00f0" : "#00f2ff";

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.lerp(new Vector3(...player.position), 0.2);
      meshRef.current.rotation.set(0, player.rotation[1], 0); // Only rotate around Y for body
    }
  });

  return (
    <group ref={meshRef as any} userData={{ isPlayer: true, id: player.id }}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Visual Armor/Lights */}
      <mesh position={[0, 0.2, 0.15]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>

      {/* Helmet/Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#111" />
        
        {/* Visor */}
        <mesh position={[0, 0.05, 0.15]}>
          <boxGeometry args={[0.3, 0.1, 0.1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
        </mesh>
      </mesh>

      {/* Held Weapon (Simplified) */}
      <mesh position={[0.4, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Name tag and Health Bar */}
      <group position={[0, 1.3, 0]}>
        <Text
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {player.id.substring(0, 8).toUpperCase()}
        </Text>
        
        {/* Health Bar Background */}
        <mesh position={[0, -0.2, 0]}>
          <planeGeometry args={[0.8, 0.08]} />
          <meshBasicMaterial color="#000" transparent opacity={0.5} />
        </mesh>
        
        {/* Health Bar Foreground */}
        <mesh position={[(-0.8 + (0.8 * (player.health / 100))) / 2, -0.2, 0.01]}>
          <planeGeometry args={[0.8 * (player.health / 100), 0.08]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}
