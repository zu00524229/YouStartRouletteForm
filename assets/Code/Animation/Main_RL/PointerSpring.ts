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
  playPointerSwing3(totalTime: number, reboundTime: number, holdTime: number) {
    if (!this.pivotNode) return;

    tween(this.pivotNode).stop();

    const swingAngle = 40;
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
      // const isfiveLast = idx === totalSwings - 5;
      // const isSixLast = idx === totalSwings - 6;

      if (idx == 0) {
        // 第一次上擺：慢起快到，有啟動爆發感
        const firstHalf = totalTime * 0.01;
        seq = seq
          .to(firstHalf, { angle: swingAngle + 8 }, { easing: 'sineIn' })
          .call(() => this.Audio.AudioSources[4].play())
          .to(firstHalf, { angle: 35 }, { easing: 'quartIn' });
      } else if (isfourLast) {
        // === 倒數第4下
        seq = seq
          .to(half * 0.8, { angle: swingAngle }, { easing: 'sineOut' }) // 上擺
          .call(() => {
            // console.log(`🔼 倒數第4下 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 35 }, { easing: 'sineIn' }) // 被彈回
          // .delay(0.8)
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔽 倒數第4下 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isThirdLast) {
        // === 倒數第3下：對應盤面「超轉 → 彈回」===
        seq = seq
          .to(half * 0.6, { angle: swingAngle - 5 }, { easing: 'sineOut' }) // 上擺
          .call(() => {
            // console.log(`🔼 倒數第3下 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half * 0.7, { angle: 15 }, { easing: 'sineIn' }) // 被彈回
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔽 倒數第3下 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
        // .delay(1.0);
      } else if (isSecondLast) {
        // 倒數第2下
        seq = seq
          .to(half * 0.65, { angle: 37 }, { easing: 'sineOut' }) // 上擺
          .delay(0.2)
          .call(() => {
            // console.log(`🔼 倒數第2下 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 20 }, { easing: 'sineIn' }) // 被彈回
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔽 倒數第2下 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
        // .delay(0.1);
      } else if (isLast) {
        // === 倒數第1下：對應盤面「超轉 → 彈回」===
        seq = seq
          .to(half, { angle: 10 }, { easing: 'sineOut' }) // 卡住
          // .delay(0.5)
          .call(() => {
            // console.log(`🔼 倒數第1下 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: -3 }, { easing: 'sineIn' }) // 慢慢回
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔽 倒數第1下 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else {
        // === 一般擺動 ===
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            // console.log(`🔼 一般上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 30 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`🔽 一般下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      }
    });

    // === 最後回正 (和轉盤回正同步) ===
    seq = seq.to(reboundTime * 0.6, { angle: 0 }, { easing: 'quadOut' });

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }

  //! 指針動畫2
  playPointerSwing2(totalTime: number, reboundTime: number, holdTime: number) {
    if (!this.pivotNode) return;

    tween(this.pivotNode).stop();

    const swingAngle = 40; // 上擺 最高角度
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

      if (idx == 0) {
        // 第一次上擺：慢起快到，有啟動爆發感
        const firstHalf = totalTime * 0.01;
        seq = seq
          .to(firstHalf, { angle: swingAngle + 8 }, { easing: 'sineIn' })
          .call(() => this.Audio.AudioSources[4].play())
          .to(firstHalf, { angle: 35 }, { easing: 'quartIn' });
      } else if (isLast) {
        // ✅ 倒數最後一下：上擺後停住
        seq = seq
          // .delay(holdTime)
          .to(half * 0.6, { angle: swingAngle }, { easing: 'sineOut' })
          .call(() => {
            // this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(最後一下): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half * 2.2, { angle: 0 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
        // 下擺到 0 放到最後統一處理
      } else if (isSixLast || isfiveLast || isfourLast) {
        // ✅ 倒數第 6/5/4 下：回擺到 10°
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 25 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isThirdLast) {
        // ✅ 倒數第3下
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 35 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isSecondLast) {
        // ✅ 倒數第2下
        seq = seq
          .to(half, { angle: 37 }, { easing: 'sineOut' }) //7
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          // .delay(reboundTime + 0.2)
          .to(half, { angle: 40 }, { easing: 'sineIn' }) //7
          .call(() => {
            // this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else {
        // ✅ 一般擺動：21° ↔ 0°
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(一般): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 30 }, { easing: 'quartIn' })
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

    const swingAngle = 40;
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

      if (idx == 0) {
        // 第一次上擺：慢起快到，有啟動爆發感
        const firstHalf = totalTime * 0.01;
        seq = seq
          .to(firstHalf, { angle: swingAngle + 8 }, { easing: 'sineIn' })
          .call(() => this.Audio.AudioSources[4].play())
          .to(firstHalf, { angle: 35 }, { easing: 'quartIn' });
      } else if (isLast) {
        // ✅ 倒數最後一下：上擺後停住
        seq = seq
          .to(half, { angle: swingAngle - 5 }, { easing: 'sineOut' })
          .delay(holdTime * 2.25) // 在上擺位置停
          // .call(() => this.Audio.AudioSources[4].play())
          .to(half * 3.0, { angle: 0 }, { easing: 'sineInOut' }); // 下擺
        // 下擺到 0 會放到最後統一處理
      } else if (isfourLast) {
        // ✅ 倒數第4下：上擺小一點
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'sineOut' }) // 緩慢上擺
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(緩慢): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 30 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isThirdLast) {
        // ✅ 倒數第3下：固定到 22°
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            // console.log(`第 ${idx + 1} 倒數第 3下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 25 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 倒數地 3下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isSecondLast) {
        // ✅ 倒數第2下：固定到 22°
        seq = seq
          .to(half, { angle: 40 }, { easing: 'linear' })
          .call(() => {
            // console.log(`第 ${idx + 1} 倒數地 2下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 25 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 倒數地 2下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else {
        // ✅ 一般擺動
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 30 }, { easing: 'quartIn' })
          .call(() => {
            this.Audio.AudioSources[4].play();
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
