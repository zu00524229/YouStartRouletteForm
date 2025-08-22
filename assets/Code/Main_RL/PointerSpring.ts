import { _decorator, Component, Node, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PointerAnim')
export class PointerAnim extends Component {
  @property(Node)
  pivotNode: Node | null = null; // 🎯 旋轉軸心（拖指針的控節點進來）

  @property
  swingAngle: number = 45; // 最大右擺角度

  @property
  swingInterval: number = 0.15; // 每次來回時間（越小越快）

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

    console.log(
      '👉 前 9 下間隔 =',
      swingIntervals.map((v) => v.toFixed(2))
    );

    // ===== Tween 組合 =====
    let seq = tween(this.pivotNode);

    // 1) 前 9 下正常擺動
    swingIntervals.forEach((dt) => {
      const half = dt / 2;
      seq = seq.to(half, { angle: this.swingAngle }, { easing: 'quadOut' }).to(half, { angle: 0 }, { easing: 'quadIn' });
    });

    // 2) 第 10 下：到 swingAngle 停住
    seq = seq.to(1.0, { angle: this.swingAngle }, { easing: 'quadOut' }); // 這裡時間可微調

    // 3) 第 11 下：用 reboundTime 回正
    seq = seq.to(reboundTime, { angle: 0 }, { easing: 'quadInOut' });

    seq.call(() => console.log('✅ 指針動畫完成')).start();
  }
}
