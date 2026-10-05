"use client"

import { Suspense, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stage } from "@react-three/drei"
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js"
import * as THREE from "three"
import { Box } from "@chakra-ui/react"

// Renderiza a malha real do .3mf (não é só o thumbnail do fatiador) direto
// do buffer que já está em memória no navegador — não precisa subir o
// arquivo pra lugar nenhum. Só funciona no cliente (WebGL).
function Model({ buffer }: { buffer: ArrayBuffer }) {
  const group = useMemo(() => {
    const loader = new ThreeMFLoader()
    const parsed = loader.parse(buffer)
    // O .3mf normalmente não traz material/cor útil pro preview — força um
    // material padrão que reage à luz (senão fica escuro/invisível sob a
    // iluminação fisicamente correta do three.js recente).
    parsed.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: "#c7cbe8",
          roughness: 0.45,
          metalness: 0.1,
        })
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return parsed
  }, [buffer])

  return <primitive object={group} />
}

export function ThreeMfViewer({ buffer }: { buffer: ArrayBuffer }) {
  return (
    <Box
      h="72"
      w="full"
      overflow="hidden"
      rounded="lg"
      borderWidth="1px"
      bg="color-mix(in srgb, var(--muted) 30%, transparent)"
    >
      <Canvas shadows camera={{ position: [3, 3, 3], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage adjustCamera intensity={0.6} environment="city" shadows="contact">
            <Model buffer={buffer} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault enableDamping />
      </Canvas>
    </Box>
  )
}
