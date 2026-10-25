/** 이름 뒤 호격 조사: 이든 → 이든아, 하나 → 하나야 */
export function callName(name: string): string {
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return name;
  return name + ((last - 0xac00) % 28 === 0 ? '야' : '아');
}

/** 이름 뒤 주격: 이든 → 이든이, 하나 → 하나 (애칭형) */
export function nickName(name: string): string {
  const last = name.charCodeAt(name.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return name;
  return name + ((last - 0xac00) % 28 === 0 ? '' : '이');
}

/**
 * 받침에 맞는 조사: josa('기역몬', '이/가') → '기역몬이', josa('아야몽', '을/를') → '아야몽을'.
 * '(으)로'는 받침이 없거나 ㄹ 받침이면 '로'.
 */
export function josa(word: string, pair: '이/가' | '을/를' | '은/는' | '과/와' | '으로/로' | '아/야'): string {
  const last = word.charCodeAt(word.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return word + pair.split('/')[1];
  const jong = (last - 0xac00) % 28;
  const [withB, without] = pair.split('/');
  if (pair === '으로/로') return word + (jong === 0 || jong === 8 ? without : withB);
  return word + (jong === 0 ? without : withB);
}
