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
    this.winNode = new Node('WinImage');
    const sprite = this.winNode.addComponent(Sprite);
    sprite.spriteFrame = this.winSpriteFrame;
    sprite.sizeMode = Sprite.SizeMode.TRIMMED;

    const uiOpacity = this.winNode.addComponent(UIOpacity);
    uiOpacity.opacity = 0;

    // this.winNode.setScale(0.2, 0.2, 1); // 預設縮小一點點
    this.winNode.setPosition(0, 0, 0);
    this.node.addChild(this.winNode);

    tween(this.winNode)
      .parallel(
        tween(this.winNode).to(0.3, { scale: new Vec3(0.4, 0.4, 0.8) }), // WIN縮放動畫(下注區)
        tween(uiOpacity).to(0.3, { opacity: 255 })
      )
      .delay(1.5)
      .call(() => {
        tween(uiOpacity)
          .to(0.5, { opacity: 0 })
          .call(() => this.winNode.destroy())
          .start();
      })
      .start();
  }
}
