'use client';

import { Canvas } from '@react-three/fiber';

import LoadingBox from './loading-box';

export default function OutputPlaceholder() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
      className='bg-secondaryDg'
    >
      <Canvas camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 9] }}>
        <ambientLight intensity={Math.PI / 4} />
        <spotLight
          position={[20, 20, 20]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <LoadingBox position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
