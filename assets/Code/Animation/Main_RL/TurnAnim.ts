import { _decorator, CCInteger, Collider2D, Component, Node, tween } from 'cc';
import { SIGNALR_EVENTS, UnifiedLotteryEvent } from '../../Type/Types';
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

  //! 轉盤動畫3
  playWheelAnimation3(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    const rotatelottertSecs = 10; // 轉圈數
    this.turnBgNode.angle %= 360;
    // const startAngle = this.turnBgNode.angle;

    // 最終目標角度
    let targetAngle = -rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);

    // console.log('🎯 準備轉盤角度', targetAngle);

    // 設定超轉角度（轉過頭一點）
    let overshootAngle = targetAngle - WheelThreeConfig.overshootAngle;

    // 時間切分
    const totalTime = WheelConfig.lotterSecsL; // 總秒數
    let preStopTime = WheelThreeConfig.lotterSecsL - WheelThreeConfig.reboundTime;
    let reboundTime = WheelThreeConfig.reboundTime;
    let delay = WheelThreeConfig.delayPointerSwing;
    const holdTime = 0.05;

    let fullTime = preStopTime + delay + reboundTime; // 總時間 = 前段 + 停留 + 回正;
    // 自訂 easing：越到尾端越慢
    const superSlowOut = (t: number) => 1 - Math.pow(1 - t, 1.5);

    const smoothstep = (x: number) => x * x * (3 - 2 * x);
    const customEase = (t: number) => {
      const fast = t; // 高速
      const slow = 1 - Math.pow(1 - t, 3.5); // 降速
      const blend = smoothstep(Math.min(t / 0.2, 1)); // 在前20%漸進轉換
      return fast * (1 - blend) + slow * blend;
    };

    // 找到指針動畫
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      pointer.playPointerSwing3(fullTime, reboundTime);
    }

    tween(this.turnBgNode)
      // 1) 一路旋轉到 overshootAngle，用自訂 easing
      .to(totalTime, { angle: overshootAngle }, { easing: customEase })

      // 2) 停住
      .delay(holdTime)

      // 3) 回正
      .to(reboundTime * 1.5, { angle: targetAngle }, { easing: 'quadIn' })

      .call(() => onFinished?.())
      .start();
  }

  //! 轉盤動畫2
  playWheelAnimation2(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    const rotatelottertSecs = 7; // 轉圈數
    // 先初始化轉盤角度，避免累積太多旋轉角度
    this.turnBgNode.angle %= 360;

    // 計算最終目標角度
    let targetAngle = -rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
    // console.log('🎯 準備轉盤角度', targetAngle);

    // 設定超轉角度（轉過頭一點）
    let overshootAngle = targetAngle - WheelConfig.overshootAngle;

    // 時間控制
    const totalTime = WheelConfig.lotterSecsL;
    const reboundTime = WheelConfig.reboundTime;
    const holdTime = 0.1; // 停留秒數（可調整）

    // 自訂 easing：越到尾端越慢
    const superSlowOut = (t: number) => 1 - Math.pow(1 - t, 2);
    const superSlowlow = (t: number) => 1 - Math.pow(1 - t, 1.5);

    // 如果想更誇張，改成 6、7 都可以

    // 指針動畫同步
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      pointer.playPointerSwing2(totalTime, reboundTime, holdTime);
    }

    tween(this.turnBgNode)
      // 1) 一路旋轉到 overshootAngle，用自訂 easing
      .to(totalTime * 0.8, { angle: overshootAngle + 2 }, { easing: superSlowOut })

      // 2) 停住
      .delay(holdTime)

      .to(totalTime * 0.2, { angle: overshootAngle }, { easing: superSlowOut })

      // 3) 補正
      .to(reboundTime * 0.48, { angle: targetAngle + 1 }, { easing: superSlowlow })
      .to(reboundTime * 0.4, { angle: targetAngle }, { easing: 'quadIn' })

      .call(() => onFinished?.())
      .start();
  }

  //! 轉盤動畫1
  playWheelAnimation(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    const rotatelottertSecs = 12; // 轉圈數
    // 先初始化轉盤角度，避免累積太多旋轉角度
    this.turnBgNode.angle %= 360;

    // 計算最終目標角度
    let targetAngle = -rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
    // console.log('🎯 準備轉盤角度', targetAngle);

    // 設定超轉角度（轉過頭一點）
    let overshootAngle = targetAngle - WheelSyncConfig.overshootAngle;

    // 時間控制
    const totalTime = WheelSyncConfig.lotterSecsL;
    const reboundTime = WheelSyncConfig.reboundTime;
    const holdTime = 0.5; // 停留秒數（可調整）

    // 自訂 easing：越到尾端越慢
    const superSlowOut = (t: number) => 1 - Math.pow(1 - t, 2.5);
    // 如果想更誇張，改成 6、7 都可以

    // 指針動畫同步
    const pointer = this.dotContainerNode.getComponent('PointerAnim') as any;
    if (pointer) {
      pointer.playPointerSwing(totalTime, reboundTime, holdTime);
    }

    tween(this.turnBgNode)
      // 1) 一路旋轉到 overshootAngle，用自訂 easing
      .to(totalTime, { angle: overshootAngle }, { easing: superSlowOut })

      // 2) 停住
      .delay(holdTime)

      // 3) 回正
      .to(reboundTime * 1.5, { angle: targetAngle }, { easing: 'quadIn' })

      .call(() => onFinished?.())
      .start();
  }
}
