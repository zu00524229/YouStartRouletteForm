import { _decorator, Component, Slider, Label, Enum } from 'cc';
import { AudioManager } from '../Managers/Audio/AudioManager';
const { ccclass, property } = _decorator;

// 定義 Enum
enum VolumeType {
  BGM = 0,
  SFX = 1,
}
Enum(VolumeType); // 👈 讓 Cocos 可以在 Inspector 顯示

@ccclass('VolumeSlider')
export class VolumeSlider extends Component {
  @property(Slider) slider: Slider = null;
  @property(Label) label: Label = null;

  // 在 Inspector 可以選擇這個 Slider 控制 BGM 還是 SFX
  @property({ type: VolumeType })
  type: VolumeType = VolumeType.BGM;

  onEnable() {
    const mgr = AudioManager.instance;
    if (!mgr) return;

    let v = 1;
    if (this.type === VolumeType.BGM) {
      const saved = localStorage.getItem('bgmVolume');
      v = saved ? parseFloat(saved) : 1;
      mgr.setBGMVolume(v);
    } else {
      const saved = localStorage.getItem('sfxVolume');
      v = saved ? parseFloat(saved) : 1;
      mgr.setVolume(v);
    }

    if (this.slider) this.slider.progress = v;
    if (this.label) this.label.string = `${Math.round(v * 100)}%`;
  }

  // 當 slider 拖動時呼叫
  onSliderChange(slider: Slider) {
    const mgr = AudioManager.instance;
    if (!mgr) return;

    const v = slider.progress;
    if (this.type === VolumeType.BGM) {
      mgr.setBGMVolume(v);
    } else {
      mgr.setVolume(v);
    }

    if (this.label) this.label.string = `${Math.round(v * 100)}%`;
  }
}
