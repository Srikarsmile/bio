import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function BrainMesh({ riskLevel = 0 }: { riskLevel: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const intensity = Math.min(1, Math.max(0, riskLevel / 100));

    useFrame((state) => {
        if (meshRef.current) {
            // Slower, smoother rotation for "simple" feel
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
            const scale = 1 + Math.sin(state.clock.getElapsedTime() * 1.5) * (0.01 + (intensity * 0.03));
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    // Solid Apple Health Colors - No Gradients
    const color = useMemo(() => {
        if (intensity < 0.4) return "#34C759"; // Green
        if (intensity < 0.7) return "#FF9500"; // Orange
        return "#FF3B30";                      // Red
    }, [intensity]);

    return (
        <Sphere args={[1.5, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial
                color={color}
                attach="material"
                distort={0.2 + (intensity * 0.2)} // Less distortion
                speed={1.5}
                roughness={0.4} // Matte finish, not shiny
                metalness={0.1}
            />
        </Sphere>
    );
}

export default function BrainVis({ riskLevel = 0 }: { riskLevel: number }) {
    return (
        <div className="w-full h-full card overflow-hidden p-0 relative bg-black">
            <Canvas camera={{ position: [0, 0, 4] }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -5]} intensity={0.5} />

                <BrainMesh riskLevel={riskLevel} />

                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            <div className="absolute top-4 left-4 z-10">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${riskLevel > 50 ? 'bg-health-red' : 'bg-health-green'}`} />
                    <span className="text-[10px] font-medium text-white/90">
                        Neural Core
                    </span>
                </div>
            </div>
        </div>
    );
}
