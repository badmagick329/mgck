'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Mesh, Vector3 } from 'three';

const startingPoint = Math.random() * 10 - 5;
const getSpeed = () => Math.max(0.5, Math.random()) * 0.03;
const size = 0.8;

export default function LoadingBox(props: JSX.IntrinsicElements['mesh']) {
  const rotSpeed = getSpeed();
  const [hoverColor, setHoverColor] = useState<string>(randomColor());
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHover] = useState(false);
  const [currentDir, setCurrentDir] = useState<Vector3>(
    new Vector3(
      getSpeed() * (Math.random() > 0.5 ? 1 : -1),
      getSpeed() * (Math.random() > 0.5 ? 1 : -1),
      0
    )
  );
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.x = startingPoint;
      meshRef.current.position.y = startingPoint;
    }
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotSpeed;
      meshRef.current.rotation.y += rotSpeed;
      const newX = getX(meshRef.current.position.x, currentDir);
      const newY = getY(meshRef.current.position.y, currentDir);
      setCurrentDir(new Vector3(newX, newY, 0));
      meshRef.current.position.add(currentDir);
      // console.log('current pos', meshRef.current.position);
    }
  });

  return (
    <mesh
      {...props}
      ref={meshRef}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => {
        setHover(false);
        setHoverColor(randomColor());
      }}
    >
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={hovered ? hoverColor : 'orange'} />
    </mesh>
  );
}

function getX(currentX: number, currentDir: Vector3) {
  const boundary = 5.7;
  if (currentX >= boundary) {
    return Math.abs(currentDir.x) * -1;
  } else if (currentX <= -boundary) {
    return Math.abs(currentDir.x);
  }
  return currentDir.x;
}

function getY(currentY: number, currentDir: Vector3) {
  if (currentY >= 3) {
    return Math.abs(currentDir.y) * -1;
  } else if (currentY <= -3) {
    return Math.abs(currentDir.y);
  }
  return currentDir.y;
}

function randomRgb() {
  return [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
  ];
}

function randomColor() {
  const [r, g, b] = randomRgb();
  return `rgb(${r}, ${g}, ${b})`;
}
