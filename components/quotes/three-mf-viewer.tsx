"use client"

import { Suspense, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { Bounds, OrbitControls } from "@react-three/drei"
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js"
import * as THREE from "three"

// Renderiza a malha real do .3mf (não é só o thumbnail do fatiador) direto
// do buffer que já está em memória no navegador — não precisa subir o
// arquivo pra lugar nenhum. Só funciona no cliente (WebGL).
function Model({ buffer }: { buffer: ArrayBuffer }) {
  const group = useMemo(() => {
    const loader = new ThreeMFLoader()
    const parsed = loader.parse(buffer)
    parsed.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.material) {
        child.material = new THREE.MeshStandardMaterial({ color: "#9aa0c9" })
      }
    })
    return parsed
  }, [buffer])

  return <primitive object={group} />
}

export function ThreeMfViewer({ buffer }: { buffer: ArrayBuffer }) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border bg-muted/30">
      <Canvas camera={{ position: [1, 1, 1], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={1.2} />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.3}>
            <Model buffer={buffer} />
          </Bounds>
        </Suspense>
        <OrbitControls makeDefault enableDamping />
      </Canvas>
    </div>
  )
}
