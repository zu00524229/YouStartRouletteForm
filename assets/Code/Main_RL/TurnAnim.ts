import { _decorator, CCInteger, Collider2D, Component, Node, tween } from 'cc';
import { SIGNALR_EVENTS, UnifiedLotteryEvent } from '../Type/Types';

const { ccclass, property } = _decorator;

@ccclass('TurnAnim')
export class TurnAnim extends Component {
  @property(Node) turnBgNode: Node = null; //
  @property(Node) dotContainerNode: Node = null; // Dot 容器

  @property(CCInteger) rewardTypeCount: number = 50; // 轉盤中獎品分區數量
  @property(CCInteger) rotatelottertSecs: number = 5; // 轉盤動畫旋轉次數
  @property(CCInteger) lotterSecsL: number = 7; // 抽獎動畫持續時間

  // TurnLottery.ts

  // 播放轉盤動畫
  // let targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * (360 / this.rewardTypeCount);
  // console.log("✅ turnBgNode 是否為 null：", this.turnBgNode);  // 這裡先驗證
  // console.log("🎯 準備轉盤角度", targetAngle);
  // this.turnBgNode.angle %= 360;   // 隨機角度初始化

  playWheelAnimation(rewardIndex: number, rewardName: string, multiplier: number, data: UnifiedLotteryEvent, onFinished: () => void) {
    console.log('🎡 開始旋轉的節點=', this.turnBgNode.name);
    console.log(
      'turnBgNode =',
      this.turnBgNode.name,
      'children=',
      this.turnBgNode.children.map((c) => c.name)
    );

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

    tween(this.turnBgNode)
      .to(overshootTime, { angle: overshootAngle }, { easing: 'cubicOut' })
      .to(reboundTime, { angle: targetAngle }, { easing: 'quadInOut' })
      .call(() => {
        if (onFinished) onFinished();
      })
      .start();
  }
}
