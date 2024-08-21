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
      <Canvas>
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
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
