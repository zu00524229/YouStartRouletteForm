// ExtraPay 邏輯
import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ExtraPayController')
export class ExtraPayController extends Component {
  @property(Node) ExtraPaySprite: Node = null; // 圖片節點

  onLoad() {
    if (this.ExtraPaySprite) {
      this.ExtraPaySprite.active = false; // 初始隱藏
    }
  }

  public show(multiplier: number = 2) {
    console.log('>>> 呼叫 ExtraPayController.show()');
    console.log('ExtraPaySprite node =', this.ExtraPaySprite);
    if (!this.ExtraPaySprite) return;
    console.log(`🎯 ExtraPay 顯示: ${this.node.name}, 倍率=${multiplier}`);
    this.ExtraPaySprite.active = true;
    // 確保整個控制器節點打開
    this.node.active = true;

    this.ExtraPaySprite.setScale(new Vec3(1, 1, 1)); // 重設縮放初始值

    tween(this.ExtraPaySprite)
      .to(0.2, { scale: new Vec3(1.5, 1.5, 1) }) //瞬間放大
      .to(0.2, { scale: new Vec3(1, 1, 1) }) // 縮回原大小
      .start();
  }

  public hide() {
    if (this.ExtraPaySprite) {
      this.ExtraPaySprite.active = false;
      this.node.active = false;
    }
  }
}
