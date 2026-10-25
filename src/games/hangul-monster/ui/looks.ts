import type { SpeciesId } from '../data/species';

/**
 * 몬스터마다 다른 생김새 (MonsterArt가 부품을 조립해 그린다).
 * body: 몸 모양, ears/horn/tail/wings/crest: 붙는 부품, pattern: 무늬, eyes/mouth: 표정, accent: 부품 색
 */
export type Body = 'round' | 'pear' | 'egg' | 'fish' | 'rock' | 'ghost' | 'bot' | 'cloud';
export type Ears = 'cat' | 'bunny' | 'bear' | 'fin' | 'none';
export type Horn = 'nub' | 'unicorn' | 'curl' | 'none';
export type Tail = 'flame' | 'leaf' | 'fish' | 'curl' | 'bolt' | 'none';
export type Wings = 'feather' | 'bat' | 'butterfly' | 'none';
export type Crest = 'sprout' | 'feather' | 'flame' | 'drop' | 'spikes' | 'flower' | 'antenna' | 'star' | 'gear' | 'leafCrown' | 'none';
export type Pattern = 'spots' | 'stripes' | 'sparkle' | 'bolts' | 'cracks' | 'none';
export type Eyes = 'round' | 'sleepy' | 'sharp' | 'happy' | 'screen';
export type Mouth = 'smile' | 'cat' | 'fang' | 'o' | 'grin' | 'beak';

export interface Look {
  body: Body;
  ears?: Ears;
  horn?: Horn;
  tail?: Tail;
  wings?: Wings;
  crest?: Crest;
  pattern?: Pattern;
  eyes?: Eyes;
  mouth?: Mouth;
  /** 부품 색 (불꽃·잎·지느러미 등) */
  accent?: string;
  /** 배 무늬 색 */
  belly?: string;
}

export const LOOKS: Record<SpeciesId, Look> = {
  giyeok: { body: 'pear', ears: 'cat', tail: 'flame', crest: 'flame', mouth: 'fang', accent: '#ffd166' },
  giga: { body: 'pear', ears: 'cat', horn: 'curl', tail: 'flame', crest: 'flame', pattern: 'stripes', eyes: 'sharp', mouth: 'fang', accent: '#ffd166' },
  aya: { body: 'fish', ears: 'fin', tail: 'fish', crest: 'drop', mouth: 'o', accent: '#9be7ff' },
  ayaking: { body: 'fish', ears: 'fin', tail: 'fish', crest: 'drop', pattern: 'sparkle', eyes: 'sharp', mouth: 'smile', accent: '#9be7ff' },
  ssak: { body: 'round', crest: 'sprout', tail: 'leaf', mouth: 'smile', accent: '#8bd46b' },
  malnamu: { body: 'pear', crest: 'leafCrown', tail: 'leaf', pattern: 'spots', eyes: 'sharp', mouth: 'grin', accent: '#8bd46b' },

  nieun: { body: 'round', ears: 'bear', eyes: 'sleepy', mouth: 'cat', tail: 'curl', accent: '#ffd9a0' },
  digeut: { body: 'egg', wings: 'feather', crest: 'feather', mouth: 'beak', accent: '#ffd166' },
  mieum: { body: 'round', ears: 'none', horn: 'nub', pattern: 'spots', mouth: 'smile', accent: '#e8c8ff' },
  bieup: { body: 'pear', ears: 'bunny', tail: 'flame', mouth: 'cat', accent: '#ffe1b0' },
  bieupdae: { body: 'pear', ears: 'bunny', horn: 'nub', tail: 'flame', pattern: 'stripes', eyes: 'sharp', mouth: 'fang', accent: '#ffd166' },
  hieut: { body: 'egg', wings: 'feather', crest: 'star', pattern: 'sparkle', eyes: 'happy', mouth: 'beak', accent: '#fff3b0' },

  oo: { body: 'round', ears: 'fin', horn: 'nub', mouth: 'o', pattern: 'spots', accent: '#ffb0a0' },
  uu: { body: 'cloud', crest: 'drop', eyes: 'sleepy', mouth: 'o', accent: '#cfe0ff' },
  iigo: { body: 'fish', tail: 'fish', crest: 'drop', mouth: 'smile', pattern: 'stripes', accent: '#bfe6ff' },
  eo: { body: 'egg', wings: 'feather', crest: 'feather', mouth: 'beak', accent: '#ffffff' },
  yuyu: { body: 'ghost', crest: 'drop', pattern: 'sparkle', eyes: 'happy', mouth: 'o', accent: '#e6f8ff' },

  gom: { body: 'pear', ears: 'bear', mouth: 'smile', pattern: 'none', accent: '#e8c79a' },
  gomdae: { body: 'pear', ears: 'bear', horn: 'nub', pattern: 'cracks', eyes: 'sharp', mouth: 'fang', accent: '#e8c79a' },
  dol: { body: 'rock', pattern: 'cracks', eyes: 'round', mouth: 'grin', accent: '#c9c0b8' },
  bawi: { body: 'rock', crest: 'spikes', pattern: 'cracks', eyes: 'sharp', mouth: 'fang', accent: '#c9c0b8' },
  bak: { body: 'round', ears: 'cat', wings: 'bat', mouth: 'fang', accent: '#b9a6f0' },
  san: { body: 'rock', crest: 'spikes', mouth: 'smile', pattern: 'spots', accent: '#a9c98a' },
  byeol: { body: 'egg', wings: 'feather', crest: 'star', pattern: 'sparkle', eyes: 'happy', mouth: 'smile', accent: '#fff3b0' },

  sagwa: { body: 'round', crest: 'sprout', mouth: 'smile', pattern: 'sparkle', accent: '#8bd46b' },
  nabi: { body: 'egg', wings: 'butterfly', crest: 'antenna', mouth: 'smile', pattern: 'spots', accent: '#ffe066' },
  gureum: { body: 'cloud', eyes: 'sleepy', mouth: 'cat', accent: '#ffffff' },
  mujigae: { body: 'egg', wings: 'butterfly', crest: 'flower', pattern: 'sparkle', eyes: 'happy', mouth: 'smile', accent: '#7be0ff' },

  hana: { body: 'pear', ears: 'bunny', tail: 'bolt', crest: 'none', pattern: 'bolts', mouth: 'cat', accent: '#fff3a0' },
  beongae: { body: 'pear', ears: 'bunny', horn: 'unicorn', tail: 'bolt', pattern: 'bolts', eyes: 'sharp', mouth: 'fang', accent: '#fff3a0' },
  duldul: { body: 'round', ears: 'bear', crest: 'antenna', pattern: 'spots', mouth: 'smile', accent: '#fff3a0' },
  set: { body: 'egg', wings: 'feather', crest: 'star', pattern: 'sparkle', mouth: 'beak', accent: '#fff3a0' },
  yeong: { body: 'ghost', crest: 'antenna', eyes: 'round', mouth: 'o', pattern: 'bolts', accent: '#fff3a0' },
  baekman: { body: 'pear', ears: 'cat', horn: 'unicorn', tail: 'bolt', crest: 'star', pattern: 'bolts', eyes: 'sharp', mouth: 'fang', accent: '#fff3a0' },

  deohagi: { body: 'bot', crest: 'antenna', eyes: 'screen', mouth: 'grin', accent: '#ffd166' },
  ppaegi: { body: 'bot', crest: 'gear', eyes: 'screen', mouth: 'smile', accent: '#ff9fb2' },
  gopsem: { body: 'bot', ears: 'bear', crest: 'gear', eyes: 'screen', mouth: 'grin', accent: '#b4f0c8' },
  gugu: { body: 'bot', ears: 'bear', horn: 'curl', crest: 'gear', pattern: 'sparkle', eyes: 'sharp', mouth: 'fang', accent: '#ffd166' },
  nanugi: { body: 'egg', wings: 'bat', crest: 'gear', eyes: 'screen', mouth: 'smile', accent: '#c8d0ff' },

  eongmang: { body: 'ghost', horn: 'nub', eyes: 'sharp', mouth: 'grin', pattern: 'spots', accent: '#ffb3e6' },
  dwijuk: { body: 'ghost', horn: 'curl', eyes: 'sharp', mouth: 'fang', accent: '#c9b3ff' },
  bakjuk: { body: 'ghost', ears: 'cat', eyes: 'sharp', mouth: 'fang', pattern: 'stripes', accent: '#ffb3e6' },
  king: { body: 'ghost', horn: 'curl', wings: 'bat', eyes: 'sharp', mouth: 'fang', pattern: 'sparkle', accent: '#ffd166' },
};
