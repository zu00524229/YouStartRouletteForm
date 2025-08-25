import { _decorator, Component, Node, UIOpacity, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BgBlink')
export class BgBlink extends Component {
  @property(Node)
  bgNode: Node | null = null; // 🎯 拖入背景圖片節點

  private opacityComp: UIOpacity | null = null;

  onLoad() {
    if (!this.bgNode) {
      console.warn('⚠️ bgNode 未設定！');
      return;
    }

    // 取得或新增 UIOpacity
    this.opacityComp = this.bgNode.getComponent(UIOpacity) || this.bgNode.addComponent(UIOpacity);

    this.startBlink();
  }

  /** 開始閃爍 */
  startBlink() {
    if (!this.opacityComp) return;

    // 先停掉舊的
    tween(this.opacityComp).stop();

    // 從暗到亮再到暗，循環播放
    tween(this.opacityComp)
      .repeatForever(
        tween()
          .to(2.5, { opacity: 0 }) // 變暗 (0~255)
          .to(3.5, { opacity: 80 }) // 變亮
      )
      .start();
  }

  /** 停止閃爍 */
  stopBlink() {
    if (!this.opacityComp) return;
    tween(this.opacityComp).stop();
    this.opacityComp.opacity = 80; // 恢復全亮
  }
}
