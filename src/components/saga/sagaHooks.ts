import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { ACTS, progressAt, type ActProgress } from './sagaData'

/* margin (in scroll fraction) around an act's slice in which its diorama
   stays mounted-visible, so neighbours are ready before the camera arrives */
const VISIBLE_MARGIN = 0.08

export interface ActGroup {
  /** attach to the act's root <group> */
  ref: React.MutableRefObject<THREE.Group | null>
  /** live per-frame progress — read inside your own useFrame, never in render */
  prog: React.MutableRefObject<ActProgress>
}

/**
 * Contract for every act diorama: one root group, auto-toggled visibility
 * (off-screen acts cost zero draw calls), and stateless scroll progress
 * for battle beats: prog.current.t (whole act), prog.current.hold (dwell).
 */
export function useActGroup(index: number): ActGroup {
  const ref = useRef<THREE.Group | null>(null)
  const prog = useRef<ActProgress>({ i: index, t: 0, hold: 0 })
  const scroll = useScroll()

  useFrame(() => {
    const offset = scroll.offset
    const [s0, s1] = ACTS[index].scroll
    if (ref.current) {
      ref.current.visible = offset > s0 - VISIBLE_MARGIN && offset < s1 + VISIBLE_MARGIN
    }
    prog.current = progressAt(offset, index)
  })

  return { ref, prog }
}
