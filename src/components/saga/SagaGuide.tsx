import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { ACTS, TRAVEL, actAt, progressAt, railCurve, railUAt } from './sagaData'
import { prefersReducedMotion } from './sagaAssets'

/* A small train of overlapping light motes that rides just ahead of the
   camera. One draw call is enough to read as both a thread and a wisp; the
   curve samples only update while scroll damping is actually moving it. */
const POINTS = 42
const REST_LEAD = 0.012
const TRAVEL_LEAD = 0.027

const VERTEX_SHADER = `
  attribute float aTrail;
  uniform float uDpr;
  uniform float uTime;
  uniform float uMotion;
  varying float vTrail;

  void main() {
    vTrail = aTrail;
    vec3 p = position;

    // A tiny cross-breeze keeps the guide alive without moving it off-rail.
    float sway = sin(uTime * 2.1 + aTrail * 11.0) * 0.045 * uMotion;
    p.x += sway;
    p.y += cos(uTime * 1.7 + aTrail * 8.0) * 0.035 * uMotion;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float head = smoothstep(0.94, 1.0, aTrail);
    float size = mix(2.4, 6.2, aTrail * aTrail) + head * 3.8;
    float perspective = clamp(6.0 / max(1.0, -mv.z), 0.65, 1.4);
    gl_PointSize = size * uDpr * perspective;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAGMENT_SHADER = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTrail;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.1, d);
    float core = smoothstep(0.2, 0.0, d);
    float taper = smoothstep(0.0, 0.3, vTrail);
    float head = smoothstep(0.9, 1.0, vTrail);
    vec3 color = mix(
      uColor,
      vec3(1.0, 0.97, 0.84),
      clamp(core + head * 0.35, 0.0, 1.0)
    );
    float alpha = (glow * 0.5 + core * 0.8) * taper * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`

export default function SagaGuide() {
  const scroll = useScroll()
  const dpr = useThree((state) => state.viewport.dpr)
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const lastStart = useRef(-1)
  const lastEnd = useRef(-1)
  const sample = useMemo(() => new THREE.Vector3(), [])
  const tintTarget = useMemo(() => new THREE.Color(), [])
  const gold = useMemo(() => new THREE.Color('#f2c879'), [])

  const { points, positionAttribute, material } = useMemo(() => {
    const positions = new Float32Array(POINTS * 3)
    const trail = new Float32Array(POINTS)
    const sample = new THREE.Vector3()

    for (let i = 0; i < POINTS; i++) {
      const f = i / (POINTS - 1)
      railCurve.getPointAt(f * REST_LEAD, sample)
      positions[i * 3] = sample.x
      positions[i * 3 + 1] = sample.y
      positions[i * 3 + 2] = sample.z
      trail[i] = f
    }

    const positionAttribute = new THREE.BufferAttribute(positions, 3)
    positionAttribute.setUsage(THREE.DynamicDrawUsage)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', positionAttribute)
    geometry.setAttribute('aTrail', new THREE.BufferAttribute(trail, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#f2c879') },
        uDpr: { value: dpr },
        uMotion: { value: reduced ? 0 : 1 },
        uOpacity: { value: 0.35 },
        uTime: { value: 0 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })

    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    points.renderOrder = 12
    return { points, positionAttribute, material }
  }, [dpr, reduced])

  useEffect(() => {
    lastStart.current = -1
    lastEnd.current = -1
    return () => {
      points.geometry.dispose()
      material.dispose()
    }
  }, [points, material])

  useFrame(({ clock }, dt) => {
    const offset = scroll.offset
    const i = actAt(offset)
    const { t, hold } = progressAt(offset, i)
    const travel = t < TRAVEL
    const phase = travel ? Math.sin(Math.PI * THREE.MathUtils.smoothstep(t, 0, TRAVEL)) : 0
    const u = railUAt(offset, i)
    const lead = THREE.MathUtils.lerp(REST_LEAD, TRAVEL_LEAD, phase)
    const end = Math.min(1, u + lead)
    const start = Math.max(0, end - lead)

    // Skip 42 curve evaluations once the damped scroll position has settled.
    if (
      Math.abs(start - lastStart.current) > 0.00001 ||
      Math.abs(end - lastEnd.current) > 0.00001
    ) {
      for (let p = 0; p < POINTS; p++) {
        const f = p / (POINTS - 1)
        railCurve.getPointAt(THREE.MathUtils.lerp(start, end, f), sample)
        positionAttribute.setXYZ(p, sample.x, sample.y, sample.z)
      }
      positionAttribute.needsUpdate = true
      lastStart.current = start
      lastEnd.current = end
    }

    if (!reduced) material.uniforms.uTime.value = clock.elapsedTime
    const finaleFade = THREE.MathUtils.smoothstep(1 - u, 0, 0.025)
    const targetOpacity =
      (travel ? 0.62 + phase * 0.3 : 0.3 - hold * 0.08) * finaleFade
    material.uniforms.uOpacity.value = reduced
      ? targetOpacity
      : THREE.MathUtils.damp(
          material.uniforms.uOpacity.value as number,
          targetOpacity,
          5,
          dt,
        )

    // Retain a single golden identity, with only a restrained act tint.
    tintTarget.set(ACTS[i].palette.drift.color).lerp(gold, 0.78)
    const guideColor = material.uniforms.uColor.value as THREE.Color
    if (reduced) guideColor.copy(tintTarget)
    else guideColor.lerp(tintTarget, 1 - Math.exp(-dt * 3))
  })

  return <primitive object={points} />
}
