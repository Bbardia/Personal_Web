import { memo, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import {
  ACTS, TRAVEL, actAt, progressAt, railCurve, railUAt,
} from './sagaData'
import { prefersReducedMotion } from './sagaAssets'
import { DriftParticles, type DriftHandle } from './sagaFx'
import SagaGuide from './SagaGuide'
import ActPrologue from './acts/ActPrologue'
import ActDragon from './acts/ActDragon'
import ActWizard from './acts/ActWizard'
import ActDemon from './acts/ActDemon'
import ActShadow from './acts/ActShadow'
import ActEpilogue from './acts/ActEpilogue'

interface SagaSceneProps {
  onActChange: (i: number) => void
  onScrollEl: (el: HTMLElement) => void
}

const smooth = (x: number) => THREE.MathUtils.smoothstep(x, 0, 1)
const BASE_FOV = 55
const POSITION_DAMPING = 3
const LOOK_DAMPING = 2.1
const CINEMATIC_DAMPING = 3.2

/* ─── camera: one rail, two damping stages, pointer parallax ────────── */
function CameraRig({ onActChange, onScrollEl }: SagaSceneProps) {
  const scroll = useScroll()
  const reduced = useMemo(() => prefersReducedMotion(), [])
  const actRef = useRef(-1)
  const lookTarget = useRef(new THREE.Vector3(...ACTS[0].subject))
  const railPos = useMemo(() => new THREE.Vector3(), [])
  const railTangent = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])
  const prevSubject = useMemo(() => new THREE.Vector3(), [])
  const bank = useRef(0)

  useEffect(() => {
    onScrollEl(scroll.el)
  }, [scroll.el, onScrollEl])

  useFrame(({ camera, pointer }, dt) => {
    const offset = scroll.offset
    const i = actAt(offset)
    const { t } = progressAt(offset, i)
    const act = ACTS[i]
    let travelPulse = 0

    if (reduced) {
      // A true slideshow: chapter changes cut directly to a still tableau.
      camera.position.set(...act.holdPos)
      desired.set(...act.subject)
      lookTarget.current.copy(desired)
      bank.current = 0
    } else {
      // rail sample: travel toward this act's hold point, then push in slowly
      const u = railUAt(offset, i)
      railCurve.getPointAt(u, railPos)
      railCurve.getTangentAt(Math.min(1, u + 0.004), railTangent)
      if (t < TRAVEL) {
        travelPulse = Math.sin(Math.PI * THREE.MathUtils.smoothstep(t, 0, TRAVEL))
      }

      const px = pointer.x * 0.55
      const py = -pointer.y * 0.35
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        railPos.x + px,
        POSITION_DAMPING,
        dt,
      )
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        railPos.y + py,
        POSITION_DAMPING,
        dt,
      )
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        railPos.z,
        POSITION_DAMPING,
        dt,
      )

      // gaze swings to the destination early in the flight, so travel frames
      // the diorama being approached instead of empty mist
      prevSubject.set(...ACTS[Math.max(0, i - 1)].subject)
      desired.set(...act.subject)
      if (t < TRAVEL) {
        desired.lerpVectors(prevSubject, desired, smooth(Math.min(1, t / (TRAVEL * 0.65))))
      }

      // A restrained bank follows the rail's lateral direction, then levels
      // before every tableau. It is applied after lookAt below.
      const targetBank = THREE.MathUtils.clamp(
        -railTangent.x * 0.075 * travelPulse,
        -0.06,
        0.06,
      )
      bank.current = THREE.MathUtils.damp(
        bank.current,
        targetBank,
        CINEMATIC_DAMPING,
        dt,
      )
    }

    const perspective = camera as THREE.PerspectiveCamera
    if (perspective.isPerspectiveCamera) {
      const nextFov = reduced
        ? BASE_FOV
        : THREE.MathUtils.damp(
            perspective.fov,
            BASE_FOV + travelPulse * 3.2,
            CINEMATIC_DAMPING,
            dt,
          )
      if (
        (reduced && perspective.fov !== BASE_FOV) ||
        (!reduced && Math.abs(perspective.fov - nextFov) > 0.001)
      ) {
        perspective.fov = reduced ? BASE_FOV : nextFov
        perspective.updateProjectionMatrix()
      }
    }

    if (!reduced) {
      lookTarget.current.x = THREE.MathUtils.damp(
        lookTarget.current.x,
        desired.x,
        LOOK_DAMPING,
        dt,
      )
      lookTarget.current.y = THREE.MathUtils.damp(
        lookTarget.current.y,
        desired.y,
        LOOK_DAMPING,
        dt,
      )
      lookTarget.current.z = THREE.MathUtils.damp(
        lookTarget.current.z,
        desired.z,
        LOOK_DAMPING,
        dt,
      )
    }
    camera.lookAt(lookTarget.current)
    if (!reduced) camera.rotateZ(bank.current)

    if (i !== actRef.current) {
      actRef.current = i
      onActChange(i)
    }
  })

  return null
}

/* ─── atmosphere: ONE pre-mounted rig, retinted per act ─────────────
   fog + background + 4 lights + camera-following drift particles are
   lerped between act palettes — nothing mounts or unmounts mid-scroll
   (mounting lights mid-flight = shader recompile hitch). */
function AtmosphereRig() {
  const scroll = useScroll()
  const scene = useThree((s) => s.scene)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const key = useRef<THREE.PointLight>(null)
  const accent = useRef<THREE.PointLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const driftGroup = useRef<THREE.Group>(null)
  const drift = useRef<DriftHandle | null>(null)

  const bg = useMemo(() => new THREE.Color(ACTS[0].palette.bg), [])
  const fog = useMemo(
    () => new THREE.FogExp2(ACTS[0].palette.fog, ACTS[0].palette.fogDensity),
    [],
  )
  const cA = useMemo(() => new THREE.Color(), [])
  const cB = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    scene.background = bg
    scene.fog = fog
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene, bg, fog])

  useFrame(({ camera }) => {
    const offset = scroll.offset
    const i = actAt(offset)
    const { t } = progressAt(offset, i)
    // blend from the previous act's palette while travelling — faster than
    // the camera (done by ~60% of the flight) so each act's mood arrives
    // before its diorama fills the frame
    const from = ACTS[Math.max(0, i - 1)].palette
    const to = ACTS[i].palette
    const f = i === 0 ? 1 : smooth(Math.min(1, t / (TRAVEL * 0.6)))

    bg.copy(cA.set(from.bg).lerp(cB.set(to.bg), f))
    fog.color.copy(cA.set(from.fog).lerp(cB.set(to.fog), f))
    fog.density = THREE.MathUtils.lerp(from.fogDensity, to.fogDensity, f)

    if (hemi.current) {
      hemi.current.color.copy(cA.set(from.hemiSky).lerp(cB.set(to.hemiSky), f))
      hemi.current.groundColor.copy(cA.set(from.hemiGround).lerp(cB.set(to.hemiGround), f))
      hemi.current.intensity = THREE.MathUtils.lerp(from.hemiInt, to.hemiInt, f)
    }
    const lerpLight = (
      light: THREE.PointLight | THREE.DirectionalLight,
      a: typeof from.key,
      b: typeof to.key,
    ) => {
      light.color.copy(cA.set(a.color).lerp(cB.set(b.color), f))
      light.intensity = THREE.MathUtils.lerp(a.int, b.int, f)
      light.position.set(
        THREE.MathUtils.lerp(a.pos[0], b.pos[0], f),
        THREE.MathUtils.lerp(a.pos[1], b.pos[1], f),
        THREE.MathUtils.lerp(a.pos[2], b.pos[2], f),
      )
    }
    if (key.current) lerpLight(key.current, from.key, to.key)
    if (accent.current) lerpLight(accent.current, from.accent, to.accent)
    if (sun.current) lerpLight(sun.current, from.sun, to.sun)

    // ambient drift rides with the camera, retinted per act
    if (driftGroup.current) driftGroup.current.position.copy(camera.position)
    if (drift.current) {
      const u = drift.current.material.uniforms
      ;(u.uColor.value as THREE.Color).copy(cA.set(from.drift.color).lerp(cB.set(to.drift.color), f))
      ;(u.uAccent.value as THREE.Color).copy(u.uColor.value as THREE.Color)
      u.uSpeed.value = THREE.MathUtils.lerp(from.drift.speed, to.drift.speed, f)
      u.uOpacity.value = THREE.MathUtils.lerp(from.drift.opacity, to.drift.opacity, f)
      const additive = (f < 0.5 ? from : to).drift.additive
      drift.current.material.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending
    }
  })

  return (
    <>
      <hemisphereLight ref={hemi} intensity={0.7} />
      <pointLight ref={key} distance={26} decay={2} intensity={0} />
      <pointLight ref={accent} distance={18} decay={2} intensity={0} />
      <directionalLight ref={sun} intensity={0} />
      <group ref={driftGroup}>
        <DriftParticles
          handleRef={drift}
          count={window.innerWidth < 768 ? 130 : 260}
          box={[22, 14, 22]}
          color={ACTS[0].palette.drift.color}
          speed={ACTS[0].palette.drift.speed}
          opacity={ACTS[0].palette.drift.opacity}
          additive={ACTS[0].palette.drift.additive}
          size={30}
        />
      </group>
    </>
  )
}

function SagaScene({ onActChange, onScrollEl }: SagaSceneProps) {
  return (
    <>
      <CameraRig onActChange={onActChange} onScrollEl={onScrollEl} />
      <AtmosphereRig />
      <ActPrologue />
      <ActDragon />
      <ActWizard />
      <ActDemon />
      <ActShadow />
      <ActEpilogue />
      <SagaGuide />
    </>
  )
}

/* memo matters: the HUD's act state lives in SagaPage, and without this every
   act crossing re-renders the whole scene — rebuilding (and leaking) every
   particle system whose props are array literals */
export default memo(SagaScene)
