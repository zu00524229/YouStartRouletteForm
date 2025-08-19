// 中獎下注區出現提示的動畫效果
import { _decorator, Component, Node, Sprite, SpriteFrame, UIOpacity, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BetHighlighter')
export class BetHighlighter extends Component {
  @property(SpriteFrame)
  winSpriteFrame: SpriteFrame = null; // 拖入「WIN」圖片

  private winNode: Node = null;

  /**
   * 顯示 WIN 特效（動畫＋自動銷毀）
   */
  public showWinEffect() {
    console.log('呼叫showWinEffect WIN 字幕');
    this.winNode = new Node('WinImage');
    const sprite = this.winNode.addComponent(Sprite);
    sprite.spriteFrame = this.winSpriteFrame;
    sprite.sizeMode = Sprite.SizeMode.TRIMMED;

    const uiOpacity = this.winNode.addComponent(UIOpacity);
    uiOpacity.opacity = 0;

    this.winNode.setScale(1.2, 1.0, 2); // 預設大一點點
    this.winNode.setPosition(0, 0, 0);
    this.node.addChild(this.winNode);
    this.winNode.setSiblingIndex(this.node.children.length - 1); // ✅ 把 WIN 放到最上層，壓過籌碼

    tween(this.winNode)
      .parallel(
        tween(this.winNode).to(0.3, { scale: new Vec3(1.0, 1.0, 0.8) }), // WIN縮放動畫(下注區)
        tween(uiOpacity).to(0.3, { opacity: 255 })
      )
      .delay(1.5)
      .call(() => {
        tween(uiOpacity)
          .to(0.8, { opacity: 0 })
          .call(() => this.winNode.destroy())
          .start();
      })
      .start();
  }
}
