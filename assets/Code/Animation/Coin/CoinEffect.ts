import { _decorator, Component, Sprite, SpriteFrame, tween, Vec3, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CoinEffect')
export class CoinEffect extends Component {
  @property(Sprite) sprite: Sprite = null;
  @property([SpriteFrame]) frames: SpriteFrame[] = [];

  start() {
    if (!this.sprite) {
      this.sprite = this.getComponent(Sprite);
    }
    this.playSpriteFrameAnimation();
    this.launchCoin();
  }

  playSpriteFrameAnimation() {
    let frameIndex = Math.floor(Math.random() * this.frames.length);
    const totalFrames = this.frames.length;
    const interval = 1 / 30;
    const playTime = 0.6;
    let elapsed = 0;

    this.schedule((dt) => {
      elapsed += dt;
      if (elapsed > playTime) {
        this.unscheduleAllCallbacks();
        return;
      }
      this.sprite.spriteFrame = this.frames[frameIndex];
      frameIndex = (frameIndex + 1) % totalFrames;
    }, interval);
  }
  // 控制單顆金幣動畫
  launchCoin() {
    const startPos = this.node.getPosition();
    // const angle = (45 + Math.random() * 15) * (Math.PI / 180); //
    const angle = (60 - 30 + Math.random() * 60) * (Math.PI / 180); // ➜ 30° ~ 90°
    const speed = 50 + Math.random() * 100; // 控制噴射速度(距離)
    // const angle = (30 + Math.random() * 10) * (Math.PI / 180);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed + 150;
    const endPos = startPos.add(new Vec3(dx, dy, 0));

    const uiOpacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    uiOpacity.opacity = 255;

    tween(this.node)
      .to(0.8, { position: endPos, scale: new Vec3(0.3, 0.3, 1) }, { easing: 'quadOut' })
      .to(
        0.5,
        {},
        {
          onUpdate: (_, ratio) => {
            this.node.setScale(0.3 - 0.5 * ratio, 0.3 - 0.5 * ratio, 1);
            uiOpacity.opacity = 255 * (1 - ratio);
          },
        }
      )
      .call(() => this.node.destroy())
      .start();
  }
}
