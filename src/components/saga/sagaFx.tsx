import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { prefersReducedMotion } from './sagaAssets'

/* ─── SAGA · shared FX primitives ─────────────────────────────────────
   One soft-disc shader family drives every particle effect (one draw call
   each, all motion in the vertex shader — the CPU only bumps uTime).
   Under prefers-reduced-motion, time freezes (a still painting) and the
   overtly kinetic effects (fire, lightning, portal) hide themselves. */

export const REDUCED = prefersReducedMotion()

let discTex: THREE.CanvasTexture | null = null
/** shared 128px radial-gradient sprite (mist, blobs, soft particles) */
export function softDiscTexture(): THREE.CanvasTexture {
  if (discTex) return discTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  discTex = new THREE.CanvasTexture(c)
  return discTex
}

const seededGeometry = (count: number, spread: [number, number, number]) => {
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread[0]
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2]
    seed[i] = Math.random()
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...spread) * 2)
  return geo
}

const SOFT_DISC_FRAG = `
  uniform vec3 uColor; uniform vec3 uAccent; uniform float uOpacity;
  varying float vSeed; varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.08, d);
    vec3 col = mix(uColor, uAccent, step(0.82, vSeed));
    gl_FragColor = vec4(col, disc * uOpacity * vFade);
  }`

export interface DriftHandle {
  material: THREE.ShaderMaterial
  points: THREE.Points
}

/**
 * Endless drifting particles in a box (embers, ash, dust motes, snow).
 * speed > 0 falls, < 0 rises; ~18% of particles take the accent color.
 * Retint live via handle.material.uniforms (uColor/uAccent/uSpeed/uOpacity).
 */
export function DriftParticles({
  count = 200, box = [20, 12, 20], color = '#ffffff', accent, speed = 0.3,
  sway = 0.4, size = 42, opacity = 0.5, additive = true, handleRef,
}: {
  count?: number
  box?: [number, number, number]
  color?: string
  accent?: string
  speed?: number
  sway?: number
  size?: number
  opacity?: number
  additive?: boolean
  handleRef?: React.MutableRefObject<DriftHandle | null>
}) {
  const dpr = useThree((s) => s.viewport.dpr)
  const points = useMemo(() => {
    const geo = seededGeometry(count, box)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uSway: { value: sway },
        uSize: { value: size },
        uDpr: { value: dpr },
        uBoxY: { value: box[1] },
        uColor: { value: new THREE.Color(color) },
        uAccent: { value: new THREE.Color(accent ?? color) },
        uOpacity: { value: opacity },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime, uSpeed, uSway, uSize, uDpr, uBoxY;
        varying float vSeed; varying float vFade;
        void main() {
          vSeed = aSeed;
          vec3 p = position;
          p.y = mod(position.y - uTime * uSpeed, uBoxY) - uBoxY * 0.5;
          p.x += sin(uTime * 0.5 + aSeed * 6.2832) * uSway;
          p.z += cos(uTime * 0.4 + aSeed * 6.2832) * uSway;
          float edge = 1.0 - abs(p.y) / (uBoxY * 0.5);
          vFade = smoothstep(0.0, 0.25, edge);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * uDpr * (0.5 + aSeed * 0.9) / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: SOFT_DISC_FRAG,
    })
    const pts = new THREE.Points(geo, mat)
    pts.frustumCulled = false
    return pts
  }, [count, box, color, accent, speed, sway, size, opacity, additive, dpr])

  useEffect(() => {
    if (handleRef) handleRef.current = { material: points.material as THREE.ShaderMaterial, points }
  }, [points, handleRef])

  useFrame(({ clock }) => {
    if (!REDUCED) {
      ;(points.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime
    }
  })

  return <primitive object={points} />
}

export interface FireHandle {
  /** 0..1 — gates alpha and flow; drive from a battle beat each frame */
  setIntensity: (v: number) => void
}

/** Fire-breath cone (also works as a magic torrent — recolor it). */
export function FireCone({
  position = [0, 0, 0], direction = [0, -0.3, 1], length = 8, count = 450,
  size = 62, coreColor = '#fff2ac', tailColor = '#e6330d', lift = 1.2, handleRef,
}: {
  position?: [number, number, number]
  direction?: [number, number, number]
  length?: number
  count?: number
  size?: number
  coreColor?: string
  tailColor?: string
  lift?: number
  handleRef?: React.MutableRefObject<FireHandle | null>
}) {
  const dpr = useThree((s) => s.viewport.dpr)
  const points = useMemo(() => {
    const dir = new THREE.Vector3(...direction).normalize()
    const pos = new Float32Array(count * 3) // all at origin
    const seed = new Float32Array(count)
    const dirs = new Float32Array(count * 3)
    const spread = 0.28
    const tmp = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random()
      tmp.copy(dir)
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
        ))
        .normalize()
      dirs[i * 3] = tmp.x
      dirs[i * 3 + 1] = tmp.y
      dirs[i * 3 + 2] = tmp.z
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geo.setAttribute('aDir', new THREE.BufferAttribute(dirs, 3))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), length * 2)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uInt: { value: 0 },
        uLen: { value: length },
        uLift: { value: lift },
        uSize: { value: size },
        uDpr: { value: dpr },
        uCore: { value: new THREE.Color(coreColor) },
        uTail: { value: new THREE.Color(tailColor) },
      },
      vertexShader: `
        attribute float aSeed; attribute vec3 aDir;
        uniform float uTime, uLen, uLift, uSize, uDpr;
        varying float vLife;
        void main() {
          float life = fract(uTime * 1.4 + aSeed);
          vLife = life;
          vec3 p = position + aDir * life * uLen;
          p.y += life * life * uLift;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * uDpr * (0.4 + life) * (1.0 - life) / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uCore; uniform vec3 uTail; uniform float uInt;
        varying float vLife;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float disc = smoothstep(0.5, 0.05, d);
          vec3 col = mix(uCore, uTail, vLife);
          gl_FragColor = vec4(col, disc * (1.0 - vLife) * uInt);
        }`,
    })
    const pts = new THREE.Points(geo, mat)
    pts.frustumCulled = false
    return pts
  }, [count, direction, length, lift, size, coreColor, tailColor, dpr])

  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        setIntensity: (v) => {
          ;(points.material as THREE.ShaderMaterial).uniforms.uInt.value = REDUCED ? 0 : v
        },
      }
    }
  }, [points, handleRef])

  useFrame(({ clock }) => {
    if (!REDUCED) {
      ;(points.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime
    }
  })

  return <primitive object={points} position={position} />
}

/** Flat drifting ground-mist quads (normal blending — mist dims, not glows). */
export function MistLayer({
  count = 8, radius = 9, y = 0.25, color = '#cdd5e0', opacity = 0.16, scale = 14,
}: {
  count?: number
  radius?: number
  y?: number
  color?: string
  opacity?: number
  scale?: number
}) {
  const group = useRef<THREE.Group>(null)
  const quads = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: softDiscTexture(),
      transparent: true,
      depthWrite: false,
      opacity,
      color,
      fog: false,
    })
    return Array.from({ length: count }, (_, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale), mat)
      m.rotation.x = -Math.PI / 2
      m.rotation.z = Math.random() * Math.PI * 2
      m.position.set(
        (Math.random() - 0.5) * radius * 2,
        y + i * 0.07,
        (Math.random() - 0.5) * radius * 2,
      )
      m.renderOrder = 10
      return m
    })
  }, [count, radius, y, color, opacity, scale])

  useFrame(({ clock }) => {
    if (REDUCED || !group.current) return
    const t = clock.elapsedTime
    group.current.children.forEach((m, i) => {
      m.position.x += Math.sin(t * 0.08 + i * 1.7) * 0.004
      m.rotation.z += 0.0004 * (i % 2 ? 1 : -1)
    })
  })

  return (
    <group ref={group}>
      {quads.map((q, i) => (
        <primitive key={i} object={q} />
      ))}
    </group>
  )
}

/**
 * Inked facet edges — drop inside any <mesh> to crisp its silhouette and
 * catch every hard corner (the "points and edges" that read as detail on
 * flat-shaded low-poly). Reads the parent geometry automatically; threshold
 * keeps it to real creases, not the tessellation seams of round shapes.
 * Keep it subtle — a bright, thick line reads as a wireframe toy.
 */
export function Ink({
  color = '#0a0a12',
  opacity = 0.4,
  width = 1.4,
  threshold = 18,
}: {
  color?: string
  opacity?: number
  width?: number
  threshold?: number
}) {
  return (
    <Edges
      threshold={threshold}
      color={color}
      lineWidth={width}
      transparent
      opacity={opacity}
      depthWrite={false}
      toneMapped={false}
    />
  )
}

/** Fake contact shadow — dark radial blob under a character. */
export function BlobShadow({
  position = [0, 0.02, 0], radius = 1.2, opacity = 0.45,
}: {
  position?: [number, number, number]
  radius?: number
  opacity?: number
}) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: softDiscTexture(),
        transparent: true,
        depthWrite: false,
        color: '#000000',
        opacity,
        fog: false,
      }),
    [opacity],
  )
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={9}>
      <planeGeometry args={[radius * 2, radius * 2]} />
    </mesh>
  )
}

const RUNES = ['ᚠ', 'ᚱ', 'ᛟ', 'ᛉ', 'ᚹ', 'ᛗ', 'ᚦ', 'ᛞ']

/** Orbiting runic glyphs (wizard magic, demon sigils — recolor per act). */
export function RuneRing({
  position = [0, 1.4, 0], radius = 1.2, count = 7, color = '#9a6cff', speed = 1.2, size = 0.34,
}: {
  position?: [number, number, number]
  radius?: number
  count?: number
  color?: string
  speed?: number
  size?: number
}) {
  const group = useRef<THREE.Group>(null)
  const sprites = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const ctx = c.getContext('2d')!
      ctx.font = '48px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(RUNES[i % RUNES.length], 32, 34)
      const mat = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color,
      })
      const s = new THREE.Sprite(mat)
      s.scale.setScalar(size)
      return s
    })
  }, [count, color, size])

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = REDUCED ? 1.8 : clock.elapsedTime
    group.current.children.forEach((s, i) => {
      const a = t * speed + (i * Math.PI * 2) / count
      s.position.set(Math.cos(a) * radius, Math.sin(t * 2 + i) * 0.12, Math.sin(a) * radius)
      const mat = (s as THREE.Sprite).material
      mat.opacity = 0.55 + Math.sin(t * 3 + i) * 0.35
    })
  })

  return (
    <group ref={group} position={position}>
      {sprites.map((s, i) => (
        <primitive key={i} object={s} />
      ))}
    </group>
  )
}

export interface LightningHandle {
  /** show + rebolt between two local-space points for `dur` seconds */
  strike: (from: THREE.Vector3, to: THREE.Vector3, dur?: number) => void
}

/** Jagged rebolting lightning arc (hidden until strike() is called). */
export function LightningBolt({
  color = '#cfe8ff', handleRef,
}: {
  color?: string
  handleRef?: React.MutableRefObject<LightningHandle | null>
}) {
  const N = 32
  const state = useRef({
    until: 0,
    next: 0,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
  })
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50)
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const l = new THREE.Line(geo, mat)
    l.visible = false
    l.frustumCulled = false
    return l
  }, [color])

  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        strike: (from, to, dur = 0.35) => {
          if (REDUCED) return
          state.current.from.copy(from)
          state.current.to.copy(to)
          state.current.until = performance.now() / 1000 + dur
          state.current.next = 0
        },
      }
    }
  }, [handleRef])

  const A = useMemo(() => new THREE.Vector3(), [])
  const D = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const s = state.current
    const now = clock.elapsedTime
    const on = performance.now() / 1000 < s.until
    line.visible = on
    if (!on) return
    const mat = line.material as THREE.LineBasicMaterial
    mat.opacity = 0.5 + Math.random() * 0.5
    if (now < s.next) return
    s.next = now + 0.06 // the stutter IS the lightning look
    const pos = line.geometry.attributes.position as THREE.BufferAttribute
    D.copy(s.to).sub(s.from)
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const amp = 0.4 * Math.sin(t * Math.PI)
      A.copy(s.from).addScaledVector(D, t)
      pos.setXYZ(
        i,
        A.x + (Math.random() - 0.5) * amp,
        A.y + (Math.random() - 0.5) * amp,
        A.z + (Math.random() - 0.5) * amp,
      )
    }
    pos.needsUpdate = true
  })

  return <primitive object={line} />
}

export interface ShockwaveHandle {
  /** expanding ground ring at a local-space position */
  fire: (pos: THREE.Vector3) => void
}

/** Pooled ground-impact shockwave rings (3 in flight max). */
export function ShockwaveRings({
  color = '#ffb347', maxRadius = 5, handleRef,
}: {
  color?: string
  maxRadius?: number
  handleRef?: React.MutableRefObject<ShockwaveHandle | null>
}) {
  const rings = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => {
        const m = new THREE.Mesh(
          new THREE.RingGeometry(0.9, 1, 48),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            fog: false,
          }),
        )
        m.rotation.x = -Math.PI / 2
        m.position.y = 0.02 + i * 0.01
        m.visible = false
        return m
      }),
    [color],
  )

  useEffect(() => {
    if (handleRef) {
      handleRef.current = {
        fire: (pos) => {
          if (REDUCED) return
          const free = rings.find((r) => !r.visible)
          if (!free) return
          free.position.x = pos.x
          free.position.z = pos.z
          free.userData.t0 = performance.now() / 1000
          free.visible = true
        },
      }
    }
  }, [rings, handleRef])

  useFrame(() => {
    const now = performance.now() / 1000
    for (const r of rings) {
      if (!r.visible) continue
      const t = (now - (r.userData.t0 as number)) / 0.55
      if (t >= 1) {
        r.visible = false
        continue
      }
      const e = 1 - Math.pow(1 - t, 3)
      r.scale.setScalar(0.1 + e * maxRadius)
      ;(r.material as THREE.MeshBasicMaterial).opacity = 0.85 * Math.pow(1 - t, 1.5)
    }
  })

  return (
    <group>
      {rings.map((r, i) => (
        <primitive key={i} object={r} />
      ))}
    </group>
  )
}

/** Swirling portal disc (shadow-realm gate, arcane summons). */
export function Portal({
  position = [0, 1.5, 0], radius = 1.5, colorA = '#2a0a4a', colorB = '#d24dff', rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  radius?: number
  colorA?: string
  colorB?: string
  rotation?: [number, number, number]
}) {
  const mesh = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: REDUCED ? 2.4 : 0 },
        uA: { value: new THREE.Color(colorA) },
        uB: { value: new THREE.Color(colorB) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uA; uniform vec3 uB;
        varying vec2 vUv;
        void main() {
          vec2 c = vUv - 0.5;
          float r = length(c) * 2.0;
          float ang = atan(c.y, c.x) + (1.0 - r) * uTime * 2.2;
          float bands = 0.5 + 0.5 * sin(ang * 3.0 + r * 7.0 - uTime * 3.0);
          vec3 col = mix(uA, uB, bands);
          col += smoothstep(0.3, 0.0, r) * 0.8;
          float a = smoothstep(1.0, 0.75, r) * (0.35 + 0.6 * bands);
          gl_FragColor = vec4(col, a);
        }`,
    })
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 48), mat)
    return m
  }, [colorA, colorB])

  useFrame(({ clock }) => {
    if (!REDUCED) {
      ;(mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.elapsedTime
    }
  })

  return <primitive object={mesh} position={position} rotation={rotation} scale={radius} />
}
