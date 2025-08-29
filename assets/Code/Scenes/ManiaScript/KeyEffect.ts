import { _decorator, Component, Node, EventMouse, sp, UITransform, Camera, Vec3, Vec2, view, tween, UIOpacity, CCInteger } from 'cc';
import { BoxEffect } from './BoxEffect';
import { AudioManager } from '../../Managers/Audio/AudioManager';
import { MANIAController } from './MANIAController';
import { LotteryCache } from '../../TurnLottery';
const { ccclass, property } = _decorator;

@ccclass('KeyEffect')
export class KeyEffect extends Component {
  @property(BoxEffect) BoxEffect: BoxEffect = null; // 引入 BoxEffect 腳本
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  @property(MANIAController) maniaController: MANIAController = null; // 連結 MANIAController

  @property({ type: CCInteger }) public chestIndex: number = 0; // 代表玩家選擇的是哪個寶箱

  @property(sp.Skeleton) Keykeffect: sp.Skeleton = null; // Hover 動畫元件
  @property(Node) KeyeffectNode: Node = null; // Hover 動畫節點

  @property(Node) rootNode: Node = null; // 鑰匙外層節點
  @property(Node) BoxTarget: Node = null; // 目標寶相節點

  private _isHovered: boolean = false; // 控制 Hover 動畫是否執行過

  onLoad() {
    console.log('🔁 chestIndex 初始化為', this.chestIndex);

    this.rootNode.active = true; // 鑰匙預設顯示
    this.KeyeffectNode.active = false; // 鑰匙動畫預設false
    this.Keykeffect.clearTrack(0); // 確保沒有任何動畫在跑
    this.node.on(Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
    this.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    this.KeyeffectNode.on(Node.EventType.TOUCH_END, this.onClickKey, this);

    // 設定動畫播放完畢的 callback
    this.Keykeffect.setCompleteListener(() => {
      this._isHovered = false; // 播完才能再播
    });
    console.log(this.Keykeffect.getCurrent(0)); // 若為 null 就是沒在播
  }

  // 滑鼠移入: 播放 Hover 動畫
  onMouseMove(event: EventMouse) {
    if (this._isHovered) return;

    this._isHovered = false;
    this._isHovered = true; // 標記進入 Hover 狀態
    this.KeyeffectNode.active = true; // 顯示動畫節點
    this.Keykeffect.setAnimation(0, 'animation', true); // 播放動畫(true 表示 loop 循環播放)
  }
  // 滑鼠移出: 重製 Hover 動畫
  onMouseLeave(event: EventMouse) {
    this._isHovered = false; // 離開 hover 允許下次再次觸發

    this.KeyeffectNode.active = false; // 隱藏動畫節點
    this.Keykeffect.clearTrack(0); // 停止當前動畫播放
    this.Keykeffect.setToSetupPose(); // 重設靜止狀態
  }

  onDisable() {
    if (this.node && this.node.isValid) {
      this.node.off(Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
      this.node.off(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    }
  }

  // =============== 鑰匙點擊事件（包含飛行動畫、觸發寶箱、淡出其他鑰匙） ==================
  onClickKey() {
    // if (MANIAController.hasKeyBeenClicked) return;
    // MANIAController.hasKeyBeenClicked = true;
    this.maniaController.Stop_ButtonNode.active = false;
    this.maniaController.Auto_ButtonNode.active = true;
    this.maniaController.ChooseTargetNode.active = false;

    // 👉 當玩家點下鑰匙，記錄選中的寶箱 index
    if (LotteryCache.lastResult) {
      LotteryCache.lastResult.selectedIndex = this.chestIndex;
    }
    console.log('✅ 玩家點擊的 chestIndex =', this.chestIndex);

    const chestPos = this.BoxTarget.getWorldPosition();
    const parent = this.rootNode.parent!;
    const localTarget = parent.inverseTransformPoint(new Vec3(), chestPos);
    this.Audio.AudioSources[3].play(); // 播放鑰匙音效
    this.Audio.AudioSources[4].play(); // 播放MEGA音效

    // ✅ 淡出所有其他未選中的鑰匙（同一父節點下的其他兄弟節點）
    const siblings = this.rootNode.parent.children;
    for (const sibling of siblings) {
      if (sibling !== this.rootNode) {
        const opacity = sibling.getComponent(UIOpacity) || sibling.addComponent(UIOpacity);
        // 使用 tween 淡出
        tween(opacity)
          .to(0.4, { opacity: 0 })
          .call(() => (sibling.active = false))
          .start();
      }
    }

    tween(this.rootNode)
      .to(
        1.6,
        {
          position: localTarget,
          scale: new Vec3(0.3, 0.3, 1),
        },
        {
          easing: 'quadInOut',
        }
      )
      .call(() => {
        console.log('🎯 鑰匙飛行完成');
        this.rootNode.active = false; // 鑰匙到定位後關閉

        // TODO：觸發寶箱動畫
        this.Audio.AudioSources[2].play(); // 播放寶箱開啟音效
        this.BoxEffect?.playOpenEffect(); // 播放動畫

        this.BoxEffect?.playOpenEffect(() => {
          this.maniaController.maniaResultList = this.maniaController.generateManiaData(this.chestIndex);
          // 寶箱動畫完成時呼叫倍率顯示
          this.maniaController?.showMultiplierResult();
        });
      })
      .start();
  }
}
