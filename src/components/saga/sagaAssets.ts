import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'

/* ─── SAGA · characters & props ───────────────────────────────────────
   Models (all verified CC0):
   - knight.glb / mage.glb — KayKit "Adventurers" by Kay Lousberg, 76 shared
     clips (Idle, Walking_A, 1H_Melee_Attack_Slice_Horizontal, Block,
     Spellcast_Shoot, Cheer, …), sword attaches to the `handslot.r` bone
   - dragon.glb  — "Dragon Evolved" by Quaternius
     (clips prefixed `CharacterArmature|`: Flying_Idle, Punch, Headbutt…)
   - demon.glb   — Quaternius (clips carry a tripled `EnemyArmature|` prefix:
     Idle, Walk, Attack, Jump…) — play() matches by suffix so it Just Works
   - castle.glb / tower.glb — Quaternius, static
   - sword.glb   — "Sword" by hat_my_guy (poly.pizza), static */

export const MODELS = {
  knight: '/media/saga/knight.glb',
  mage: '/media/saga/mage.glb',
  dragon: '/media/saga/dragon.glb',
  demon: '/media/saga/demon.glb',
  castle: '/media/saga/castle.glb',
  tower: '/media/saga/tower.glb',
  sword: '/media/saga/sword.glb',
}

Object.values(MODELS).forEach((url) => useGLTF.preload(url))

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface CharacterHandle {
  root: THREE.Group
  mixer: THREE.AnimationMixer
  /** crossfade to the first clip whose name ends with `suffix` */
  play: (suffix: string, opts?: { fade?: number; timeScale?: number; once?: boolean }) => void
  /** currently playing clip suffix (for cheap beat state machines) */
  current: () => string
}

/**
 * A skinned, animated instance of a GLB. Clones the scene (so many acts can
 * cast the same actor), owns a mixer, and exposes a suffix-matching play().
 * Under reduced motion the mixer poses the first frame and freezes.
 */
export function useCharacter(url: string, initialClip?: string): CharacterHandle {
  const { scene, animations } = useGLTF(url)
  const reduced = useMemo(() => prefersReducedMotion(), [])

  const handle = useMemo<CharacterHandle>(() => {
    const root = SkeletonUtils.clone(scene) as THREE.Group
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.frustumCulled = false // skinned bounds lie
    })
    const mixer = new THREE.AnimationMixer(root)
    let currentSuffix = ''
    let currentAction: THREE.AnimationAction | null = null
    const play: CharacterHandle['play'] = (suffix, opts = {}) => {
      if (suffix === currentSuffix) return
      // exact name first — endsWith alone would resolve 'Idle' to
      // '2H_Melee_Idle'; the pipe form still matches the Quaternius rigs'
      // prefixed clips ('CharacterArmature|Flying_Idle', tripled demon prefix)
      const clip =
        animations.find((c) => c.name === suffix) ??
        animations.find((c) => c.name.endsWith('|' + suffix)) ??
        animations.find((c) => c.name.endsWith(suffix))
      if (!clip) return
      const next = mixer.clipAction(clip)
      next.reset()
      next.timeScale = opts.timeScale ?? 1
      if (opts.once) {
        next.setLoop(THREE.LoopOnce, 1)
        next.clampWhenFinished = true
      } else {
        next.setLoop(THREE.LoopRepeat, Infinity)
      }
      if (currentAction && currentAction !== next) {
        next.crossFadeFrom(currentAction, opts.fade ?? 0.25, false)
      }
      next.play()
      currentAction = next
      currentSuffix = suffix
    }
    return { root, mixer, play, current: () => currentSuffix }
  }, [scene, animations])

  // pose the initial clip; freeze there if the visitor prefers reduced motion
  useEffect(() => {
    if (initialClip) handle.play(initialClip)
    handle.mixer.update(0.03)
  }, [handle, initialClip])

  const reducedRef = useRef(reduced)
  useFrame((_, dt) => {
    // characters in hidden acts render zero pixels — don't animate their bones
    if (!reducedRef.current && handle.root.parent?.visible !== false) {
      handle.mixer.update(Math.min(dt, 0.05))
    }
  })

  return handle
}

/** clone of the static sword, ready to parent to a `handslot.r` bone */
export function useSword(): THREE.Group {
  const { scene } = useGLTF(MODELS.sword)
  return useMemo(() => {
    const s = scene.clone(true)
    s.scale.setScalar(0.85)
    s.rotation.set(Math.PI / 2, 0, 0) // blade along the grip axis
    return s
  }, [scene])
}

/** attach a prop to a named bone (e.g. armSword(knight.root, sword)) */
export function attachToBone(root: THREE.Object3D, boneName: string, prop: THREE.Object3D) {
  const bone = root.getObjectByName(boneName)
  if (bone) bone.add(prop)
}
