import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Float, Stars, useScroll, useTexture, useVideoTexture } from '@react-three/drei'
import { projects } from '../../data/projects'

const CYAN = '#00D4FF'
const VIOLET = '#8B5CF6'
const ICE = '#CFE9FF'
const SPACE = '#05060F'

/* Chapter clusters sit every 12 units along -z; the camera flies past them. */
const SPACING = 12
const FLIGHT = SPACING * 4

interface RigProps {
  reduced: boolean
  onChapterChange: (i: number) => void
  onScrollEl: (el: HTMLElement) => void
}

function CameraRig({ reduced, onChapterChange, onScrollEl }: RigProps) {
  const scroll = useScroll()
  const chapterRef = useRef(-1)

  useEffect(() => {
    onScrollEl(scroll.el)
  }, [scroll.el, onScrollEl])

  useFrame(({ camera, pointer }) => {
    const t = scroll.offset
    camera.position.z = 7 - t * FLIGHT

    const px = reduced ? 0 : pointer.x
    const py = reduced ? 0 : pointer.y
    camera.position.x += (px * 0.7 - camera.position.x) * 0.06
    camera.position.y += (-py * 0.45 - camera.position.y) * 0.06
    camera.rotation.y = -px * 0.05
    camera.rotation.x = py * 0.03

    const i = Math.round(t * (scroll.pages - 1))
    if (i !== chapterRef.current) {
      chapterRef.current = i
      onChapterChange(i)
    }
  })

  return null
}

/* 01 — floating wireframe icosahedron with orbit rings */
function Identity({ reduced }: { reduced: boolean }) {
  return (
    <group>
      <Float speed={reduced ? 0 : 1.6} rotationIntensity={0.5} floatIntensity={0.7}>
        <mesh>
          <icosahedronGeometry args={[2.1, 1]} />
          <meshStandardMaterial
            color="#0B1228"
            metalness={0.85}
            roughness={0.2}
            emissive="#0A2335"
            emissiveIntensity={0.6}
            flatShading
          />
        </mesh>
        <mesh scale={1.003}>
          <icosahedronGeometry args={[2.1, 1]} />
          <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.38} toneMapped={false} />
        </mesh>
      </Float>
      <mesh rotation={[1.35, 0, 0.4]}>
        <torusGeometry args={[3.4, 0.012, 8, 96]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh rotation={[1.1, 0.5, -0.3]}>
        <torusGeometry args={[4.1, 0.008, 8, 96]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.3} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* 02 — a slowly turning double helix (the biomedical thread) + the about video */
function Helix({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const beads = useMemo(() => {
    const arr: { pos: [number, number, number]; color: string }[] = []
    for (let i = 0; i < 26; i++) {
      const angle = i * 0.52
      const y = (i - 12.5) * 0.26
      const r = 1.15
      arr.push({
        pos: [Math.cos(angle) * r, y, Math.sin(angle) * r],
        color: i % 2 ? CYAN : VIOLET,
      })
      arr.push({
        pos: [Math.cos(angle + Math.PI) * r, y, Math.sin(angle + Math.PI) * r],
        color: i % 2 ? ICE : CYAN,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (group.current && !reduced) group.current.rotation.y += delta * 0.28
  })

  return (
    <group ref={group} position={[-2.4, 0, 0]}>
      {beads.map((bead, i) => (
        <mesh key={i} position={bead.pos}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color={bead.color} transparent opacity={0.9} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function OriginVideo({ reduced }: { reduced: boolean }) {
  const texture = useVideoTexture('/media/about.mp4')
  return (
    <Float speed={reduced ? 0 : 1.1} rotationIntensity={0.12} floatIntensity={0.45}>
      <group position={[2.7, 0, 0]} rotation={[0, -0.32, 0]}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[2.56, 3.32]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.35} toneMapped={false} />
        </mesh>
        <mesh>
          <planeGeometry args={[2.5, 3.26]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  )
}

/* 03 — tilted orbit rings with glowing topic nodes */
function TopicOrbits({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const nodes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return {
          pos: [Math.cos(angle) * 2.7, Math.sin(angle) * 0.5, Math.sin(angle) * 2.7] as [
            number,
            number,
            number,
          ],
          color: i % 3 === 0 ? CYAN : i % 3 === 1 ? VIOLET : ICE,
        }
      }),
    [],
  )

  useFrame((_, delta) => {
    if (group.current && !reduced) group.current.rotation.y += delta * 0.2
  })

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.7, 0.01, 8, 96]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 1.8, 0.6, 0]}>
        <torusGeometry args={[3.3, 0.008, 8, 96]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 3.2, -0.5, 0]}>
        <torusGeometry args={[3.9, 0.006, 8, 96]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.2} toneMapped={false} />
      </mesh>
      {nodes.map((node, i) => (
        <mesh key={i} position={node.pos}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshBasicMaterial color={node.color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/* 04 — project shots floating as glowing panels */
function WorkPanels({ reduced }: { reduced: boolean }) {
  const textures = useTexture(projects.map((p) => p.image))

  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
    })
  }, [textures])

  const slots: { x: number; y: number; ry: number }[] = [
    { x: -3.5, y: 0.3, ry: 0.32 },
    { x: 0, y: -0.1, ry: 0 },
    { x: 3.5, y: 0.35, ry: -0.32 },
  ]

  return (
    <group>
      {textures.map((texture, i) => (
        <Float key={i} speed={reduced ? 0 : 1 + i * 0.2} rotationIntensity={0.1} floatIntensity={0.4}>
          <group position={[slots[i].x, slots[i].y, 0]} rotation={[0, slots[i].ry, 0]}>
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry args={[3.08, 1.98]} />
              <meshBasicMaterial
                color={i === 0 ? CYAN : i === 1 ? VIOLET : ICE}
                transparent
                opacity={0.35}
                toneMapped={false}
              />
            </mesh>
            <mesh>
              <planeGeometry args={[3, 1.9]} />
              <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  )
}

/* 05 — a ring tunnel converging on the finale */
function FinaleTunnel({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (group.current && !reduced) group.current.rotation.z += delta * 0.12
  })
  return (
    <group ref={group}>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 0, -i * 2.1]}>
          <torusGeometry args={[2.4 + i * 0.55, 0.014, 8, 96]} />
          <meshBasicMaterial
            color={i % 2 ? VIOLET : CYAN}
            transparent
            opacity={Math.max(0.12, 0.5 - i * 0.07)}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

interface NovaSceneProps {
  onChapterChange: (i: number) => void
  onScrollEl: (el: HTMLElement) => void
}

export default function NovaScene({ onChapterChange, onScrollEl }: NovaSceneProps) {
  const reduced = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  return (
    <>
      <color attach="background" args={[SPACE]} />
      <fog attach="fog" args={[SPACE, 9, 30]} />
      <ambientLight intensity={0.35} />
      {Array.from({ length: 5 }, (_, i) => (
        <pointLight
          key={i}
          position={[i % 2 ? 3 : -3, 2, -i * SPACING + 2]}
          intensity={26}
          distance={16}
          color={i % 2 ? VIOLET : CYAN}
        />
      ))}
      <Stars radius={70} depth={70} count={2600} factor={3.2} saturation={0} fade speed={reduced ? 0 : 0.7} />

      <CameraRig reduced={reduced} onChapterChange={onChapterChange} onScrollEl={onScrollEl} />

      <Identity reduced={reduced} />
      <group position={[0, 0, -SPACING]}>
        <Helix reduced={reduced} />
        <Suspense fallback={null}>
          <OriginVideo reduced={reduced} />
        </Suspense>
      </group>
      <group position={[0, 0, -SPACING * 2]}>
        <TopicOrbits reduced={reduced} />
      </group>
      <group position={[0, 0, -SPACING * 3]}>
        <Suspense fallback={null}>
          <WorkPanels reduced={reduced} />
        </Suspense>
      </group>
      <group position={[0, 0, -SPACING * 4]}>
        <FinaleTunnel reduced={reduced} />
      </group>
    </>
  )
}
