import { _decorator, Component, Node, tween } from 'cc';
import { AudioManager } from '../../Managers/Audio/AudioManager';
import { WheelConfig, WheelSyncConfig, WheelThreeConfig } from './WheelConfig'; // 引入 轉盤指針動畫同步變數
const { ccclass, property } = _decorator;

@ccclass('PointerAnim')
export class PointerAnim extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  @property(Node)
  pivotNode: Node | null = null; // 🎯 旋轉軸心（拖指針的控節點進來）

  // @property
  // swingAngle: number = 25; // 最大右擺角度

  @property
  swingInterval: number = 0.15; // 每次來回時間（越小越快）

  //! 指針動畫3
  playPointerSwing3(fullTime: number) {
    if (!this.pivotNode) {
      console.warn('⚠️ pivotNode 未設置，請在 Inspector 拖一個控節點進來！');
      return;
    }
    tween(this.pivotNode).stop();

    // const fullTime = preStopTime + WheelThreeConfig.delayPointerSwing + reboundTime;
    const swingAngle = 40; // 最大右擺角度
    const totalSwings = 16;
    const activeSwings = 14;
    const times: number[] = [];

    // 前快後慢
    for (let i = 1; i <= activeSwings; i++) {
      times.push(Math.pow(i / totalSwings, 3));
    }

    let prev = 0;
    const swingIntervals = times.map((t) => {
      const dt = (t - prev) * fullTime;
      prev = t;
      return dt;
    });

    let seq = tween(this.pivotNode);

    // 前 14 下：在 40 ↔ 30 間擺動
    swingIntervals.forEach((dt, i) => {
      const half = dt / 2;
      if (i === 14) {
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'quadOut' })
          .call(() => this.Audio.AudioSources[4].play())
          .to(half, { angle: 20 }, { easing: 'quadIn' });
      } else {
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'quadOut' })
          .call(() => this.Audio.AudioSources[4].play())
          .to(half, { angle: 30 }, { easing: 'quadIn' });
      }
    });

    // 第 15 下：停在 swingAngle
    seq = seq.to(WheelThreeConfig.reboundTime * 0.5, { angle: 8 }, { easing: 'quadOut' }).call(() => this.Audio.AudioSources[4].play());

    // 停留
    seq = seq.delay(WheelThreeConfig.delayPointerSwing); // 高點停留時間

    // 第 16 下：補進終點回正
    // 最後：先被「頂上去」再回正
    seq = seq
      .to(WheelThreeConfig.reboundTime * 1.4, { angle: 40 }, { easing: 'quadOut' }) //
      .to(WheelThreeConfig.reboundTime * 0.8, { angle: 0 }, { easing: 'quadIn' }); // ➡️ 再回正

    seq.call(() => console.log('✅ 指針動畫3完成')).start();
  }

  //! 指針動畫2
  playPointerSwing2(totalTime: number, slowThreshold: number) {
    if (!this.pivotNode) {
      console.warn('⚠️ pivotNode 未設置，請在 Inspector 拖一個控節點進來！');
      return;
    }
    tween(this.pivotNode).stop();

    const swingAngle = 40; // 最大右擺角度
    const totalSwings = 11; // 總共 10 下
    const slowSwings = 2; // 後段（最後 90°）保留 2 下
    const activeSwings = totalSwings - slowSwings; // 前段下數 = 9

    // 前段時間
    const overshootTime = WheelConfig.lotterSecsL - WheelConfig.reboundTime - WheelConfig.delayPointerSwing;
    const mainSpinTime = overshootTime * slowThreshold;
    const lastSwingTime = overshootTime - mainSpinTime; // 最後 2 下的時間

    // ===== 1) 前段：產生 9 下間隔 (cubicOut 節奏) =====
    const eased: number[] = [];
    for (let i = 0; i <= activeSwings; i++) {
      const progress = i / activeSwings;
      eased.push(Math.pow(progress, 3)); // cubicOut
    }

    // 每下的時間 = 當前 eased - 前一個 eased
    const swingIntervals: number[] = [];
    for (let i = 1; i < eased.length; i++) {
      swingIntervals.push((eased[i] - eased[i - 1]) * mainSpinTime);
    }

    let seq = tween(this.pivotNode);

    // 前 9 下正常擺動
    swingIntervals.forEach((dt, index) => {
      const half = dt / 2;
      const isLast = index === swingIntervals.length - 1;

      seq = seq.to(half, { angle: swingAngle }, { easing: 'quadOut' }).call(() => this.Audio?.AudioSources[4]?.play()); // 播放音效
      if (isLast) {
        // ✨ 最後一下：停留後再回正
        seq = seq
          .to(WheelConfig.delayPointerSwing + 0.3, { angle: 35 }, { easing: 'quadOut' }) // 高點往下 10 度
          .call(() => this.Audio?.AudioSources[4]?.play())
          .delay(WheelConfig.delayPointerSwing) // 高點停留
          .to(WheelConfig.reboundTime, { angle: 0 }, { easing: 'quadOut' });
      } else {
        // 其他下：正常回正
        seq = seq.to(half, { angle: 30 }, { easing: 'quadIn' });
      }
    });
    // console.log('overshootTime', overshootTime);
    // console.log('mainSpinTime', mainSpinTime);
    // console.log('lastSwingTime', lastSwingTime);
    // console.log('sum', mainSpinTime + lastSwingTime);

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }

  //! 指針動畫
  playPointerSwing(totalTime: number, reboundTime: number, holdTime: number = 0.5) {
    if (!this.pivotNode) {
      console.warn('⚠️ pivotNode 未設置，請在 Inspector 拖一個控節點進來！');
      return;
    }
    tween(this.pivotNode).stop();

    const swingAngle = 25; // 最大右擺角度
    const totalSwings = 13; // 擺動次數
    const times: number[] = [];

    // ✅ 前快後慢 (t^n)
    for (let i = 1; i <= totalSwings; i++) {
      const progress = i / totalSwings;
      const eased = Math.pow(progress, 3); // n=3，可調 2~5
      times.push(eased);
    }

    // 計算每一下的時間間隔
    let prev = 0;
    const swingIntervals = times.map((t) => {
      const dt = (t - prev) * totalTime;
      prev = t;
      return dt;
    });

    // ===== Tween 組合 =====
    let seq = tween(this.pivotNode);

    // 1) 前快後慢 → 擺動
    swingIntervals.forEach((dt) => {
      const half = dt / 2;
      seq = seq
        .to(half, { angle: swingAngle }, { easing: 'linear' })
        .call(() => this.Audio.AudioSources[4].play()) // 播放指針音效
        .to(half, { angle: 4 }, { easing: 'linear' });
    });

    // 2) 停住 (和轉盤超轉的 holdTime 同步)
    seq = seq.delay(holdTime);

    // 3) 回正
    seq = seq.to(reboundTime, { angle: 0 }, { easing: 'quadIn' });

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }
}
