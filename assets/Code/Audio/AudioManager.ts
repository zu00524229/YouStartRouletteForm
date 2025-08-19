import { _decorator, AudioSource, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
  @property([AudioSource]) AudioSources: AudioSource[] = [];

  playButtonSound(index: number) {
    if (this.AudioSources[index]) {
      this.AudioSources[index].play();
    }
  }

  start() {}

  update(deltaTime: number) {}
}
