
// Sound Assets (Local paths)
// Place your audio files in 'public/sounds/'
const SOUND_ASSETS = {
  bgm: '/sounds/bgm.mp3',
  hover: '/sounds/hover.mp3',
  draw: '/sounds/draw.mp3',
  play_unit: '/sounds/play_unit.mp3',
  play_spell: '/sounds/play_spell.mp3',
  attack_lunge: '/sounds/attack_lunge.mp3',
  damage_physical: '/sounds/damage_physical.mp3',
  damage_spell: '/sounds/damage_spell.mp3',
  turn_start: '/sounds/turn_start.mp3',
  victory: '/sounds/victory.mp3',
  defeat: '/sounds/defeat.mp3',
  click: '/sounds/click.mp3',
  heal: '/sounds/heal.mp3',
  shield: '/sounds/shield.mp3',
  death: '/sounds/death.mp3',
  discard: '/sounds/discard.mp3'
};

export type SoundType = keyof typeof SOUND_ASSETS;

class SoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private bgmAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Preload sounds
    if (typeof window !== 'undefined') {
      Object.entries(SOUND_ASSETS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.volume = key === 'bgm' ? 0.3 : 0.6;
        this.audioCache.set(key, audio);
      });
    }
  }

  // Call this on first user interaction to unlock audio policy
  init() {
    if (this.initialized) return;
    this.play('click');
    this.initialized = true;
  }

  play(type: SoundType) {
    if (this.isMuted) return;

    const audio = this.audioCache.get(type);
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = audio.volume;
      clone.play().catch(e => console.warn(`Audio ${type} blocked or missing:`, e));
    }
  }

  playBGM() {
    if (this.isMuted || this.bgmAudio) return;
    this.bgmAudio = new Audio(SOUND_ASSETS.bgm);
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.2;
    this.bgmAudio.play().catch(e => console.warn("BGM blocked or missing:", e));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.isMuted;
    }
  }

  setBGMVolume(volume: number) {
    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

export const soundManager = new SoundManager();
