import { _decorator, Component, Node, tween, UIOpacity, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RLRotation')
export class RLRotation extends Component {
  @property({ type: Number })
  public rotateDuration: number = 6; // 旋轉持續時間（秒）

  @property({ type: Number })
  public rotateSpeed: number = 360; // 每秒旋轉角度（度）

  @property(Node) RLRotaEffectNode: Node = null;

  onLoad() {
    this.node.angle = 0; //
    this.RLRotaEffectNode.active = false;
  }

  public playRotationEffect(callback?: () => void) {
    // 初始設定
    this.RLRotaEffectNode.active = true;
    this.node.angle = 0;
    this.node.scale = new Vec3(0.5, 0.5, 1); // 稍微縮小
    this.node.active = true;

    const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
    opacity.opacity = 0;

    const totalAngle = this.rotateSpeed * this.rotateDuration;

    // 淡入 + 放大 + 旋轉
    tween(this.node)
      .parallel(
        tween().to(1.5, new Vec3(0.5, 0.5, 1), { easing: 'quadOut' }), // 放大
        tween().to(
          1.5,
          {},
          {
            onUpdate: (_, ratio) => {
              opacity.opacity = 255 * ratio; // 淡入
            },
          }
        ),
        tween().by(this.rotateDuration, { angle: totalAngle }, { easing: 'linear' }) // 旋轉
      )
      .then(
        tween(this.node).parallel(
          tween().to(1.5, new Vec3(0.4, 0.4, 1), { easing: 'quadIn' }), //縮小
          tween().to(
            1.5,
            {},
            {
              onUpdate: (_, ratio) => {
                opacity.opacity = 255 * (1 - ratio); // 淡出
              },
            }
          )
        )
      )
      .call(() => {
        callback?.(); // 動畫完成可接轉場等行為
      })
      .start();
  }
}
