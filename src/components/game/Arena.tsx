import { usePlane, useBox } from "@react-three/cannon";
import { Mesh } from "three";

export function Arena() {
  const [floorRef] = usePlane<Mesh>(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));

  // Simple arena walls and obstacles
  return (
    <group>
      {/* Floor */}
      <mesh ref={floorRef} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      
      {/* Grid helper for that neon look */}
      <gridHelper args={[100, 50, "#00f2ff", "#111"]} rotation={[0, 0, 0]} position={[0, 0.01, 0]} />

      {/* Basic Obstacles */}
      <Box position={[5, 1, 5]} color="#ff00f2" />
      <Box position={[-5, 1, -5]} color="#ff00f2" />
      <Box position={[10, 2, 0]} args={[2, 4, 2]} color="#00f2ff" />
      <Box position={[-10, 2, 0]} args={[2, 4, 2]} color="#00f2ff" />
      
      {/* Outer Walls */}
      <Wall position={[0, 5, 50]} args={[100, 10, 1]} />
      <Wall position={[0, 5, -50]} args={[100, 10, 1]} />
      <Wall position={[50, 5, 0]} args={[1, 10, 100]} />
      <Wall position={[-50, 5, 0]} args={[1, 10, 100]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
    </group>
  );
}

function Box({ position, args = [2, 2, 2], color = "hotpink" }: any) {
  const [ref] = useBox<Mesh>(() => ({ type: "Static", position, args }));
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function Wall({ position, args }: any) {
  const [ref] = useBox<Mesh>(() => ({ type: "Static", position, args }));
  return (
    <mesh ref={ref}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#333" transparent opacity={0.5} />
    </mesh>
  );
}
