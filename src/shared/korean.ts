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
