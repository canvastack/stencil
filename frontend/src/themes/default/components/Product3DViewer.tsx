import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';
import { APP_CONFIG } from '@/lib/constants';
import type { Product3DViewerProps } from '@/core/engine/interfaces';

// 3D Model component - represents an etched plaque with product image as main texture
function EtchedPlaque({ imageUrl }: { imageUrl?: string }) {
  // Load texture from image URL
  const texture = imageUrl ? useLoader(THREE.TextureLoader, imageUrl) : null;
  
  return (
    <group>
      {/* Main product image surface - the star of the show */}
      <mesh castShadow receiveShadow>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial 
          map={texture}
          color={texture ? "#ffffff" : "#cccccc"}
          metalness={0.1}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Elegant frame border - top */}
      <mesh position={[0, 1.05, -0.02]}>
        <boxGeometry args={[3.2, 0.1, 0.05]} />
        <meshStandardMaterial 
          color="#d4af37"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Frame border - bottom */}
      <mesh position={[0, -1.05, -0.02]}>
        <boxGeometry args={[3.2, 0.1, 0.05]} />
        <meshStandardMaterial 
          color="#d4af37"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Frame border - left */}
      <mesh position={[-1.55, 0, -0.02]}>
        <boxGeometry args={[0.1, 2.2, 0.05]} />
        <meshStandardMaterial 
          color="#d4af37"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Frame border - right */}
      <mesh position={[1.55, 0, -0.02]}>
        <boxGeometry args={[0.1, 2.2, 0.05]} />
        <meshStandardMaterial 
          color="#d4af37"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Backing plate for depth */}
      <mesh position={[0, 0, -0.08]} receiveShadow>
        <boxGeometry args={[3.2, 2.2, 0.1]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      
      {/* Stand base */}
      <mesh position={[0, -1.4, -0.3]} rotation={[0, 0, 0]}>
        <boxGeometry args={[3.4, 0.2, 0.6]} />
        <meshStandardMaterial 
          color="#1a1a1a"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

// Loading fallback
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#888" wireframe />
    </mesh>
  );
}

const Product3DViewer: React.FC<Product3DViewerProps> = ({ 
  className, 
  modelUrl, 
  fallbackImage 
}) => {
  return (
    <div className={`w-full h-[${APP_CONFIG.VIEWER_HEIGHT}px] rounded-lg overflow-hidden bg-gradient-to-b from-background to-muted ${className || ''}`}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <spotLight 
          position={[-10, 10, -5]} 
          intensity={0.5} 
          angle={0.3} 
          penumbra={1}
          castShadow
        />
        
        {/* 3D Model */}
        <Suspense fallback={<Loader />}>
          <EtchedPlaque imageUrl={modelUrl || fallbackImage} />
          
          {/* Environment for reflections */}
          <Environment preset="studio" />
          
          {/* Ground shadow */}
          <ContactShadows 
            position={[0, -1.7, 0]} 
            opacity={0.5} 
            scale={10} 
            blur={2} 
            far={4}
          />
        </Suspense>
        
        {/* Interactive controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={APP_CONFIG.MIN_DISTANCE}
          maxDistance={APP_CONFIG.MAX_DISTANCE}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={APP_CONFIG.AUTO_ROTATE_SPEED}
        />
      </Canvas>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs text-muted-foreground">
        Drag untuk rotasi • Scroll untuk zoom • Auto rotate aktif
      </div>
    </div>
  );
}

export default Product3DViewer;