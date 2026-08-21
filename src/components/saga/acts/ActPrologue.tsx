import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { ACTS } from '../sagaData'
import { MODELS, attachToBone, useCharacter, useSword } from '../sagaAssets'
import { BlobShadow, Ink, MistLayer, REDUCED } from '../sagaFx'
import { useActGroup } from '../sagaHooks'

/* ─── ACT 0 · PROLOGUE — The Call ─────────────────────────────────────
   A knight on a mist-wrapped cliff at first light, castle far below.
   Camera holds at local (0, 1.8, 6.5) looking at (0, 1.2, -2):
   the knight stands at (0, 0, -2) with his back to us, facing the castle. */

const ROCK = '#3a4256'
const ROCK_DARK = '#2c3346'
const EDGE = '#8a99b8' // cool steel rim, dawn-lit

export default function ActPrologue() {
  const { ref, prog } = useActGroup(0)
  const origin = ACTS[0].origin

  const knight = useCharacter(MODELS.knight, 'Idle')
  const sword = useSword()
  useMemo(() => attachToBone(knight.root, 'handslot.r', sword), [knight.root, sword])

  const castle = useGLTF(MODELS.castle)
  const castleScene = useMemo(() => castle.scene.clone(true), [castle.scene])

  // wind-waved banner
  const flagRef = useRef<THREE.Mesh>(null)
  const flagGeo = useMemo(() => new THREE.PlaneGeometry(1.5, 0.9, 12, 4), [])
  const crestTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 192
    const ctx = canvas.getContext('2d')!
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Heraldic frame
    ctx.strokeStyle = '#e8dcc0'
    ctx.globalAlpha = 0.92
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.moveTo(30, 28)
    ctx.lineTo(290, 28)
    ctx.lineTo(278, 118)
    ctx.quadraticCurveTo(232, 160, 160, 176)
    ctx.quadraticCurveTo(88, 160, 42, 118)
    ctx.closePath()
    ctx.stroke()

    // Bardia's B
    ctx.strokeStyle = '#f2c879'
    ctx.lineWidth = 12
    ctx.beginPath()
    ctx.moveTo(82, 55)
    ctx.lineTo(82, 137)
    ctx.moveTo(82, 58)
    ctx.bezierCurveTo(142, 50, 145, 91, 84, 95)
    ctx.moveTo(84, 95)
    ctx.bezierCurveTo(150, 94, 146, 139, 82, 136)
    ctx.stroke()

    // The pose-estimation constellation that makes the crest his own.
    const joints: [number, number][] = [
      [221, 55], [221, 74], [195, 84], [247, 84], [184, 111], [258, 111],
      [206, 118], [236, 118], [202, 151], [240, 151],
    ]
    const bones = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [1, 6], [1, 7], [6, 7], [6, 8], [7, 9]]
    ctx.strokeStyle = '#ff9b53'
    ctx.fillStyle = '#fff0cf'
    ctx.lineWidth = 5
    for (const [a, b] of bones) {
      ctx.beginPath()
      ctx.moveTo(...joints[a])
      ctx.lineTo(...joints[b])
      ctx.stroke()
    }
    for (const [x, y] of joints) {
      ctx.beginPath()
      ctx.arc(x, y, 5.5, 0, Math.PI * 2)
      ctx.fill()
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    return texture
  }, [])

  useEffect(() => () => crestTexture.dispose(), [crestTexture])

  const rocks = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        pos: [
          Math.cos(i * 2.4) * (4.5 + (i % 3)),
          -0.4 + (i % 2) * 0.2,
          Math.sin(i * 2.4) * (4 + (i % 2) * 2),
        ] as [number, number, number],
        scale: 0.5 + (i % 3) * 0.45,
        rot: i * 1.3,
      })),
    [],
  )

  useFrame(({ clock }) => {
    if (!ref.current?.visible || REDUCED) return
    const t = clock.elapsedTime
    // the knight breathes with the hold: subtle sway sells "alive" cheaply
    knight.root.rotation.y = Math.PI + Math.sin(t * 0.4) * 0.04
    if (flagRef.current) {
      const pos = flagGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        pos.setZ(i, Math.sin(x * 2.2 + t * 3) * 0.1 * (x + 0.75))
      }
      pos.needsUpdate = true
    }
    // dawn pulls closer as the visitor dwells (drives nothing yet — beats hook)
    void prog.current.hold
  })

  return (
    <group ref={ref} position={origin}>
      {/* cliff plateau */}
      <mesh position={[0, -2.2, 0]}>
        <cylinderGeometry args={[7.5, 5.5, 4.4, 9]} />
        <meshStandardMaterial color={ROCK} flatShading />
        <Ink color={EDGE} opacity={0.3} />
      </mesh>
      {rocks.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={[r.rot, r.rot * 0.7, 0]} scale={r.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? ROCK_DARK : ROCK} flatShading />
          <Ink color={EDGE} opacity={0.34} />
        </mesh>
      ))}

      {/* the knight, back to us, facing the valley */}
      <primitive object={knight.root} position={[0, 0, -2]} rotation={[0, Math.PI, 0]} />
      <BlobShadow position={[0, 0.02, -2]} radius={1.1} />

      {/* banner */}
      <group position={[2.6, 0, -1]}>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 3.2, 8]} />
          <meshStandardMaterial color="#4a3b2a" flatShading />
        </mesh>
        <mesh ref={flagRef} geometry={flagGeo} position={[0.78, 2.7, 0]}>
          <meshStandardMaterial color="#8f2f3b" side={THREE.DoubleSide} flatShading />
        </mesh>
        <mesh geometry={flagGeo} position={[0.78, 2.7, 0.012]} renderOrder={4}>
          <meshBasicMaterial
            map={crestTexture}
            transparent
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* the castle of the old world, far below in the mist */}
      <primitive
        object={castleScene}
        position={[-14, -3, -46]}
        scale={2.2}
        rotation={[0, 0.6, 0]}
      />

      <MistLayer count={9} radius={10} y={0.3} color="#cdd5e0" opacity={0.14} scale={16} />
    </group>
  )
}
