import { useEffect, useRef, useState } from "react";
import { useSphere } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Mesh, Raycaster, Euler } from "three";
import { useKeyboard } from "../../hooks/useKeyboard";
import socket from "../../lib/socket";
import { Weapon } from "./Weapon";

const SPEED = 5;
const JUMP_FORCE = 4;

export function Player() {
  const { camera, scene } = useThree();
  const [isFiring, setIsFiring] = useState(false);
  const [ref, api] = useSphere<Mesh>(() => ({
    mass: 1,
    type: "Dynamic",
    position: [0, 5, 0],
    args: [0.6],
    fixedRotation: true,
  }));

  const velocity = useRef([0, 0, 0]);
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

  const pos = useRef([0, 0, 0]);
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

  const { moveForward, moveBackward, moveLeft, moveRight, jump, fire } = useKeyboard();

  const raycaster = useRef(new Raycaster());
  const lastFireTime = useRef(0);
  const recoilRef = useRef(new Vector3());

  useFrame((state) => {
    // Movement logic
    const direction = new Vector3();
    const frontVector = new Vector3(0, 0, Number(moveBackward) - Number(moveForward));
    const sideVector = new Vector3(Number(moveLeft) - Number(moveRight), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED)
      .applyEuler(camera.rotation);

    api.velocity.set(direction.x, velocity.current[1], direction.z);

    if (jump && Math.abs(velocity.current[1]) < 0.05) {
      api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
    }

    // Recover from recoil
    recoilRef.current.lerp(new Vector3(), 0.1);

    // Sync position to camera
    camera.position.set(pos.current[0], pos.current[1] + 0.6, pos.current[2]);
    
    // Apply recoil/shake to camera
    camera.position.add(recoilRef.current);

    // Sync move to server
    socket.emit("move", {
      position: pos.current,
      rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
    });

    // Shooting logic
    if (fire && state.clock.elapsedTime - lastFireTime.current > 0.15) {
      lastFireTime.current = state.clock.elapsedTime;
      setIsFiring(true);
      setTimeout(() => setIsFiring(false), 50);

      // Camera Recoil
      recoilRef.current.set(
        (Math.random() - 0.5) * 0.05,
        Math.random() * 0.1,
        0.05
      );
      
      const origin = camera.position.clone();
      const direction = new Vector3();
      camera.getWorldDirection(direction);

      socket.emit("shoot", {
        origin: [origin.x, origin.y, origin.z],
        direction: [direction.x, direction.y, direction.z],
      });

      // Hit detection
      raycaster.current.set(origin, direction);
      const remotePlayers = scene.children.filter(child => 
        child.userData && child.userData.isPlayer && child.userData.id !== socket.id
      );
      
      const drones = scene.children.filter(child => 
        child.userData && child.userData.isTarget
      );

      const intersects = raycaster.current.intersectObjects([...remotePlayers, ...drones], true);
      if (intersects.length > 0) {
        let current: any = intersects[0].object;
        while (current && !current.userData?.id) {
          current = current.parent;
        }
        if (current && current.userData?.id) {
          socket.emit("hit", { targetId: current.userData.id });
        }
      }
    }
  });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.01]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      
      {/* Viewmodel Weapon - using the three camera object directly to parent the weapon */}
      {camera && (
        <primitive object={camera}>
          <Weapon isFiring={isFiring} />
        </primitive>
      )}
    </group>
  );
}
