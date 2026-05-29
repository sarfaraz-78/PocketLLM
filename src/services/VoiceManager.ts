import { TTSVoice } from '../types';

export const KOKORO_VOICES: TTSVoice[] = [
  // American Female
  { id: 'af_alloy', name: 'Alloy', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_aoede', name: 'Aoede', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_bella', name: 'Bella', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_jessica', name: 'Jessica', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_kore', name: 'Kore', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_nicole', name: 'Nicole', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_nova', name: 'Nova', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_river', name: 'River', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_sarah', name: 'Sarah', gender: 'female', locale: 'en-US', source: 'kokoro' },
  { id: 'af_sky', name: 'Sky', gender: 'female', locale: 'en-US', source: 'kokoro' },
  // American Male
  { id: 'am_adam', name: 'Adam', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_echo', name: 'Echo', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_eric', name: 'Eric', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_fenrir', name: 'Fenrir', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_liam', name: 'Liam', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_michael', name: 'Michael', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_onyx', name: 'Onyx', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_puck', name: 'Puck', gender: 'male', locale: 'en-US', source: 'kokoro' },
  { id: 'am_santa', name: 'Santa', gender: 'male', locale: 'en-US', source: 'kokoro' },
  // British Female
  { id: 'bf_alice', name: 'Alice', gender: 'female', locale: 'en-GB', source: 'kokoro' },
  { id: 'bf_emma', name: 'Emma', gender: 'female', locale: 'en-GB', source: 'kokoro' },
  { id: 'bf_isabella', name: 'Isabella', gender: 'female', locale: 'en-GB', source: 'kokoro' },
  { id: 'bf_lily', name: 'Lily', gender: 'female', locale: 'en-GB', source: 'kokoro' },
  // British Male
  { id: 'bm_daniel', name: 'Daniel', gender: 'male', locale: 'en-GB', source: 'kokoro' },
  { id: 'bm_fable', name: 'Fable', gender: 'male', locale: 'en-GB', source: 'kokoro' },
  { id: 'bm_george', name: 'George', gender: 'male', locale: 'en-GB', source: 'kokoro' },
  { id: 'bm_lewis', name: 'Lewis', gender: 'male', locale: 'en-GB', source: 'kokoro' },
];

export const DEFAULT_KOKORO_VOICE = 'af_bella';

export function getVoiceById(voiceId: string): TTSVoice | undefined {
  return KOKORO_VOICES.find((v) => v.id === voiceId);
}

export function getVoicesByGender(gender: 'female' | 'male'): TTSVoice[] {
  return KOKORO_VOICES.filter((v) => v.gender === gender);
}

export function getVoiceGroups(): { title: string; voices: TTSVoice[] }[] {
  return [
    { title: 'American Female', voices: KOKORO_VOICES.filter((v) => v.id.startsWith('af_')) },
    { title: 'American Male', voices: KOKORO_VOICES.filter((v) => v.id.startsWith('am_')) },
    { title: 'British Female', voices: KOKORO_VOICES.filter((v) => v.id.startsWith('bf_')) },
    { title: 'British Male', voices: KOKORO_VOICES.filter((v) => v.id.startsWith('bm_')) },
  ].filter((g) => g.voices.length > 0);
}
