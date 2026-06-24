import { Howl } from 'howler';
import CardFlip from '../sounds/card-flip.mp3';
import ClockTicking from '../sounds/clock-ticking.mp3';
import Pop from '../sounds/pop.mp3';

const SOUND_ASSETS = {
  CardFlip: CardFlip,
  ClockTicking: ClockTicking,
  Pop: Pop,
} as const;

export type SoundEffectName = keyof typeof SOUND_ASSETS;

const soundCache: Partial<Record<SoundEffectName, Howl>> = {};

export const SoundUtil = {
  play: (name: SoundEffectName, options?: { loop?: boolean; volume?: number }) => {
    if (!soundCache[name]) {
      soundCache[name] = new Howl({
        src: [SOUND_ASSETS[name]],
        loop: options?.loop ?? false,
        volume: options?.volume ?? 1.0,
      });
    }

    soundCache[name]?.play();
  },

  pause: (name: SoundEffectName) => {
    soundCache[name]?.pause();
  },

  stop: (name: SoundEffectName) => {
    soundCache[name]?.stop();
  },

  stopAll: () => {
    Object.values(soundCache).forEach((sound) => sound?.stop());
  },
};
