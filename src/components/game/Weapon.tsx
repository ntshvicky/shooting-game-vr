import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Vector3, Euler } from "three";

export function Weapon({ isFiring }: { isFiring: boolean }) {
  const group = useRef<any>(null);
  const muzzleFlash = useRef<any>(null);

  useFrame((state) => {
    if (!group.current) return;

    // Movement sway (bobbing)
    const time = state.clock.getElapsedTime();
    const bob = Math.sin(time * 5) * 0.005;
    const swayX = Math.cos(time * 2) * 0.005;

    // Weapon positioning relative to camera
    group.current.position.set(0.3 + swayX, -0.25 + bob, -0.5);
    group.current.rotation.set(0, -0.1, 0);

    // Muzzle flash visibility
    if (muzzleFlash.current) {
      muzzleFlash.current.visible = isFiring && Math.random() > 0.5;
      muzzleFlash.current.scale.setScalar(isFiring ? 1 + Math.random() : 0);
    }

    // Gentle recoil
    if (isFiring) {
      group.current.position.z += 0.05;
      group.current.rotation.x -= 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Main Gun Body */}
      <mesh castShadow>
        <boxGeometry args={[0.08, 0.12, 0.4]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Barrel */}
      <mesh position={[0, 0, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Neon Detail */}
      <mesh position={[0, 0.04, -0.1]}>
        <boxGeometry args={[0.085, 0.02, 0.3]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2} />
      </mesh>

      {/* Muzzle Flash Point */}
      <group ref={muzzleFlash} position={[0, 0, -0.4]}>
        <mesh>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.8} />
        </mesh>
        <pointLight color="#00f2ff" intensity={2} distance={2} />
      </group>
    </group>
  );
}
