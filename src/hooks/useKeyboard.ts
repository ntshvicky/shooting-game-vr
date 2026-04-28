import { useState, useEffect } from "react";

export const useKeyboard = () => {
  const [actions, setActions] = useState({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    jump: false,
    fire: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setActions((prev) => ({ ...prev, moveForward: true }));
          break;
        case "KeyS":
        case "ArrowDown":
          setActions((prev) => ({ ...prev, moveBackward: true }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setActions((prev) => ({ ...prev, moveLeft: true }));
          break;
        case "KeyD":
        case "ArrowRight":
          setActions((prev) => ({ ...prev, moveRight: true }));
          break;
        case "Space":
          setActions((prev) => ({ ...prev, jump: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          setActions((prev) => ({ ...prev, moveForward: false }));
          break;
        case "KeyS":
        case "ArrowDown":
          setActions((prev) => ({ ...prev, moveBackward: false }));
          break;
        case "KeyA":
        case "ArrowLeft":
          setActions((prev) => ({ ...prev, moveLeft: false }));
          break;
        case "KeyD":
        case "ArrowRight":
          setActions((prev) => ({ ...prev, moveRight: false }));
          break;
        case "Space":
          setActions((prev) => ({ ...prev, jump: false }));
          break;
      }
    };

    const handleMouseDown = () => {
      setActions((prev) => ({ ...prev, fire: true }));
    };

    const handleMouseUp = () => {
      setActions((prev) => ({ ...prev, fire: false }));
    };

    let scrollTimeout: any = null;
    const handleWheel = (e: WheelEvent) => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      const isForward = e.deltaY < 0;
      setActions((prev) => ({ 
        ...prev, 
        moveForward: isForward, 
        moveBackward: !isForward 
      }));

      scrollTimeout = setTimeout(() => {
        setActions((prev) => ({ 
          ...prev, 
          moveForward: false, 
          moveBackward: false 
        }));
      }, 150);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("wheel", handleWheel);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return actions;
};
