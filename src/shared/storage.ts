/** 모든 localStorage 키는 이 접두사를 사용한다. 게임은 `ideun.<gameId>.*` 형태로 저장. */
export const STORAGE_PREFIX = 'ideun';

export const storageKey = (...parts: string[]) => [STORAGE_PREFIX, ...parts].join('.');
