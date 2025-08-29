import { _decorator, Component, Slider, Label } from 'cc';
import { AudioManager } from '../Managers/Audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('VolumeSlider')
export class VolumeSlider extends Component {
  @property(Slider) slider: Slider = null;
  @property(Label) label: Label = null;

  onEnable() {
    const mgr = AudioManager.instance;
    if (!mgr) return;

    const v = mgr.loadVolume();
    if (this.slider) this.slider.progress = v;
    if (this.label) this.label.string = `${Math.round(v * 100)}%`;
  }

  // 當 slider 拖動時呼叫
  onSliderChange(slider: Slider) {
    const mgr = AudioManager.instance;
    if (!mgr) return;

    const v = slider.progress;
    mgr.setVolume(v);
    if (this.label) this.label.string = `${Math.round(v * 100)}%`;
  }
}
