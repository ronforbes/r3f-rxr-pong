import React, { useRef, useState } from "react";
import { useFrame } from "react-three-fiber";
import { VRCanvas, DefaultXRControllers, useController } from "react-xr";
import { softShadows, Sky } from "drei";
import create from "zustand";

softShadows();

const useStore = create((set, get) => ({
  leftPaddleY: 0,
  rightPaddleY: 0,
  setLeftPaddleY: (leftPaddleY) => set({ leftPaddleY }),
  setRightPaddleY: (rightPaddleY) => set({ rightPaddleY }),
  paddleWidth: 0.25,
  paddleHeight: 2
}));

function Ball(props) {
  const radius = 0.25;
  const [velocity, setVelocity] = useState([0.05, 0.03, 0]);
  const leftPaddleY = useStore((state) => state.leftPaddleY);
  const rightPaddleY = useStore((state) => state.rightPaddleY);
  const paddleWidth = useStore((state) => state.paddleWidth);
  const paddleHeight = useStore((state) => state.paddleHeight);
  const group = useRef();
  useFrame((state) => {
    if (
      group.current.position.x - radius <
        -0.5 * props.fieldSize[0] + 0.5 * paddleWidth &&
      velocity[0] < 0
    ) {
      if (
        group.current.position.y - radius < leftPaddleY + 0.5 * paddleHeight &&
        group.current.position.y + radius > leftPaddleY - 0.5 * paddleHeight
      ) {
        setVelocity([-velocity[0], velocity[1], velocity[2]]);
        group.current.position.x = Math.max(
          Math.min(group.current.position.x, 0.5 * props.fieldSize[0]),
          -0.5 * props.fieldSize[0]
        );
      } else {
        group.current.position.x = group.current.position.y = 0;
        setVelocity([-velocity[0], velocity[1], velocity[2]]);
      }
    }

    if (
      group.current.position.x + radius >
        0.5 * props.fieldSize[0] - 0.5 * paddleWidth &&
      velocity[0] > 0
    ) {
      if (
        group.current.position.y - radius < rightPaddleY + 0.5 * paddleHeight &&
        group.current.position.y + radius > rightPaddleY - 0.5 * paddleHeight
      ) {
        setVelocity([-velocity[0], velocity[1], velocity[2]]);
        group.current.position.x = Math.max(
          Math.min(group.current.position.x, 0.5 * props.fieldSize[0]),
          -0.5 * props.fieldSize[0]
        );
      } else {
        group.current.position.x = group.current.position.y = 0;
        setVelocity([-velocity[0], velocity[1], velocity[2]]);
      }
    }

    if (
      (group.current.position.y < -0.5 * props.fieldSize[1] &&
        velocity[1] < 0) ||
      (group.current.position.y > 0.5 * props.fieldSize[1] && velocity[1] > 0)
    ) {
      setVelocity([velocity[0], -velocity[1], velocity[2]]);
      group.current.position.y = Math.max(
        Math.min(group.current.position.y, 0.5 * props.fieldSize[1]),
        -0.5 * props.fieldSize[1]
      );
    }

    group.current.position.x += velocity[0];
    group.current.position.y += velocity[1];
    group.current.position.z += velocity[2];

    group.current.rotation.x += velocity[0];
    group.current.rotation.y += velocity[1];
  });

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow>
        <sphereBufferGeometry attach="geometry" args={[radius, 8, 8]} />
        <meshStandardMaterial
          attach="material"
          color="lightblue"
          roughness={0}
          metalness={0.1}
        />
      </mesh>
      <pointLight {...props} color="white" intensity={10} />
    </group>
  );
}

function Paddle(props) {
  const width = 0.25;
  const height = 2;
  const [position, setPosition] = useState(props.position);
  const setPaddleY = useStore((state) =>
    props.playerIndex === 0 ? state.setLeftPaddleY : state.setRightPaddleY
  );
  const [velocity, setVelocity] = useState([0, 0, 0]);
  const group = useRef();
  const controller = useController(props.controller);

  useFrame((state) => {
    if (controller !== undefined && controller.inputSource.gamepad.connected) {
      setVelocity(0, -controller.inputSource.gamepad.axes[3] * 0.05, 0);
    }

    setPosition([position[0], state.mouse.y * 5, position[2]]);
    setPaddleY(state.mouse.y * 5);

    group.current.position.y += velocity[1];
  });

  return (
    <group position={position} ref={group}>
      <mesh castShadow receiveShadow>
        <boxBufferGeometry attach="geometry" args={[width, height, width]} />
        <meshStandardMaterial attach="material" />
      </mesh>
      <pointLight color={props.color} intensity={10} />
    </group>
  );
}

function Plane(props) {
  return (
    <mesh {...props} receiveShadow>
      <planeBufferGeometry attach="geometry" args={[16, 8]} />
      <meshStandardMaterial attach="material" color="black" />
    </mesh>
  );
}

export default function App() {
  const fieldSize = [12, 6];
  const leftPaddle = (
    <Paddle
      position={[-0.5 * fieldSize[0], 0, 0]}
      controller="left"
      color="red"
      playerIndex={0}
    />
  );
  const rightPaddle = (
    <Paddle
      position={[0.5 * fieldSize[0], 0, 0]}
      controller="right"
      color="blue"
      playerIndex={1}
    />
  );

  return (
    <VRCanvas colorManagement shadowMap>
      <Sky />
      <fog attach="fog" args={["white", 0, 40]} />
      <ambientLight intensity={0.1} />
      <directionalLight
        castShadow
        position={[0, 0, 1]}
        intensity={1.5}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <group position={[0, 0, -5]}>
        <Plane position={[0, 0, -1]} />
        <Ball
          fieldSize={fieldSize}
          leftPaddle={leftPaddle}
          rightPaddle={rightPaddle}
        />
        {leftPaddle}
        {rightPaddle}
      </group>
      <DefaultXRControllers />
    </VRCanvas>
  );
}
