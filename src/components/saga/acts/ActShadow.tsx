import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACTS } from '../sagaData'
import { MODELS, attachToBone, useCharacter, useSword } from '../sagaAssets'
import {
  BlobShadow,
  DriftParticles,
  Ink,
  LightningBolt,
  Portal,
  REDUCED,
  type LightningHandle,
} from '../sagaFx'
import { useActGroup } from '../sagaHooks'

/* ─── ACT 4 · THE SHADOW — The Last Duel ──────────────────────────────
   An island of black glass adrift in the void. The knight faces himself:
   a second knight of smoked glass, same sword, same guard. Beneath the
   surface a murky mirror world; behind the shadow, the portal it came
   through. Camera holds at local (0, 1.6, 8) looking at (0, 1.2, 0) —
   the duel framed over the hero's shoulder. */

const GLASS = '#05050a'
const SHARD = '#0a0a16'
const EDGE = '#241a3a'
const GLASS_EDGE = '#9a86e0' // spectral violet catching every fracture

const HERO_POS: [number, number, number] = [1.5, 0, 1.2]
const FOE_POS: [number, number, number] = [-1.5, 0, -1.2]

const SHARDS: { pos: [number, number, number]; rot: [number, number, number]; s: number }[] = [
  { pos: [4.6, 1.4, -1.5], rot: [0.4, 0.7, 0.3], s: 1.0 },
  { pos: [-4.8, 2.4, -3.0], rot: [0.9, 0.2, -0.4], s: 1.2 },
  { pos: [3.4, 3.1, -4.6], rot: [0.2, 1.4, 0.5], s: 0.8 },
  { pos: [-3.9, 0.9, 2.6], rot: [0.6, 2.1, -0.2], s: 0.7 },
  { pos: [5.5, 2.2, -5.5], rot: [1.1, 0.5, 0.2], s: 1.1 },
]

export default function ActShadow() {
  const { ref, prog } = useActGroup(4)
  const origin = ACTS[4].origin

  const hero = useCharacter(MODELS.knight, 'Idle')
  const heroSword = useSword()
  useMemo(() => attachToBone(hero.root, 'handslot.r', heroSword), [hero.root, heroSword])

  const shadow = useCharacter(MODELS.knight, 'Idle')
  const shadowSword = useSword()
  // the shadow is the hero recast in smoked glass — one material for all of it
  // (standard, not basic: the cold key light has to carve it out of the void)
  const shadowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#181030',
        emissive: '#6152b0',
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.78,
        flatShading: true,
      }),
    [],
  )
  useMemo(() => {
    attachToBone(shadow.root, 'handslot.r', shadowSword)
    shadow.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = shadowMat
    })
  }, [shadow.root, shadowSword, shadowMat])

  const glassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SHARD, flatShading: true }),
    [],
  )
  const edgeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: EDGE }), [])
  const hintMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#0a0614',
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    [],
  )

  const boltRef = useRef<LightningHandle | null>(null)
  const shardsRef = useRef<THREE.Group>(null)
  const prevHold = useRef(0)
  const vA = useMemo(() => new THREE.Vector3(), [])
  const vB = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    if (!ref.current?.visible) return
    const h = prog.current.hold
    const ph = prevHold.current
    prevHold.current = h

    // the duel, told in scroll: recognition → clash → the lowered blade → dissolve
    if (h < 0.25) {
      hero.play('Idle')
      shadow.play('Idle')
    } else if (h < 0.5) {
      hero.play('1H_Melee_Attack_Slice_Diagonal')
      shadow.play('1H_Melee_Attack_Slice_Diagonal') // it knows his guard
      if ((ph < 0.3) !== (h < 0.3) || (ph < 0.4) !== (h < 0.4)) {
        heroSword.getWorldPosition(vA)
        shadowSword.getWorldPosition(vB)
        ref.current.worldToLocal(vA)
        ref.current.worldToLocal(vB)
        boltRef.current?.strike(vA, vB)
      }
    } else if (h < 0.75) {
      hero.play('Idle') // he lowers the blade
      shadow.play('1H_Melee_Attack_Chop')
    }

    // doubt outgrown: the shadow thins and sinks
    const d = THREE.MathUtils.clamp((h - 0.75) / 0.25, 0, 1)
    shadowMat.opacity = REDUCED ? (d > 0 ? 0.2 : 0.78) : 0.78 * (1 - d)
    shadow.root.position.y = -0.4 * d

    if (REDUCED || !shardsRef.current) return
    const t = clock.elapsedTime
    const kids = shardsRef.current.children
    for (let i = 0; i < kids.length; i++) {
      kids[i].position.y = SHARDS[i].pos[1] + Math.sin(t * 0.5 + i * 1.9) * 0.16
      kids[i].rotation.y += 0.0012 * (i % 2 ? 1 : -1)
    }
  })

  return (
    <group ref={ref} position={origin}>
      {/* black-glass island */}
      <mesh position={[0, -2.1, 0]}>
        <cylinderGeometry args={[7, 6, 0.5, 10]} />
        <meshStandardMaterial color={GLASS} flatShading />
        <Ink color={GLASS_EDGE} opacity={0.28} threshold={25} />
      </mesh>

      {/* murky mirror hints beneath the surface — the floor reads as black water */}
      {[HERO_POS, FOE_POS].map(([x, , z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, -0.95, 0]} material={hintMat} renderOrder={7}>
            <capsuleGeometry args={[0.32, 0.75, 4, 8]} />
          </mesh>
          <mesh position={[0, -1.55, 0]} material={hintMat} renderOrder={7}>
            <sphereGeometry args={[0.24, 12, 8]} />
          </mesh>
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <circleGeometry args={[7, 32]} />
        <meshBasicMaterial color="#060512" transparent opacity={0.8} depthWrite={false} />
      </mesh>

      {/* the hero, blade drawn against his own reflection */}
      <primitive object={hero.root} position={HERO_POS} rotation={[0, -2.25, 0]} />
      <BlobShadow position={[1.5, 0.03, 1.2]} radius={1.1} />

      {/* the shadow knight */}
      <primitive object={shadow.root} position={FOE_POS} rotation={[0, 0.9, 0]} />
      <BlobShadow position={[-1.5, 0.03, -1.2]} radius={1.1} />

      {/* floating glass shards, each with a violet seam of light */}
      <group ref={shardsRef}>
        {SHARDS.map((sh, i) => (
          <group key={i} position={sh.pos} rotation={sh.rot} scale={sh.s}>
            <mesh material={glassMat}>
              <boxGeometry args={[0.8, 1.7, 0.14]} />
              <Ink color={GLASS_EDGE} opacity={0.45} />
            </mesh>
            <mesh material={edgeMat}>
              <boxGeometry args={[0.5, 1.82, 0.07]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* the broken diamond monolith it stepped out of */}
      <group position={[-3.8, 0, -4.6]}>
        <mesh position={[0, 1.5, 0]} scale={[0.9, 1.6, 0.9]} material={glassMat}>
          <octahedronGeometry args={[1, 0]} />
          <Ink color={GLASS_EDGE} opacity={0.42} />
        </mesh>
        <mesh position={[0.4, 3.3, 0.1]} scale={[0.5, 0.8, 0.5]} rotation={[0.3, 0.4, 0.6]} material={glassMat}>
          <octahedronGeometry args={[1, 0]} />
          <Ink color={GLASS_EDGE} opacity={0.42} />
        </mesh>
      </group>

      {/* the door it came from */}
      <Portal
        position={[-1.8, 3.6, -5]}
        radius={2.6}
        colorA="#0a0614"
        colorB="#6a4dcf"
        rotation={[-Math.PI / 2 + 0.7, 0, 0]}
      />

      {/* rising violet motes */}
      <group position={[0, 1.5, -1]}>
        <DriftParticles
          count={140}
          box={[15, 8, 15]}
          color="#b9a8ff"
          speed={-0.1}
          opacity={0.16}
          additive
          size={34}
        />
      </group>

      <LightningBolt color="#b9a8ff" handleRef={boltRef} />
    </group>
  )
}
