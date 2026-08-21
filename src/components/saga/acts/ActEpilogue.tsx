import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACTS } from '../sagaData'
import { MODELS, attachToBone, useCharacter, useSword } from '../sagaAssets'
import { BlobShadow, Ink, MistLayer, REDUCED } from '../sagaFx'
import { useActGroup } from '../sagaHooks'

const STONE_EDGE = '#d8b878' // dawn gold on the waymarkers

/* ─── ACT 5 · EPILOGUE — The Next Quest ───────────────────────────────
   Dawn again. The knight walks toward the sunrise, helmet under his arm
   in spirit (the walk IS the ending). Camera holds at local (0, 1.6, 7.5)
   looking past him into the sun at (0, 1.4, -6). */

export default function ActEpilogue() {
  const { ref } = useActGroup(5)
  const origin = ACTS[5].origin

  const knight = useCharacter(MODELS.knight, 'Walking_A')
  const sword = useSword()
  useMemo(() => attachToBone(knight.root, 'handslot.r', sword), [knight.root, sword])

  // the sun: a big soft emissive disc on the horizon — fog does the rest
  const sunMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffe9c0',
        transparent: true,
        opacity: 1,
        fog: true, // dawn haze veils it — and the void act two doors down can't see it
      }),
    [],
  )

  useFrame(({ clock }) => {
    if (!ref.current?.visible || REDUCED) return
    // walking in place, drifting ever so slightly forward and back:
    // an endless road without the knight ever leaving frame
    knight.root.position.z = -2 - Math.sin(clock.elapsedTime * 0.18) * 0.6
  })

  return (
    <group ref={ref} position={origin}>
      {/* the open road */}
      <mesh position={[0, -0.05, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 46]} />
        <meshStandardMaterial color="#6b5643" flatShading />
      </mesh>
      <mesh position={[0, 0.01, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 46]} />
        <meshStandardMaterial color="#7d6650" flatShading />
      </mesh>

      {/* waymarker stones */}
      {[[-2.6, -4], [2.8, -9], [-3, -14], [2.4, -19]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]} rotation={[0.1 * i, i, 0]} scale={0.4 + (i % 2) * 0.2}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8a7460" flatShading />
          <Ink color={STONE_EDGE} opacity={0.32} />
        </mesh>
      ))}

      {/* the knight walks into the light */}
      <primitive object={knight.root} position={[0, 0, -2]} rotation={[0, Math.PI, 0]} />
      <BlobShadow position={[0, 0.02, -2]} radius={1.1} />

      {/* sunrise */}
      <mesh position={[0, 4, -28]} material={sunMat}>
        <circleGeometry args={[6, 48]} />
      </mesh>

      <MistLayer count={6} radius={9} y={0.2} color="#ffd9b0" opacity={0.12} scale={15} />
    </group>
  )
}
