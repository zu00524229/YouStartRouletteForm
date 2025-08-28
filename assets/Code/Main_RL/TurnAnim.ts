import { _decorator, CCInteger, Collider2D, Component, Node, tween } from 'cc';
import { SIGNALR_EVENTS, UnifiedLotteryEvent } from '../Type/Types';
import { PointerAnim } from './PointerSpring';
import { WheelConfig, WheelSyncConfig, WheelThreeConfig } from './WheelConfig'; // 引入 轉盤指針動畫同步變數

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
  // @property(CCInteger) lotterSecsL: number = 7; // 抽獎動畫持續時間

  // TurnLottery.ts

  // 播放轉盤動畫
  // let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
  // console.log("✅ turnBgNode 是否為 null：", this.turnBgNode);  // 這裡先驗證
  // console.log("🎯 準備轉盤角度", targetAngle);
  // this.turnBgNode.angle %= 360;   // 隨機角度初始化

  //! 轉盤動畫3
  playWheelAnimation3(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    this.turnBgNode.angle %= 360;
    // const startAngle = this.turnBgNode.angle;

    // 最終目標角度
    let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);

    console.log('🎯 準備轉盤角度', targetAngle);

    // 🎯 提前停在終點前 preStopAngle
    let preStopAngle = targetAngle + WheelThreeConfig.preStopAngle;

    // 時間切分
    let preStopTime = WheelThreeConfig.lotterSecsL - WheelThreeConfig.reboundTime;
    let reboundTime = WheelThreeConfig.reboundTime;
    let delay = WheelThreeConfig.delayPointerSwing;

    let fullTime = preStopTime + delay + reboundTime; // 總時間 = 前段 + 停留 + 回正;

    // 找到指針動畫
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      pointer.playPointerSwing3(fullTime);
    }

    tween(this.turnBgNode)
      // 前段：到終點前角度（幾乎停下）
      .to(preStopTime, { angle: preStopAngle }, { easing: 'cubicOut' })
      .delay(WheelThreeConfig.delayPointerSwing) // 停留時間

      // 第二段：往回「過頭」一點 (像是被指針卡住往回甩)
      .to(reboundTime * 2.0, { angle: preStopAngle - 10 }, { easing: 'quadOut' })

      // 身為被指針往回推
      .to(reboundTime * 0.8, { angle: targetAngle + 2.0 }, { easing: 'quadOut' })

      // 後段：再補進終點
      .to(reboundTime * 0.6, { angle: targetAngle }, { easing: 'quadInOut' })
      .call(() => onFinished?.())
      .start();
  }

  //! 轉盤動畫2
  playWheelAnimation2(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    // 初始化角度
    this.turnBgNode.angle %= 360;

    const startAngle = this.turnBgNode.angle; // ✅ 定義開始角度
    // 計算最終目標角度
    let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
    console.log('🎯 準備轉盤角度', targetAngle);

    //? 超轉設定
    let overshootAngle = targetAngle - WheelConfig.overshootAngle;
    //? 時間分配
    let overshootTime = WheelConfig.lotterSecsL - WheelConfig.reboundTime - WheelConfig.delayPointerSwing;
    let reboundTime = WheelConfig.reboundTime;
    let fullTime = WheelConfig.lotterSecsL;

    // 找到指針動畫2
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      const totalAngle = Math.abs(overshootAngle - startAngle);
      const slowThreshold = (totalAngle - 90) / totalAngle;
      pointer.playPointerSwing2(fullTime, slowThreshold);
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
      .delay(WheelConfig.delayPointerSwing)
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
    let overshootAngle = targetAngle - WheelSyncConfig.overshootAngle;

    // 分段時間控制
    let overshootTime = WheelSyncConfig.lotterSecsL - WheelSyncConfig.overshootTime;
    let reboundTime = WheelSyncConfig.reboundTime;

    // 找到指針組件
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      pointer.playPointerSwing(overshootTime, reboundTime); // 傳入轉盤持續時間，讓指針擺動時間一致
    }

    tween(this.turnBgNode)
      .to(overshootTime, { angle: overshootAngle }, { easing: 'cubicOut' }) //  從超過的位置 → 回到正確格子 (targetAngle)
      .to(WheelSyncConfig.reboundTime, { angle: targetAngle }, { easing: 'quadInOut' }) // quadInOut 平滑進出，像彈簧收尾
      .call(() => {
        if (onFinished) onFinished();
      })
      .start();
  }
}
