import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACTS } from '../sagaData'
import { MODELS, attachToBone, useCharacter, useSword } from '../sagaAssets'
import {
  BlobShadow,
  DriftParticles,
  FireCone,
  Ink,
  MistLayer,
  REDUCED,
  type FireHandle,
} from '../sagaFx'
import { useActGroup } from '../sagaHooks'

/* ─── ACT 1 · THE DRAGON — Trial of Iron & Fire ───────────────────────
   A volcanic lair. The dragon looms over a hoard of gears — not gold —
   with a lava pool seething beside the knight. Camera holds at local
   (2.8, 1.8, 7.5) looking at (0, 1.4, -0.5): over the knight's shoulder,
   up into the beast. Beats: standoff → the breath → the answer → the wound. */

const BASALT = '#1c1210'
const BASALT_LIT = '#2b1a12'
const IRON = '#565b63'
const IRON_DARK = '#3a3d42'
const BRASS = '#b08d57'
const ROCK_EDGE = '#ff7a3a' // ember licking the basalt
const METAL_EDGE = '#e8b878' // firelight caught on the hoard

export default function ActDragon() {
  const { ref, prog } = useActGroup(1)
  const origin = ACTS[1].origin

  const knight = useCharacter(MODELS.knight, 'Idle')
  const sword = useSword()
  useMemo(() => attachToBone(knight.root, 'handslot.r', sword), [knight.root, sword])

  const dragon = useCharacter(MODELS.dragon, 'Flying_Idle')
  const fire = useRef<FireHandle | null>(null)

  const columns = useMemo(
    () =>
      (
        [
          [-6.5, -5.5, 7.5, 0.9],
          [6, -4, 6.2, 0.7],
          [-7.5, 0.5, 8.2, 1.0],
          [7.2, 1.8, 5.6, 0.65],
          [-5, 5.5, 6.6, 0.8],
        ] as [number, number, number, number][]
      ).map(([x, z, h, r], i) => ({
        pos: [x, h / 2 - 0.2, z] as [number, number, number],
        h,
        r,
        tilt: (i % 2 ? 1 : -1) * 0.05,
      })),
    [],
  )

  const gears = useMemo(
    () => [
      { kind: 'disc', args: [0.7, 0.7, 0.18, 8] as const, pos: [1.2, 0.35, -2.5], rot: [0.9, 0.4, 0.3], color: IRON },
      { kind: 'disc', args: [0.5, 0.5, 0.14, 8] as const, pos: [-1.9, 0.3, -2.8], rot: [1.2, -0.5, 0.2], color: BRASS },
      { kind: 'disc', args: [0.9, 0.9, 0.2, 8] as const, pos: [-0.9, 0.25, -4.4], rot: [1.35, 0.2, 0], color: IRON_DARK },
      { kind: 'ring', args: [0.55, 0.16, 6, 10] as const, pos: [0.3, 1.05, -3.4], rot: [1.1, 0, 0.4], color: BRASS },
    ],
    [],
  )

  useFrame(({ clock }) => {
    if (!ref.current?.visible) return
    const h = prog.current.hold
    // standoff → the breath → the answer → the wound
    if (h < 0.3) {
      dragon.play('Flying_Idle')
      knight.play('Idle')
    } else if (h < 0.62) {
      dragon.play('Flying_Idle')
      knight.play('Blocking')
    } else if (h < 0.85) {
      dragon.play('Flying_Idle')
      knight.play('1H_Melee_Attack_Slice_Horizontal', { once: true })
    } else {
      dragon.play('HitReact', { once: true })
      knight.play('Idle')
    }
    fire.current?.setIntensity(
      h >= 0.3 && h < 0.62 ? THREE.MathUtils.smoothstep(h, 0.3, 0.44) : 0,
    )
    if (REDUCED) return
    // the hover: a beast too heavy for the air it commands
    dragon.root.position.y = 1.2 + Math.sin(clock.elapsedTime * 0.8) * 0.18
  })

  return (
    <group ref={ref} position={origin}>
      {/* cave floor */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[10.5, 11.5, 0.5, 10]} />
        <meshStandardMaterial color="#221410" flatShading />
      </mesh>

      {/* basalt columns ringing the lair */}
      {columns.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={[c.tilt, i * 1.1, c.tilt]}>
          <cylinderGeometry args={[c.r, c.r * 1.3, c.h, 6]} />
          <meshStandardMaterial color={i % 2 ? BASALT_LIT : BASALT} flatShading />
          <Ink color={ROCK_EDGE} opacity={0.28} threshold={25} />
        </mesh>
      ))}

      {/* ragged ceiling, hinted */}
      {[[-2.5, 6.8, -3], [2.2, 7.2, -4.5], [-0.6, 7, 1.5]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI, i, 0]} scale={0.8 + (i % 2) * 0.4}>
          <coneGeometry args={[0.8, 2.6, 6]} />
          <meshStandardMaterial color={BASALT} flatShading />
          <Ink color={ROCK_EDGE} opacity={0.22} threshold={25} />
        </mesh>
      ))}

      {/* the hoard: gears, not gold */}
      <mesh position={[-0.3, -0.1, -3.6]} scale={[3, 1.1, 2.6]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={IRON_DARK} flatShading metalness={0.5} roughness={0.5} />
        <Ink color={METAL_EDGE} opacity={0.3} />
      </mesh>
      {gears.map((g, i) => (
        <mesh
          key={i}
          position={g.pos as [number, number, number]}
          rotation={g.rot as [number, number, number]}
        >
          {g.kind === 'disc' ? (
            <cylinderGeometry args={g.args as unknown as [number, number, number, number]} />
          ) : (
            <torusGeometry args={g.args as unknown as [number, number, number, number]} />
          )}
          <meshStandardMaterial color={g.color} flatShading metalness={0.6} roughness={0.4} />
          <Ink color={METAL_EDGE} opacity={0.42} threshold={20} />
        </mesh>
      ))}

      {/* lava pool by the key light, with cracks bleeding out of it */}
      <mesh position={[-1.8, 0.03, 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.9, 24]} />
        <meshStandardMaterial color="#2a0d05" emissive="#ff4d00" emissiveIntensity={1.8} flatShading />
      </mesh>
      <mesh position={[0.4, 0.03, 4.4]} rotation={[0, 0.55, 0]}>
        <boxGeometry args={[0.16, 0.06, 3]} />
        <meshStandardMaterial color="#1a0a05" emissive="#ff5a1f" emissiveIntensity={2} flatShading />
      </mesh>
      <mesh position={[-2.9, 0.03, 1.2]} rotation={[0, -0.8, 0]}>
        <boxGeometry args={[0.12, 0.06, 2.2]} />
        <meshStandardMaterial color="#1a0a05" emissive="#ff5a1f" emissiveIntensity={2} flatShading />
      </mesh>

      {/* the dragon, hovering over its hoard, facing the knight */}
      <primitive object={dragon.root} position={[0, 1.7, -3.2]} rotation={[0, 0.3, 0]} scale={2.3} />
      <BlobShadow position={[0, 0.03, -3.2]} radius={2.4} opacity={0.5} />

      {/* the knight, sword drawn, between us and the beast */}
      <primitive object={knight.root} position={[1.4, 0, 3]} rotation={[0, Math.PI + 0.3, 0]} />
      <BlobShadow position={[1.4, 0.02, 3]} radius={1.1} />

      {/* fire breath, aimed down at the knight — beats gate its intensity */}
      <FireCone
        handleRef={fire}
        position={[0.6, 3.1, -0.5]}
        direction={[0.35, -0.25, 0.85]}
        length={5.5}
        count={380}
        lift={0.3}
      />

      {/* embers rising off the lava */}
      <group position={[-1.8, 1.6, 3.2]}>
        <DriftParticles
          count={110}
          box={[4.5, 3.2, 4.5]}
          color="#ffb347"
          accent="#ff5a1f"
          speed={-0.35}
          sway={0.25}
          size={34}
          opacity={0.55}
          additive
        />
      </group>

      <MistLayer count={5} radius={8} y={0.2} color="#2a140b" opacity={0.1} scale={13} />
    </group>
  )
}
