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
    const totalSwings = 60;
    const superSlowOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const smoothstep = (x: number) => x * x * (3 - 2 * x);
    const customEase = (t: number) => {
      const fast = t; // 高速
      const slow = 1 - Math.pow(1 - t, 3.5); // 降速
      const blend = smoothstep(Math.min(t / 0.2, 1)); // 在前20%漸進轉換
      return fast * (1 - blend) + slow * blend;
    };

    // easing: 前快後慢
    const times: number[] = [];
    for (let i = 1; i <= totalSwings; i++) {
      const progress = i / totalSwings;
      // const eased = Math.pow(progress, 3);
      // const eased = 1 - superSlowOut(1 - progress); // 套用轉盤降速公式
      // const eased = 1 - customEase(1 - progress);
      const eased = Math.pow(1 - customEase(1 - progress), 1.2);

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
      const fromEnd = totalSwings - idx; // 倒數第幾下
      let lastTime = Date.now();
      switch (true) {
        case idx === 0: {
          // 第一次上擺：慢起快到，有啟動爆發感
          const firstHalf = totalTime * 0.01;
          seq = seq
            .to(firstHalf, { angle: swingAngle + 8 }, { easing: 'sineIn' })
            .call(() => {
              // console.log(`🔼 第一次上擺: 倒數${fromEnd}下, 角度=${this.pivotNode.angle.toFixed(2)}°`);
              this.Audio.AudioSources[4].play();
            })
            .to(firstHalf, { angle: 30 }, { easing: 'quartIn' })
            .call(() => {
              // console.log(`🔽 第一次下擺: 倒數${fromEnd}下, 角度=${this.pivotNode.angle.toFixed(2)}°`);
            });
          break;
        }
        case fromEnd === 1: {
          // 倒數最後一下：上擺後停住
          seq = seq
            .to(half, { angle: swingAngle - 5 }, { easing: 'sineOut' })
            .call(() => {
              // console.log(`🔼 倒數${fromEnd}下 最後上擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
              // console.log(`⏸️ 即將停留 ${holdTime * 40.2}s`);
            })
            .delay(holdTime * 5.5) // 在上擺位置停
            .to(half * 25.0, { angle: 0 }, { easing: 'sineInOut' }) // 下擺
            .call(() => {
              // console.log(`▶️ 停留結束 (${holdTime * 40.2}s)，開始下擺`);
              // console.log(`🔽 倒數${fromEnd}下 下擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
            });
          break;
        }
        case fromEnd === 9 || fromEnd === 10 || fromEnd === 11 || fromEnd === 12: {
          seq = seq
            .to(half * 0.8, { angle: swingAngle - 3 }, { easing: 'sineOut' })
            .call(() => {
              // console.log(`🔼 倒數${fromEnd}下 上擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
            })
            // .delay(holdTime * 1.2) // 在上擺位置停
            .to(half * 0.5, { angle: 25 }, { easing: 'sineInOut' }) // 下擺
            .call(() => {
              // console.log(`🔽 倒數${fromEnd}下 下擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
              this.Audio.AudioSources[4].play();
            });
          break;
        }
        case fromEnd === 5 || fromEnd === 6 || fromEnd === 7 || fromEnd === 8: {
          seq = seq
            .to(half, { angle: swingAngle - 5 }, { easing: 'sineOut' })
            .call(() => {
              // console.log(`🔼 倒數${fromEnd}下 上擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
            })
            .to(half * 0.7, { angle: 25 }, { easing: 'sineInOut' }) // 下擺
            .call(() => {
              // console.log(`🔽 倒數${fromEnd}下 下擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
              this.Audio.AudioSources[4].play();
            });
          break;
        }
        case fromEnd === 4: {
          seq = seq
            .to(half, { angle: 35 }, { easing: 'sineOut' })
            .call(() => {
              // console.log(`🔼 倒數${fromEnd}下 上擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
            })
            .to(half * 0.8, { angle: 30 }, { easing: 'sineInOut' }) // 下擺
            .call(() => {
              // console.log(`🔽 倒數${fromEnd}下 下擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
              this.Audio.AudioSources[4].play();
            });
          break;
        }
        case fromEnd === 3: {
          seq = seq
            .to(half * 0.7, { angle: 20 }, { easing: 'sineOut' })
            .delay(0.2)
            .call(() => {
              // console.log(`🔼 倒數${fromEnd}下 上擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
              this.Audio.AudioSources[4].play();
            })
            .to(half * 3.5, { angle: 35 }, { easing: 'sineInOut' }) // 下擺
            .call(() => {
              // console.log(`🔽 倒數${fromEnd}下 下擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
            });
          break;
        }
        case fromEnd === 2: {
          seq = seq
            .to(half * 3.5, { angle: swingAngle - 5 }, { easing: 'sineOut' })
            .call(() => {
              // console.log(`🔼 倒數${fromEnd}下 上擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
            })
            .to(half, { angle: 35 }, { easing: 'sineInOut' }) // 下擺
            .call(() => {
              // console.log(`🔽 倒數${fromEnd}下 下擺結束: 角度=${this.pivotNode.angle.toFixed(2)}°`);
              // this.Audio.AudioSources[4].play();
            });
          break;
        }
        default: {
          // 一般擺動
          seq = seq
            .to(half * 0.95, { angle: swingAngle }, { easing: 'linear' })
            .call(() => {
              // console.log(`🔼 一般上擺結束: 倒數${fromEnd}下, 角度=${this.pivotNode.angle.toFixed(2)}°`);
            })
            .to(half, { angle: 30 }, { easing: 'quartIn' })
            .call(() => {
              // console.log(`🔽 一般下擺結束: 倒數${fromEnd}下, 角度=${this.pivotNode.angle.toFixed(2)}°`);
              this.Audio.AudioSources[4].play();
            });
        }
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
    const totalSwings = 70;
    const superSlowOut = (t: number) => 1 - Math.pow(1 - t, 3); // 自訂 easing：越到尾端越慢
    const superlow = (t: number) => 1 - Math.pow(1 - t, 3); // 自訂 (1 - t, 2)  數字越高 頻率降得越快(慢)

    // 如讓前 70% 幾乎線性，最後 30% 再慢下來：
    // let eased;
    // if (progress < 0.7) {
    //   eased = progress * 0.7; // 幾乎線性
    // } else {
    //   const sub = (progress - 0.7) / 0.3; // 映射到 [0,1]
    //   eased = 0.7 + Math.pow(sub, 3) * 0.3;
    // }
    // easing: 前快後慢
    const times: number[] = [];
    for (let i = 1; i <= totalSwings; i++) {
      const progress = i / totalSwings;
      // const eased = Math.pow(progress, 5); // 更靠近尾端才慢,可調7,9 。
      const eased = 1 - superlow(1 - progress); // 套用轉盤降速公式
      times.push(eased);
    }

    let prev = 0;
    const swingIntervals = times.map((t) => {
      const dt = (t - prev) * totalTime;
      prev = t;
      return dt;
    });

    let seq = tween(this.pivotNode);
    // const superSlowlow = (t: number) => 1 - Math.pow(1 - t, 6);

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
          .to(firstHalf, { angle: swingAngle + 5 }, { easing: 'sineIn' })
          .call(() => this.Audio.AudioSources[4].play())
          .to(firstHalf, { angle: 35 }, { easing: 'quartIn' });
      } else if (isLast) {
        // ✅ 倒數最後一下：上擺後停住
        seq = seq
          .delay(holdTime)
          .to(half, { angle: swingAngle }, { easing: 'sineOut' })
          .call(() => {
            // this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(最後一下): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half * 7.0, { angle: 0 }, { easing: superSlowOut }) //quartIn  half * 4.55
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
        // 下擺到 0 放到最後統一處理
      } else if (isSixLast) {
        // ✅ 倒數第5下
        seq = seq
          .to(half * 2.0, { angle: swingAngle }, { easing: 'sineOut' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          // .delay(reboundTime + 0.2)
          .to(half * 0.5, { angle: 40 }, { easing: 'sineIn' })
          .call(() => {
            // this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isThirdLast || isfourLast || isfiveLast) {
        // ✅ 倒數第 3 4 5下
        seq = seq
          .to(half * 0.5, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half * 0.5, { angle: 40 }, { easing: 'quartInOut' })
          .call(() => {
            // this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else if (isSecondLast) {
        // ✅ 倒數第2下
        seq = seq
          .to(half * 2.0, { angle: swingAngle }, { easing: 'sineOut' }) //7
          .call(() => {
            console.log(`第 ${idx + 1} 下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          // .delay(reboundTime + 0.2)
          .to(half * 0.1, { angle: 40 }, { easing: 'sineIn' }) //7
          .call(() => {
            // this.Audio.AudioSources[4].play();
            console.log(`第 ${idx + 1} 下 🔽 下擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          });
      } else {
        // ✅ 一般擺動
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'linear' })
          .call(() => {
            this.Audio.AudioSources[4].play();
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(一般): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 30 }, { easing: 'quartInOut' })
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
    const totalSwings = 70;

    const superSlowOut = (t: number) => 1 - Math.pow(1 - t, 3); // 自訂 easing：越到尾端越慢

    // easing: 前快後慢
    const times: number[] = [];
    for (let i = 1; i <= totalSwings; i++) {
      const progress = i / totalSwings;
      // const eased = Math.pow(progress, 3);
      const eased = 1 - superSlowOut(1 - progress); // 套用轉盤降速公式
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
          .to(firstHalf, { angle: 30 }, { easing: 'quartIn' });
      } else if (isLast) {
        // ✅ 倒數最後一下：上擺後停住
        seq = seq
          .to(half, { angle: swingAngle - 5 }, { easing: 'sineOut' })
          .delay(holdTime * 1.2) // 在上擺位置停
          // .call(() => this.Audio.AudioSources[4].play())
          .to(half * 10.5, { angle: 0 }, { easing: 'sineInOut' }); // 下擺
        // 下擺到 0 會放到最後統一處理
      } else if (isfourLast) {
        // ✅ 倒數第4下：上擺小一點
        seq = seq
          .to(half, { angle: swingAngle }, { easing: 'sineOut' }) // 緩慢上擺
          .call(() => {
            // console.log(`第 ${idx + 1} 下 🔼 上擺結束(緩慢): ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 35 }, { easing: 'quartIn' })
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
          .to(half * 2.0, { angle: swingAngle - 5 }, { easing: 'linear' })
          .call(() => {
            // console.log(`第 ${idx + 1} 倒數地 2下 🔼 上擺結束: ${this.pivotNode.angle.toFixed(2)}°`);
          })
          .to(half, { angle: 35 }, { easing: 'quartIn' })
          .call(() => {
            // this.Audio.AudioSources[4].play();
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
