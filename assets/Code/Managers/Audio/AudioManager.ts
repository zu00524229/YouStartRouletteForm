import { _decorator, AudioSource, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
  @property([AudioSource]) AudioSources: AudioSource[] = []; // 音效
  @property([AudioSource]) BgmSources: AudioSource[] = [];

  private static _instance: AudioManager;

  onLoad() {
    AudioManager._instance = this;

    // 如果會切場景，建議開啟常駐（現在先保留註解）
    // game.addPersistRootNode(this.node);

    this.loadVolume();
  }

  public static get instance(): AudioManager {
    if (!this._instance) {
      console.warn('[AudioManager] instance 尚未建立。請確認場景中有掛載 AudioManager。');
    }
    return this._instance!;
  }

  // 設定音效 (0 ~ 1)
  public setVolume(value: number) {
    this.AudioSources.forEach((src) => {
      if (src) src.volume = value;
    });
    localStorage.setItem('volume', value.toString());
  }

  // 載入音效(預設1)
  public loadVolume(): number {
    const saved = localStorage.getItem('volume');
    const v = saved ? parseFloat(saved) : 1;
    this.setVolume(v);
    return v;
  }

  /** 設定背景音樂音量 (即時生效) */
  public setBGMVolume(value: number) {
    const v = Math.max(0, Math.min(1, value));
    this.BgmSources.forEach((src) => {
      if (src) src.volume = v; // ✅ 即時變動
    });
    localStorage.setItem('bgmVolume', v.toString());
  }

  // 播放按鈕音效
  playButtonSound(index: number) {
    if (this.AudioSources[index]) {
      this.AudioSources[index].play();
    }
  }
}
