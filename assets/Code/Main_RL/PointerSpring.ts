import { _decorator, Component, Node, tween } from 'cc';
import { AudioManager } from '../Audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('PointerAnim')
export class PointerAnim extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  @property(Node)
  pivotNode: Node | null = null; // 🎯 旋轉軸心（拖指針的控節點進來）

  @property
  swingAngle: number = 40; // 最大右擺角度

  @property
  swingInterval: number = 0.15; // 每次來回時間（越小越快）

  Deley_PointerWing2 = 0.5; // 指針動畫2高點停留

  //! 指針動畫2
  playPointerSwing2(totalTime: number, slowThreshold: number) {
    if (!this.pivotNode) {
      console.warn('⚠️ pivotNode 未設置，請在 Inspector 拖一個控節點進來！');
      return;
    }
    tween(this.pivotNode).stop();

    const totalSwings = 11; // 總共 10 下
    const slowSwings = 2; // 後段（最後 90°）保留 2 下
    const activeSwings = totalSwings - slowSwings; // 前段下數 = 9

    // 根據 slowThreshold 拆分時間
    const mainSpinTime = totalTime * slowThreshold;
    const slowSpinTime = totalTime * (1 - slowThreshold);

    // ===== 1) 前段：產生 9 下間隔 (cubicOut 節奏) =====
    const eased: number[] = [];
    for (let i = 0; i <= activeSwings; i++) {
      const progress = i / activeSwings;
      eased.push(Math.pow(progress, 3)); // cubicOut
    }

    // 每下的時間 = 當前 eased - 前一個 eased
    const swingIntervals = [];
    for (let i = 1; i < eased.length; i++) {
      swingIntervals.push((eased[i] - eased[i - 1]) * mainSpinTime);
    }

    console.log(
      '👉 前 9 下間隔 =',
      swingIntervals.map((v) => v.toFixed(2))
    );

    let seq = tween(this.pivotNode);

    // 前 9 下正常擺動
    swingIntervals.forEach((dt, index) => {
      const half = dt / 2;
      const isLast = index === swingIntervals.length - 1;

      seq = seq.to(half, { angle: this.swingAngle }, { easing: 'quadOut' }).call(() => this.Audio?.AudioSources[5]?.play()); // 播放音效
      if (isLast) {
        // ✨ 最後一下：停留後再回正
        seq = seq
          .delay(this.Deley_PointerWing2) // 高點停留
          .to(0.6, { angle: 0 }, { easing: 'quadInOut' });
      } else {
        // 其他下：正常回正
        seq = seq.to(half, { angle: 0 }, { easing: 'quadIn' });
      }
    });

    // // ===== 最後一下：停留在最高點 → 再回正 =====
    // seq = seq
    //   .to(slowSpinTime * 0.4, { angle: this.swingAngle }, { easing: 'quadOut' }) // 上去並停留
    //   .call(() => this.Audio?.AudioSources[5]?.play()) // 最後一次音效
    //   .delay(0.2) // 🛑 停留一下
    //   .to(slowSpinTime * 0.6, { angle: 0 }, { easing: 'quadInOut' }); // 再慢慢回正

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }

  //! 指針動畫
  playPointerSwing(totalTime: number, overshootTime: number = 3.5, reboundTime: number = 1.0) {
    if (!this.pivotNode) {
      console.warn('⚠️ pivotNode 未設置，請在 Inspector 拖一個控節點進來！');
      return;
    }
    tween(this.pivotNode).stop();

    // 🔑 總時間必須跟轉盤一樣 = overshootTime + reboundTime
    const fullTime = overshootTime + reboundTime;

    const totalSwings = 11; // 你要 11 下
    const activeSwings = 9; // 前面正常擺動
    const times: number[] = []; // 產生 9 下的間隔 (前快後慢)

    // 用 easing 模擬前快後慢的效果
    for (let i = 1; i <= activeSwings; i++) {
      const progress = i / totalSwings;
      const eased = Math.pow(progress, 3); // ✅ 前快後慢
      times.push(eased);
    }

    // 每下的間隔 = 當前 easd - 上一個 eased
    let prev = 0;
    const swingIntervals = times.map((t) => {
      const dt = (t - prev) * fullTime;
      prev = t;
      return dt;
    });

    // ===== Tween 組合 =====
    let seq = tween(this.pivotNode);

    // 1) 前 9 下正常擺動
    swingIntervals.forEach((dt) => {
      const half = dt / 2;
      seq = seq
        .to(half, { angle: this.swingAngle }, { easing: 'quadOut' })
        .call(() => this.Audio.AudioSources[5].play()) // 播放指針音效
        .to(half, { angle: 0 }, { easing: 'quadIn' });
    });

    // 2) 第 10 下：到 swingAngle 停住// 這裡時間可微調 停留時間
    seq = seq.to(1.0, { angle: this.swingAngle }, { easing: 'quadOut' }).call(() => this.Audio.AudioSources[5].play()); // 播放指針音效;

    // 3) 第 11 下：用 reboundTime 回正
    seq = seq.to(reboundTime, { angle: 0 }, { easing: 'quadInOut' });

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }
}
