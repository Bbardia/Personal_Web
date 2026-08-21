import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useGLTF } from '@react-three/drei'
import { ACTS } from '../sagaData'
import { MODELS, attachToBone, useCharacter, useSword } from '../sagaAssets'
import {
  BlobShadow,
  DriftParticles,
  Ink,
  LightningBolt,
  Portal,
  REDUCED,
  RuneRing,
  softDiscTexture,
  type LightningHandle,
} from '../sagaFx'
import { useActGroup } from '../sagaHooks'

/* ─── ACT 2 · THE WIZARD — Trial of the Unseen ────────────────────────
   An open-air study on a tower summit at night. The wizard's Crystal of
   Sight floats between the duelists, and inside it his magic renders the
   knight as a constellation of joints — pose estimation as sorcery.
   Camera holds at local (-3.5, 1.2, 7.5) looking at (0, 0.8, 0): the
   knight's shoulder framing the wizard, crystal dead center. */

const SLATE = '#1a2340'
const CYAN = '#55e6ff'
const PARCHMENT = '#d9c9a3'
const SLATE_EDGE = '#5b7bd6' // arcane rim on the stone
const WOOD_EDGE = '#7a6a52'

/* pose-estimation joints of a standing figure, crystal-local */
const JOINTS: [number, number, number][] = [
  [0, 0.44, 0], // head
  [0, 0.3, 0], // neck
  [-0.15, 0.26, 0], [0.15, 0.26, 0], // shoulders
  [-0.21, 0.09, 0.03], [0.21, 0.09, 0.03], // elbows
  [-0.25, -0.07, 0.06], [0.25, -0.07, 0.06], // wrists
  [-0.08, -0.06, 0], [0.08, -0.06, 0], // hips
  [-0.1, -0.25, 0.02], [0.1, -0.25, 0.02], // knees
  [-0.11, -0.44, 0], [0.11, -0.44, 0], // ankles
]
const BONES = [
  [0, 1], [1, 2], [1, 3], [2, 4], [4, 6], [3, 5], [5, 7],
  [2, 8], [3, 9], [8, 9], [8, 10], [10, 12], [9, 11], [11, 13],
]

export default function ActWizard() {
  const { ref, prog } = useActGroup(2)
  const origin = ACTS[2].origin

  const wizard = useCharacter(MODELS.mage, 'Spellcasting')
  const knight = useCharacter(MODELS.knight, 'Idle')
  const sword = useSword()
  useMemo(() => attachToBone(knight.root, 'handslot.r', sword), [knight.root, sword])

  const tower = useGLTF(MODELS.tower)
  const towerScene = useMemo(() => tower.scene.clone(true), [tower.scene])

  // the crystal and its captured constellation
  const crystalGroup = useRef<THREE.Group>(null)
  const skeletonGroup = useRef<THREE.Group>(null)
  const crystalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#123b4d',
        emissive: CYAN,
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        flatShading: true,
      }),
    [],
  )
  const constellation = useMemo(() => {
    const jointPos = new Float32Array(JOINTS.length * 3)
    JOINTS.forEach((j, i) => jointPos.set(j, i * 3))
    const jointGeo = new THREE.BufferGeometry()
    jointGeo.setAttribute('position', new THREE.BufferAttribute(jointPos, 3))
    const jointMat = new THREE.PointsMaterial({
      map: softDiscTexture(),
      color: '#ffffff',
      size: 0.13,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(jointGeo, jointMat)
    points.renderOrder = 12

    const bonePos = new Float32Array(BONES.length * 6)
    BONES.forEach(([a, b], i) => {
      bonePos.set(JOINTS[a], i * 6)
      bonePos.set(JOINTS[b], i * 6 + 3)
    })
    const boneGeo = new THREE.BufferGeometry()
    boneGeo.setAttribute('position', new THREE.BufferAttribute(bonePos, 3))
    const boneMat = new THREE.LineBasicMaterial({
      color: '#cfeeff',
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const lines = new THREE.LineSegments(boneGeo, boneMat)
    lines.renderOrder = 12
    return { points, lines, jointMat, boneMat }
  }, [])

  // the wizard's drifting library
  const booksGroup = useRef<THREE.Group>(null)
  const books = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        r: 1.7 + (i % 3) * 0.7,
        h: 0.8 + ((i * 0.53) % 1.6),
        a0: i * 1.05,
        sp: (0.1 + (i % 2) * 0.07) * (i % 3 ? 1 : -1),
        tilt: i * 0.6,
      })),
    [],
  )

  const bolt = useRef<LightningHandle | null>(null)
  const nextStrike = useRef(0)
  const BOLT_FROM = useMemo(() => new THREE.Vector3(0, 1.9, -0.3), [])
  const BOLT_TO = useMemo(() => new THREE.Vector3(1.25, 0.5, 2.7), [])

  useFrame(({ clock }, dt) => {
    if (!ref.current?.visible) return
    const hold = prog.current.hold

    // battle beats: study → duel of sight → the knight reads → understanding
    if (hold < 0.28) {
      wizard.play('Spellcasting')
      knight.play('Idle')
    } else if (hold < 0.6) {
      wizard.play('Spellcast_Shoot')
      knight.play('Blocking')
    } else if (hold < 0.85) {
      wizard.play('Spellcast_Raise')
      knight.play('Interact')
    } else {
      wizard.play('Idle')
      knight.play('Idle')
    }

    // once the sight is shared, the constellation burns brighter
    // delta-time damp: identical settle at any refresh rate
    const seen = hold >= 0.85
    crystalMat.emissiveIntensity = THREE.MathUtils.damp(crystalMat.emissiveIntensity, seen ? 2.6 : 1.1, 3.7, dt)
    constellation.jointMat.opacity = THREE.MathUtils.damp(constellation.jointMat.opacity, seen ? 1 : 0.75, 3.7, dt)
    constellation.boneMat.opacity = THREE.MathUtils.damp(constellation.boneMat.opacity, seen ? 0.95 : 0.55, 3.7, dt)

    if (REDUCED) return
    const t = clock.elapsedTime

    // the crystal lashes at the knight's guard while the duel is on
    if (hold >= 0.28 && hold < 0.6 && t >= nextStrike.current) {
      nextStrike.current = t + 1.2
      bolt.current?.strike(BOLT_FROM, BOLT_TO, 0.3)
    }

    if (crystalGroup.current) {
      crystalGroup.current.position.y = 1.9 + Math.sin(t * 0.8) * 0.08
      crystalGroup.current.rotation.y = t * 0.25
    }
    if (skeletonGroup.current) skeletonGroup.current.rotation.y = -t * 0.4
    if (booksGroup.current) {
      for (let i = 0; i < books.length; i++) {
        const b = books[i]
        const m = booksGroup.current.children[i]
        const a = b.a0 + t * b.sp
        m.position.set(Math.cos(a) * b.r, b.h + Math.sin(t * 0.7 + b.a0) * 0.12, Math.sin(a) * b.r)
        m.rotation.set(b.tilt, a, Math.sin(t * 0.5 + b.a0) * 0.2)
      }
    }
  })

  return (
    <group ref={ref} position={origin}>
      {/* summit platform with its rune-inscribed rim */}
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[5.6, 6.4, 1.3, 10]} />
        <meshStandardMaterial color={SLATE} flatShading />
        <Ink color={SLATE_EDGE} opacity={0.3} threshold={25} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.3, 0.055, 8, 48]} />
        <meshBasicMaterial color={CYAN} />
      </mesh>

      {/* the tower itself, rising out of the fog below the summit */}
      <primitive object={towerScene} position={[0, -9.3, 0]} scale={0.7} />

      {/* the wizard, mid-study */}
      <primitive object={wizard.root} position={[-0.6, 0, -1.2]} rotation={[0, 0.45, 0]} />
      <BlobShadow position={[-0.6, 0.03, -1.2]} radius={1.0} />

      {/* the knight, come to read the magic rather than break it */}
      <primitive object={knight.root} position={[1.6, 0, 3.4]} rotation={[0, -2.7, 0]} />
      <BlobShadow position={[1.6, 0.03, 3.4]} radius={1.1} />

      {/* THE CRYSTAL OF SIGHT — his magic sees the body as light */}
      <group ref={crystalGroup} position={[0, 1.9, -0.3]}>
        <mesh material={crystalMat} renderOrder={11}>
          <icosahedronGeometry args={[0.55, 0]} />
          <Ink color={CYAN} opacity={0.5} width={1.6} />
        </mesh>
        <group ref={skeletonGroup}>
          <primitive object={constellation.points} />
          <primitive object={constellation.lines} />
        </group>
      </group>

      {/* lectern and open grimoire, its pages lit from within */}
      <group position={[0.9, 0, 1.5]} rotation={[0, 0.35, 0]}>
        <RoundedBox position={[0, 0.5, 0]} args={[0.18, 1, 0.18]} radius={0.04} smoothness={2}>
          <meshStandardMaterial color="#2a2438" flatShading />
          <Ink color={WOOD_EDGE} opacity={0.3} />
        </RoundedBox>
        <mesh position={[-0.17, 1.06, 0]} rotation={[0.25, 0, 0.32]}>
          <boxGeometry args={[0.36, 0.04, 0.46]} />
          <meshBasicMaterial color={CYAN} />
        </mesh>
        <mesh position={[0.17, 1.06, 0]} rotation={[0.25, 0, -0.32]}>
          <boxGeometry args={[0.36, 0.04, 0.46]} />
          <meshBasicMaterial color={CYAN} />
        </mesh>
      </group>

      {/* orbiting library */}
      <group ref={booksGroup}>
        {books.map((b, i) => (
          <RoundedBox
            key={i}
            position={[Math.cos(b.a0) * b.r, b.h, Math.sin(b.a0) * b.r]}
            args={[0.34, 0.07, 0.26]}
            radius={0.018}
            smoothness={2}
          >
            <meshStandardMaterial color={i === 3 ? '#8a5cf6' : PARCHMENT} flatShading />
            <Ink color={WOOD_EDGE} opacity={0.32} />
          </RoundedBox>
        ))}
      </group>

      {/* summoning window, half-open behind the wizard */}
      <Portal position={[-1.6, 2.1, -3.2]} radius={1.1} colorA="#1a0a3a" colorB="#7df6ff" rotation={[-0.15, 0.25, 0.1]} />

      <RuneRing position={[-0.6, 1.5, -1.2]} radius={1.0} color="#9a6cff" speed={1.0} size={0.3} />
      <RuneRing position={[0, 0.6, 0]} radius={4.2} count={6} color={CYAN} speed={0.22} size={0.28} />

      <LightningBolt color="#bfefff" handleRef={bolt} />

      <group position={[0, 2, 0]}>
        <DriftParticles count={110} box={[12, 6, 12]} color="#ffd9a0" speed={0.05} opacity={0.14} additive />
      </group>
    </group>
  )
}
