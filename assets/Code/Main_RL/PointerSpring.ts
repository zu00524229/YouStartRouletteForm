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

  playPointerSwing(totalTime: number, overshootTime: number = 3.5, reboundTime: number = 1.0) {
    if (!this.pivotNode) {
      console.warn('⚠️ pivotNode 未設置，請在 Inspector 拖一個控節點進來！');
      return;
    }

    console.log('👉 指針動畫觸發，總時間=', totalTime);

    tween(this.pivotNode).stop();

    // 🟢 分配時間：指針前半段用 overshootTime，後半段用 reboundTime
    const swingCount = Math.max(1, Math.floor(overshootTime / (this.swingInterval * 2)));
    const eachSwingTime = overshootTime / swingCount / 2; // 單邊時間
    console.log(`👉 擺動次數 = ${swingCount}, 每次單邊=${eachSwingTime.toFixed(2)}s`);

    let seq = tween(this.pivotNode);

    // ===== 前半：固定時間，靠 easing 做減速感 =====
    for (let i = 0; i < swingCount; i++) {
      seq = seq
        .to(eachSwingTime, { angle: this.swingAngle }, { easing: 'quadOut' }) // 上去
        .to(eachSwingTime, { angle: 0 }, { easing: 'quadIn' }); // 下來
    }

    // ===== 後半：和轉盤 reboundTime 同步 =====
    seq = seq
      .to(reboundTime * 0.4, { angle: this.swingAngle }, { easing: 'quadOut' })
      .to(reboundTime * 0.6, { angle: 0 }, { easing: 'quadIn' })
      .call(() => {
        console.log('✅ 指針動畫完成，最終角度=', this.pivotNode!.angle);
      });

    seq.start();
  }
}
