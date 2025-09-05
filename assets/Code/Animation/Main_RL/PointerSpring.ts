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
  playPointerSwing3(totalTime: number, reboundTime: number) {
    if (!this.pivotNode) return;

    tween(this.pivotNode).stop();

    const swingAngle = 20;
    const totalSwings = 22;

    // easing: 前快後慢
    const times: number[] = [];
    for (let i = 1; i <= totalSwings; i++) {
      const progress = i / totalSwings;
      const eased = Math.pow(progress, 3);
      times.push(eased);
    }

    let prev = 0;
    const swingIntervals = times.map((t) => {
      const dt = (t - prev) * totalTime;
      prev = t;
      return dt;
    });

    let seq = tween(this.pivotNode);

    swingIntervals.forEach((dt, idx) => {
      const half = dt / 2;
      const isLast = idx === totalSwings - 1; // 倒數最後1下
      const isSecondLast = idx === totalSwings - 2; // 倒數第2下
      const isThirdLast = idx === totalSwings - 3; // 倒數第3下
      // const isfourLast = idx === totalSwings - 4;
      // const isfiveLast = idx === totalSwings - 5;
      // const isSixLast = idx === totalSwings - 6;

      if (isThirdLast) {
        // === 倒數第3下：對應盤面「超轉 → 彈回」===
        seq = seq
          .to(half, { angle: 8 }, { easing: 'sineOut' }) // 上擺
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔼 倒數第3下 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 8 }, { easing: 'sineIn' }) // 被彈回
          .call(() => {
            // console.log(`🔽 倒數第3下 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .delay(reboundTime * 1.5);
      } else if (isSecondLast) {
        // === 倒數第2下：對應盤面「推回 target+2°」===
        seq = seq
          .to(half, { angle: 20 }, { easing: 'sineOut' }) // 卡住
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔼 倒數第2下 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 15 }, { easing: 'sineIn' }) // 慢慢回
          .call(() => {
            // console.log(`🔽 倒數第2下 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
        // .delay(reboundTime);
      } else if (isLast) {
        // === 倒數第1下：對應盤面「超轉 → 彈回」===
        seq = seq
          .to(half, { angle: 18 }, { easing: 'sineOut' }) // 上擺
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔼 倒數第3下 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: -5 }, { easing: 'sineIn' }) // 被彈回
          .call(() => {
            // console.log(`🔽 倒數第3下 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .delay(reboundTime * 0.5);
        // 下擺回正會放在最後統一處理
      } else {
        // === 一般擺動 ===
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔼 一般上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 0 }, { easing: 'quartIn' })
          .call(() => {
            // console.log(`🔽 一般下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      }
    });

    // === 最後回正 (和轉盤回正同步) ===
    seq = seq.to(reboundTime * 0.6, { angle: 0 }, { easing: 'quadOut' });

    seq.call(() => console.log('✅ 指針動畫完成')).start();

    // // 前快後慢
    // for (let i = 1; i <= activeSwings; i++) {
    //   times.push(Math.pow(i / totalSwings, 3));
    // }

    // let prev = 0;
    // const swingIntervals = times.map((t) => {
    //   const dt = (t - prev) * fullTime;
    //   prev = t;
    //   return dt;
    // });

    // let seq = tween(this.pivotNode);

    // // 前 14 下：在 40 ↔ 30 間擺動
    // swingIntervals.forEach((dt, i) => {
    //   const half = dt / 2;
    //   if (i === 14) {
    //     seq = seq
    //       .to(half, { angle: swingAngle }, { easing: 'quadOut' })
    //       .call(() => this.Audio.AudioSources[4].play())
    //       .to(half, { angle: 20 }, { easing: 'quadIn' });
    //   } else {
    //     seq = seq
    //       .to(half, { angle: swingAngle }, { easing: 'quadOut' })
    //       .call(() => this.Audio.AudioSources[4].play())
    //       .to(half, { angle: 30 }, { easing: 'quadIn' });
    //   }
    // });

    // // 第 15 下：停在 swingAngle
    // seq = seq.to(WheelThreeConfig.reboundTime * 0.5, { angle: 8 }, { easing: 'quadOut' }).call(() => this.Audio.AudioSources[4].play());

    // // 停留
    // seq = seq.delay(WheelThreeConfig.delayPointerSwing); // 高點停留時間

    // // 第 16 下：補進終點回正
    // // 最後：先被「頂上去」再回正
    // seq = seq
    //   .to(WheelThreeConfig.reboundTime * 1.4, { angle: 40 }, { easing: 'quadOut' }) //
    //   .to(WheelThreeConfig.reboundTime * 0.8, { angle: 0 }, { easing: 'quadIn' }); // ➡️ 再回正

    // seq.call(() => console.log('✅ 指針動畫3完成')).start();
  }

  //! 指針動畫2
  playPointerSwing2(totalTime: number, reboundTime: number, holdTime: number = 0.5) {
    if (!this.pivotNode) return;

    tween(this.pivotNode).stop();

    const swingAngle = 20;
    const totalSwings = 22;

    // easing: 前快後慢
    const times: number[] = [];
    for (let i = 1; i <= totalSwings; i++) {
      const progress = i / totalSwings;
      const eased = Math.pow(progress, 3);
      times.push(eased);
    }

    let prev = 0;
    const swingIntervals = times.map((t) => {
      const dt = (t - prev) * totalTime;
      prev = t;
      return dt;
    });

    let seq = tween(this.pivotNode);

    swingIntervals.forEach((dt, idx) => {
      const half = dt / 2;
      const isLast = idx === totalSwings - 1; // 倒數最後1下
      const isSecondLast = idx === totalSwings - 2; // 倒數第2下
      const isThirdLast = idx === totalSwings - 3; // 倒數第3下
      const isfourLast = idx === totalSwings - 4;
      const isfiveLast = idx === totalSwings - 5;
      const isSixLast = idx === totalSwings - 6;

      if (isLast) {
        // ✅ 倒數最後一下：上擺後停住
        seq = seq
          .delay(holdTime * 1.1)
          .to(half, { angle: 13 }, { easing: 'sineOut' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(最後一下): ${this.pivotNode.angle.toFixed(2)}°`);
          });
        // 下擺到 0 放到最後統一處理
      } else if (isSixLast || isfiveLast || isfourLast) {
        // ✅ 倒數第 6/5/4 下：回擺到 10°
        seq = seq
          .to(half, { angle: 17 }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 0 }, { easing: 'quartIn' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isThirdLast) {
        // ✅ 倒數第3下：固定到 22° → 回到 5°
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 0 }, { easing: 'quartIn' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isSecondLast) {
        // ✅ 倒數第2下：縮到 5° 並停頓
        seq = seq
          .to(half, { angle: 7 }, { easing: 'sineOut' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 7 }, { easing: 'sineIn' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .delay(reboundTime);
      } else {
        // ✅ 一般擺動：21° ↔ 0°
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(一般): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 0 }, { easing: 'quartIn' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束(一般): ${this.pivotNode.angle.toFixed(2)}°`);
          });
      }
    });

    // === 最後回正 (和轉盤回正同步) ===
    seq = seq.to(reboundTime, { angle: 0 }, { easing: 'quadIn' });

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }

  //! 指針動畫
  playPointerSwing(totalTime: number, reboundTime: number, holdTime: number = 0.5) {
    if (!this.pivotNode) return;

    tween(this.pivotNode).stop();

    const swingAngle = 21;
    const totalSwings = 22;

    // easing: 前快後慢
    const times: number[] = [];
    for (let i = 1; i <= totalSwings; i++) {
      const progress = i / totalSwings;
      const eased = Math.pow(progress, 3);
      times.push(eased);
    }

    let prev = 0;
    const swingIntervals = times.map((t) => {
      const dt = (t - prev) * totalTime;
      prev = t;
      return dt;
    });

    let seq = tween(this.pivotNode);

    swingIntervals.forEach((dt, idx) => {
      const half = dt / 2;
      const isfourLast = idx === totalSwings - 4;
      const isThirdLast = idx === totalSwings - 3; // 倒數第3下
      const isSecondLast = idx === totalSwings - 2; // 倒數第2下
      const isLast = idx === totalSwings - 1; // 倒數最後1下

      if (isLast) {
        // ✅ 倒數最後一下：上擺後停住
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'sineOut' })
          .call(() => this.Audio.AudioSources[4].play())
          .delay(1.5); // 在上擺位置停
        // 下擺到 0 會放到最後統一處理
      } else if (isfourLast) {
        // ✅ 倒數第4下：上擺小一點
        seq = seq
          .to(half, { angle: 18 }, { easing: 'sineOut' }) // 緩慢上擺
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(緩慢): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 0 }, { easing: 'quartIn' }) // 回到 0
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isThirdLast) {
        // ✅ 倒數第3下：固定到 22°
        seq = seq
          .to(half, { angle: 25 }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 15 }, { easing: 'quartIn' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isSecondLast) {
        // ✅ 倒數第2下：固定到 22°
        seq = seq
          .to(half, { angle: 22 }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 22 }, { easing: 'quartIn' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else {
        // ✅ 一般擺動
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 0 }, { easing: 'quartIn' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      }
    });

    // === 最後回正 (和轉盤回正同步) ===
    seq = seq.to(reboundTime, { angle: 0 }, { easing: 'quadIn' });

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }

  // 'linear'、'expoOut'
}
