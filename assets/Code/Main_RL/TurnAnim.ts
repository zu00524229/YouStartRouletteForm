import { _decorator, CCInteger, Collider2D, Component, Node, tween } from 'cc';
import { SIGNALR_EVENTS, UnifiedLotteryEvent } from '../Type/Types';
import { PointerAnim } from './PointerSpring';

const { ccclass, property } = _decorator;

function slowLast90(t: number, startAngle: number, finalTarget: number): number {
  const totalAngle = Math.abs(finalTarget - startAngle);
  const slowThreshold = (totalAngle - 90) / totalAngle; // 最後 90° 進入區間

  if (t <= slowThreshold) {
    // 前段：正常 cubicOut
    return 1 - Math.pow(1 - t, 3);
  } else {
    // 後段：normalize 到 0~1
    const localT = (t - slowThreshold) / (1 - slowThreshold);

    // 前段結束時的值 (銜接點)
    const startValue = 1 - Math.pow(1 - slowThreshold, 3);

    // 後段 easing（更慢，用 quadOut）
    const endValue = 1.0;
    const eased = localT * (2 - localT); // quadOut

    // 線性插值：從 startValue → endValue
    return startValue + (endValue - startValue) * eased;
  }
}

@ccclass('TurnAnim')
export class TurnAnim extends Component {
  @property(PointerAnim) poin: PointerAnim = null; // 🎯 拖拽連結場景上的指針
  @property(Node) turnBgNode: Node = null; //
  @property(Node) dotContainerNode: Node = null; // 指針容器節點

  @property(CCInteger) rewardTypeCount: number = 50; // 轉盤中獎品分區數量
  @property(CCInteger) rotatelottertSecs: number = 5; // 轉盤動畫旋轉次數
  @property(CCInteger) lotterSecsL: number = 7; // 抽獎動畫持續時間

  // TurnLottery.ts

  // 播放轉盤動畫
  // let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
  // console.log("✅ turnBgNode 是否為 null：", this.turnBgNode);  // 這裡先驗證
  // console.log("🎯 準備轉盤角度", targetAngle);
  // this.turnBgNode.angle %= 360;   // 隨機角度初始化

  //! 播放轉盤動畫2
  playWheelAnimation2(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    // 初始化角度
    this.turnBgNode.angle %= 360;

    const startAngle = this.turnBgNode.angle; // ✅ 定義開始角度
    // 計算最終目標角度
    let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
    console.log('🎯 準備轉盤角度', targetAngle);

    //? 超轉設定
    let overshoot = 10; // 超過目標的角度
    let overshootAngle = targetAngle - overshoot;
    //? 時間分配
    let overshootTime = this.lotterSecsL - 1.0; // 超轉時間
    let reboundTime = 1.0; // 回正時間

    // 找到指針動畫2
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      const totalAngle = Math.abs(overshootAngle - startAngle);
      const slowThreshold = (totalAngle - 90) / totalAngle; // 0~1 區間
      pointer.playPointerSwing2(this.lotterSecsL, slowThreshold);
    }

    tween(this.turnBgNode)
      // 前段：到 overshootAngle，帶 slowLast90 曲線
      .to(
        overshootTime,
        { angle: overshootAngle },
        {
          easing: (t) => slowLast90(t, startAngle, overshootAngle),
        }
      )
      // ✨ 停留  秒（可調整）
      .delay(this.poin.Deley_PointerWing2)
      // 後段：從 overshootAngle 回 targetAngle
      .to(reboundTime, { angle: targetAngle }, { easing: 'quadOut' })
      .call(() => onFinished?.())
      .start();
  }

  //! 轉盤動畫1
  playWheelAnimation(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    // 先初始化轉盤角度，避免累積太多旋轉角度
    this.turnBgNode.angle %= 360;

    // 計算最終目標角度
    let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
    console.log('🎯 準備轉盤角度', targetAngle);

    // 設定超轉角度（轉過頭一點）
    let overshoot = 10; // 10 度超過目標（可調整）
    let overshootAngle = targetAngle - overshoot;

    // 分段時間控制
    let overshootTime = this.lotterSecsL - 3.5;
    let reboundTime = 1.0;

    // 找到指針組件
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      pointer.playPointerSwing(this.lotterSecsL, overshootTime, reboundTime); // 傳入轉盤持續時間，讓指針擺動時間一致
    }

    tween(this.turnBgNode)
      .to(overshootTime, { angle: overshootAngle }, { easing: 'cubicOut' }) //  從超過的位置 → 回到正確格子 (targetAngle)
      .to(reboundTime, { angle: targetAngle }, { easing: 'quadInOut' }) // quadInOut 平滑進出，像彈簧收尾
      .call(() => {
        if (onFinished) onFinished();
      })
      .start();
  }
}
