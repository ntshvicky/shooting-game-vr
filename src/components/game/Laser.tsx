import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Line, BufferGeometry, Euler } from "three";

export function Laser({ origin, direction, color = "#00f2ff" }: { origin: number[], direction: number[], color?: string }) {
  const lineRef = useRef<any>(null);
  const startTime = useRef(Date.now());
  const endPoint = new Vector3(...origin).add(new Vector3(...direction).multiplyScalar(50));

  useFrame(() => {
    if (lineRef.current) {
      const elapsed = (Date.now() - startTime.current) / 1000;
      lineRef.current.material.opacity = Math.max(0, 1 - elapsed * 8);
      // Slightly animate scale for pulse effect
      lineRef.current.scale.x = 1 + Math.sin(elapsed * 20) * 0.2;
    }
  });

  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([...origin, endPoint.x, endPoint.y, endPoint.z])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial attach="material" color={color} transparent opacity={1} linewidth={3} />
      </line>
      
      {/* Glow Effect */}
      <mesh position={new Vector3(...origin).add(new Vector3(...direction).multiplyScalar(25))} rotation={new Euler().setFromVector3(new Vector3(...direction))}>
        <cylinderGeometry args={[0.02, 0.02, 50, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
