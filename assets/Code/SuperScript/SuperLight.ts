import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SuperLight')
export class SuperLight extends Component {
  @property(Node) SuperTargetLight: Node = null; // 中獎特效節點(輪盤上光圈)
  @property(Node) highLightAnctor: Node = null; // 光圈旋轉節點

  onLoad() {
    this.SuperTargetLight.active = false; // 初始隱藏中獎特效
  }

  //  中獎特效：顯示 light 光圈並閃爍
  public playSuperLight() {
    try {
      if (!this.SuperTargetLight) {
        console.warn('❗ SuperTargetLight 為 null');
        return;
      }

      const uiOpacity = this.SuperTargetLight.getComponent(UIOpacity);
      if (!uiOpacity) {
        console.warn('❗ UIOpacity 組件未綁定在 SuperTargetLight 上');
        return;
      }

      this.SuperTargetLight.active = true;
      uiOpacity.opacity = 255; // 確保初始透明

      tween(uiOpacity) // ✅ 對的對象
        .repeat(
          3,
          tween()
            .to(0.5, { opacity: 0 }, { easing: 'fade' }) // 消失
            .to(0.5, { opacity: 255 }, { easing: 'fade' }) // 出現
        )
        .call(() => {
          this.SuperTargetLight.active = false;
          uiOpacity.opacity = 255; // 重置
        })
        .start();

      // console.log("✅ tween 成功啟動");
    } catch (error) {
      console.error('❌ showSuperTargetLight 發生錯誤：', error);
      console.log('🔎 this.SuperTargetLight =', this.SuperTargetLight);
      if (this.SuperTargetLight) {
        console.log('🔎 getComponent(UIOpacity) =', this.SuperTargetLight.getComponent(UIOpacity));
      }
    }
  }

  start() {}
}
