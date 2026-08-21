import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ACTS } from '../sagaData'
import { MODELS, attachToBone, useCharacter, useSword } from '../sagaAssets'
import {
  BlobShadow,
  DriftParticles,
  Ink,
  LightningBolt,
  MistLayer,
  REDUCED,
  ShockwaveRings,
  type LightningHandle,
  type ShockwaveHandle,
} from '../sagaFx'
import { useActGroup } from '../sagaHooks'

/* ─── ACT 3 · THE DEMON KING — The Great War ──────────────────────────
   An obsidian throne hall. Braziered colonnades and war banners march
   toward a jagged black throne; the Demon King looms on his dais while
   the knight waits in the aisle, sword drawn, between us and the king.
   Camera holds at local (0, 1.4, 8.5) looking down the hall at (0, 1, 0).
   Beats: the approach → the king rises → the clash → the tide turns. */

const OBSIDIAN = '#0a0508'
const PILLAR = '#14060a'
const THRONE_EDGE = '#e0293a' // hell-light bleeding along the obsidian

const PILLAR_Z = [6, 3.5, 1, -1.5, -4]
const BURSTS = [0.55, 0.65, 0.75]
const TIP_X = [-1.15, 1.15, 0] // which throne spike the power arcs from

/* Movement-analysis figures replace the old captive silhouettes. They read
   as arcane diagrams in-world, but their joints and gait stance point back
   to the real rehabilitation work behind this chapter. */
const GAIT_JOINTS: [number, number, number][] = [
  [0, 2.42, 0], [0, 2.05, 0],
  [-0.36, 1.92, 0], [0.36, 1.92, 0],
  [-0.56, 1.48, 0], [0.55, 1.5, 0],
  [-0.62, 1.12, 0], [0.62, 1.14, 0],
  [-0.24, 1.2, 0], [0.24, 1.2, 0],
  [-0.43, 0.67, 0.04], [0.45, 0.74, -0.03],
  [-0.14, 0.12, 0.08], [0.72, 0.16, -0.08],
]
const GAIT_BONES = [
  [0, 1], [1, 2], [1, 3], [2, 4], [4, 6], [3, 5], [5, 7],
  [2, 8], [3, 9], [8, 9], [8, 10], [10, 12], [9, 11], [11, 13],
]

function GaitRelic({
  position,
  rotationY,
  mirrored = false,
}: {
  position: [number, number, number]
  rotationY: number
  mirrored?: boolean
}) {
  const relic = useMemo(() => {
    const joints = GAIT_JOINTS.map(([x, y, z]) => [mirrored ? -x : x, y, z] as const)
    const pointPositions = new Float32Array(joints.length * 3)
    joints.forEach((joint, index) => pointPositions.set(joint, index * 3))
    const pointGeometry = new THREE.BufferGeometry()
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3))
    const pointMaterial = new THREE.PointsMaterial({
      color: '#ffd09a',
      size: 0.13,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })

    const bonePositions = new Float32Array(GAIT_BONES.length * 6)
    GAIT_BONES.forEach(([a, b], index) => {
      bonePositions.set(joints[a], index * 6)
      bonePositions.set(joints[b], index * 6 + 3)
    })
    const boneGeometry = new THREE.BufferGeometry()
    boneGeometry.setAttribute('position', new THREE.BufferAttribute(bonePositions, 3))
    const boneMaterial = new THREE.LineBasicMaterial({
      color: '#ff6f47',
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    })

    const group = new THREE.Group()
    group.add(
      new THREE.LineSegments(boneGeometry, boneMaterial),
      new THREE.Points(pointGeometry, pointMaterial),
    )
    return { group, pointGeometry, pointMaterial, boneGeometry, boneMaterial }
  }, [mirrored])

  useEffect(
    () => () => {
      relic.pointGeometry.dispose()
      relic.pointMaterial.dispose()
      relic.boneGeometry.dispose()
      relic.boneMaterial.dispose()
    },
    [relic],
  )

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.25, -0.08]}>
        <planeGeometry args={[1.8, 2.9]} />
        <meshBasicMaterial color="#26070d" transparent opacity={0.28} depthWrite={false} />
      </mesh>
      <primitive object={relic.group} position={[0, 0.05, 0]} />
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.82, 0.92, 0.12, 8]} />
        <meshStandardMaterial
          color="#2a070d"
          emissive="#c8102e"
          emissiveIntensity={0.9}
          flatShading
        />
      </mesh>
    </group>
  )
}

export default function ActDemon() {
  const { ref, prog } = useActGroup(3)
  const origin = ACTS[3].origin

  const knight = useCharacter(MODELS.knight, 'Idle')
  const sword = useSword()
  useMemo(() => attachToBone(knight.root, 'handslot.r', sword), [knight.root, sword])
  const demon = useCharacter(MODELS.demon, 'Idle')

  const shock = useRef<ShockwaveHandle | null>(null)
  const bolt = useRef<LightningHandle | null>(null)
  const fired = useRef(0)

  // the whole colonnade — pillars, braziers, banners, tatters — is five
  // instanced meshes, so the hall reads long but stays cheap
  const hall = useMemo(() => {
    const m = new THREE.Matrix4()
    const std = (color: string) => new THREE.MeshStandardMaterial({ color, flatShading: true })

    const pillars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 4.4, 0.7), std(PILLAR), 10)
    let i = 0
    for (const x of [-3.3, 3.3])
      for (const z of PILLAR_Z) {
        m.identity().setPosition(x, 2.2, z)
        pillars.setMatrixAt(i++, m)
      }

    const lit: [number, number][] = []
    for (const x of [-3.3, 3.3])
      for (const z of [PILLAR_Z[0], PILLAR_Z[2], PILLAR_Z[4]]) lit.push([x, z])
    const bowls = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.42, 0.34, 7),
      std('#1c0b0e'),
      lit.length,
    )
    const flames = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.24, 0.6, 6),
      new THREE.MeshBasicMaterial({ color: '#ff7a20', fog: false }),
      lit.length,
    )
    lit.forEach(([x, z], j) => {
      m.makeRotationX(Math.PI).setPosition(x, 4.6, z) // bowl mouth up
      bowls.setMatrixAt(j, m)
      m.identity().setPosition(x, 5.05, z)
      flames.setMatrixAt(j, m)
    })

    // the standards of the war — abstract, deep red, torn at the hem
    const spans: [number, number][] = [
      [-3.3, 4.75],
      [3.3, 2.25],
      [-3.3, -0.25],
      [3.3, -2.75],
    ]
    const banners = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1.5, 2.2),
      new THREE.MeshStandardMaterial({ color: '#7a0f1d', flatShading: true, side: THREE.DoubleSide }),
      spans.length,
    )
    const tatters = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.3, 0.26, 0.06),
      std('#470a12'),
      spans.length,
    )
    spans.forEach(([x, z], j) => {
      m.makeRotationY(Math.PI / 2).setPosition(x, 2.9, z)
      banners.setMatrixAt(j, m)
      m.setPosition(x, 1.72, z)
      tatters.setMatrixAt(j, m)
    })

    return { pillars, bowls, flames, banners, tatters }
  }, [])

  const V = useMemo(
    () => ({
      shock: new THREE.Vector3(0.4, 0, 1.3),
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
    }),
    [],
  )

  useFrame(() => {
    if (REDUCED || !ref.current?.visible) return
    const hold = prog.current.hold
    const d = demon.root.position
    if (hold < 0.25) {
      // the approach
      demon.play('Idle')
      knight.play('Idle')
      d.set(0, 0.35, -2.5)
    } else if (hold < 0.5) {
      // the king rises and steps down off his dais
      demon.play('Walk')
      knight.play('Blocking')
      const k = (hold - 0.25) * 4
      d.y = THREE.MathUtils.lerp(0.35, 0.15, k)
      d.z = THREE.MathUtils.lerp(-2.5, -2.2, k)
    } else {
      d.set(0, 0.15, -2.2)
      if (hold < 0.8) {
        // the clash
        demon.play('Attack')
        knight.play('1H_Melee_Attack_Chop')
      } else {
        // the tide turns — the knight presses on
        demon.play('HitRecieve')
        knight.play('1H_Melee_Attack_Stab')
      }
    }
    // each burst fires once as the dwell crosses it
    if (hold < BURSTS[0]) fired.current = 0
    for (let i = 0; i < BURSTS.length; i++) {
      if (hold >= BURSTS[i] && fired.current === i) {
        fired.current = i + 1
        shock.current?.fire(V.shock)
        V.from.set(TIP_X[i], 4.9, -4.8)
        V.to.set(0.3, 2.6, d.z)
        bolt.current?.strike(V.from, V.to)
      }
    }
  })

  return (
    <group ref={ref} position={origin}>
      {/* hall floor and its ember-lit runner */}
      <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 28]} />
        <meshStandardMaterial color="#0d0508" flatShading />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[1.4, 0.05, 22]} />
        <meshStandardMaterial color="#2a0308" emissive="#c8102e" emissiveIntensity={0.55} flatShading />
      </mesh>

      <primitive object={hall.pillars} />
      <primitive object={hall.bowls} />
      <primitive object={hall.flames} />
      <primitive object={hall.banners} />
      <primitive object={hall.tatters} />

      {/* dais and the jagged obsidian throne */}
      <mesh position={[0, 0.175, -3.6]}>
        <boxGeometry args={[4.6, 0.35, 3.4]} />
        <meshStandardMaterial color={OBSIDIAN} flatShading />
        <Ink color={THRONE_EDGE} opacity={0.3} />
      </mesh>
      <mesh position={[0, 3, -4.8]} rotation={[0.06, 0.4, 0]}>
        <coneGeometry args={[0.95, 5.6, 5]} />
        <meshStandardMaterial color={OBSIDIAN} flatShading />
        <Ink color={THRONE_EDGE} opacity={0.32} />
      </mesh>
      <mesh position={[-1.15, 2, -4.5]} rotation={[0, 0.9, -0.22]}>
        <coneGeometry args={[0.55, 3.2, 5]} />
        <meshStandardMaterial color={OBSIDIAN} flatShading />
        <Ink color={THRONE_EDGE} opacity={0.32} />
      </mesh>
      <mesh position={[1.15, 1.8, -4.5]} rotation={[0, -0.6, 0.24]}>
        <coneGeometry args={[0.5, 2.9, 5]} />
        <meshStandardMaterial color={OBSIDIAN} flatShading />
        <Ink color={THRONE_EDGE} opacity={0.32} />
      </mesh>
      <mesh position={[0, 0.9, -4.2]}>
        <boxGeometry args={[2.3, 1.1, 1.1]} />
        <meshStandardMaterial color={OBSIDIAN} flatShading />
        <Ink color={THRONE_EDGE} opacity={0.34} />
      </mesh>
      {/* hell-red seam up the throne's spine */}
      <mesh position={[0, 2.4, -4.1]}>
        <boxGeometry args={[0.12, 3.6, 0.1]} />
        <meshStandardMaterial color="#2a0308" emissive="#c8102e" emissiveIntensity={1.6} flatShading />
      </mesh>

      {/* the Demon King, looming before his throne */}
      <primitive object={demon.root} position={[0, 0.35, -2.5]} rotation={[0, 0.17, 0]} scale={2.5} />
      <BlobShadow position={[0, 0.37, -2.4]} radius={1.9} opacity={0.5} />

      {/* the knight, sword drawn, holding the aisle */}
      <primitive object={knight.root} position={[2.0, 0, 4.4]} rotation={[0, Math.PI + 0.4, 0]} />
      <BlobShadow position={[2.0, 0.02, 4.4]} radius={1.1} />

      {/* gait-analysis relics: movement becomes the counter-spell */}
      <GaitRelic position={[-4.4, 0, 1.8]} rotationY={0.5} />
      <GaitRelic position={[4.4, 0, -0.4]} rotationY={-0.4} mirrored />

      <ShockwaveRings color="#ff2e2e" maxRadius={3.5} handleRef={shock} />
      <LightningBolt color="#ff8c6a" handleRef={bolt} />
      <group position={[0, 3.2, 1]}>
        <DriftParticles
          count={160}
          box={[13, 9, 24]}
          color="#ff5c1a"
          accent="#ffb347"
          speed={0.5}
          size={34}
          opacity={0.5}
        />
      </group>
      <MistLayer count={4} radius={6.5} y={0.16} color="#2a070d" opacity={0.2} scale={12} />
    </group>
  )
}
