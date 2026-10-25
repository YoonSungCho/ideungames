export type Rng = () => number;

/** 재현 가능한 테스트를 위한 시드 기반 난수 (mulberry32). */
export function createRng(seed: number = Math.floor(Math.random() * 2 ** 32)): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
