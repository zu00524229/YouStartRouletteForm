import { _decorator, Component, Node, Sprite, SpriteFrame, tween, UIOpacity } from 'cc';
import { AudioManager } from '../../Managers/Audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('MANIAToast')
export class MANIAToast extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  @property(Node) ChooseYourTargetNode: Node = null;

  @property(Node) MEGAWinTips: Node = null; // 獲得獎金外框容器
  @property(Node) MEGAWinTotalContainer: Node = null; // 用來放數字圖的節點
  @property(Node) MEGAWinMultContainer: Node = null; // 用來放倍率圖(數字)

  @property([SpriteFrame]) digitSprites: SpriteFrame[] = []; // 數字圖集（0~9）
  @property([SpriteFrame]) multSprites: SpriteFrame[] = []; // 倍率數字

  onLoad() {
    this.ChooseYourTargetNode.active = true; // 初始化(顯示)
    this.MEGAWinTips.active = false;
  }

  // 暫時未使用( 顯示ChooseTarget 淡入淡出)
  public showChooseTargetTip(duration: number = 1.2) {
    if (!this.ChooseYourTargetNode) {
      console.log('❗ chooseYourTargetNode 未綁定');
      return;
    }

    const opacity = this.ChooseYourTargetNode.getComponent(UIOpacity) || this.ChooseYourTargetNode.addComponent(UIOpacity);
    opacity.opacity = 255;
    // this.ChooseYourTargetNode.active = true;

    tween(opacity)
      .to(0.4, { opacity: 0 }) // 淡出
      .call(() => {
        this.ChooseYourTargetNode.active = false;
      })
      .start();
  }

  // 將數字轉為圖片顯示
  createImageText(container: Node, text: string, spriteMap: { [key: string]: SpriteFrame }, scale: number = 0.4) {
    container.removeAllChildren();
    // const scale = 0.4; // 統一縮放比例

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const spriteFrame = spriteMap[char];
      if (!spriteFrame) continue;

      const node = new Node();
      const sprite = node.addComponent(Sprite);
      sprite.spriteFrame = spriteFrame;

      node.setScale(scale, scale);
      container.addChild(node);
    }
  }

  // ======================= BIG WIN (PICK)獎金提示 =========================
  showMegaTips(mult: number, total: number) {
    this.MEGAWinTips.active = true;
    this.Audio.AudioSources[6].play(); // 金錢音效
    // console.log("AudioManager:", this.Audio);
    // console.log("AudioSources[6]:", this.Audio?.AudioSources?.[6]);

    // ==== 金額數字 ====
    const totalStr = total.toString();
    const spriteMap = {
      '0': this.digitSprites[0],
      '1': this.digitSprites[1],
      '2': this.digitSprites[2],
      '3': this.digitSprites[3],
      '4': this.digitSprites[4],
      '5': this.digitSprites[5],
      '6': this.digitSprites[6],
      '7': this.digitSprites[7],
      '8': this.digitSprites[8],
      '9': this.digitSprites[9],
    };

    this.createImageText(this.MEGAWinTotalContainer, totalStr, spriteMap, 0.4); // 創建金額數字圖片

    const Mult = mult.toString();
    const multMap = {
      '0': this.multSprites[0],
      '1': this.multSprites[1],
      '2': this.multSprites[2],
      '3': this.multSprites[3],
      '4': this.multSprites[4],
      '5': this.multSprites[5],
      '6': this.multSprites[6],
      '7': this.multSprites[7],
      '8': this.multSprites[8],
      '9': this.multSprites[9],
    };

    this.createImageText(this.MEGAWinMultContainer, Mult, multMap, 0.6);

    const opacity = this.MEGAWinTips.getComponent(UIOpacity) || this.MEGAWinTips.addComponent(UIOpacity);
    opacity.opacity = 0;

    tween(opacity).to(0.3, { opacity: 255 }, { easing: 'fade' }).start();
  }

  // 隱藏（可清空文字）
  hideMegaTips() {
    const opacity = this.MEGAWinTips.getComponent(UIOpacity);
    if (!opacity) {
      this.MEGAWinTips.active = false;
      return;
    }

    tween(opacity)
      .to(0.3, { opacity: 0 }, { easing: 'fade' })
      .call(() => {
        this.MEGAWinTips.active = false;
        // AudioManager.instance.stopBGM();
        // this.WinTextContainer.removeAllChildren();
        this.MEGAWinTotalContainer.removeAllChildren();
        this.MEGAWinMultContainer.removeAllChildren();
      })
      .start();
  }
}
