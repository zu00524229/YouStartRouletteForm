import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BoxEffect')
export class BoxEffect extends Component {
  @property(Node) Box: Node = null; // 寶相節點(圖)
  @property(sp.Skeleton) Chest: sp.Skeleton = null; // Chest_Red 動畫
  @property(Node) BoxAnimNode: Node = null; // 動畫節點
  @property(sp.Skeleton) glow_Glow: sp.Skeleton = null; // Chest_Glow  動畫

  onLoad() {
    this.Box.active = true; // 初始化靜態箱圖
    this.BoxAnimNode.active = false; // 初始化 動畫節點(隱藏)
  }

  public playOpenEffect(callback?: Function) {
    if (!this.Chest || !this.glow_Glow) {
      console.log('❌ 請確認 ChestAnim 與 GlowAnim 已正確綁定！');
    }

    this.Box.active = false;
    this.BoxAnimNode.active = true;

    this.Chest.timeScale = 0.5; // 動畫時間變兩倍
    this.glow_Glow.timeScale = 0.5;

    this.Chest.setAnimation(0, 'animation', false); // 寶箱開啟動畫
    this.glow_Glow.setAnimation(0, 'animation', false); // 開啟亮光
    // console.log("Chest 骨架動畫：", this.Chest?.animation);       // 應該印出 animation
    // console.log("Glow 骨架動畫：", this.glow_Glow?.animation);     // 應該印出 animation

    // 播完動畫時觸發 Callback
    this.Chest.setCompleteListener(() => {
      console.log('寶箱動畫完成');
      if (callback) callback(); // 執行傳進來的 callback
    });
  }

  public stopGlow() {
    this.glow_Glow.clearTrack(0); //  停止當前動畫
    this.glow_Glow.setToSetupPose(); // 重設靜止狀態\
  }

  start() {}

  update(deltaTime: number) {}
}
