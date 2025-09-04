import { _decorator, color, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3 } from 'cc';
// 假設 ToolButtons.ts 在同一目錄下
import { AudioManager } from '../../Managers/Audio/AudioManager';
import { Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Toast')
export class Toast extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager

  @property(Node) ExtraPayNode: Node = null; // EXTRAPAY 發生提示

  @property(Node) PleaseBetNow: Node = null; // 遊戲開始顯示提示(玩家下注)
  @property(Node) BetLocked: Node = null; // Start 轉盤開始後(禁止下注)

  // @property(Label) WinTotal: Label = null; // 獲得獎金提示文字

  @property(Node) WinningTips: Node = null; // 獲得獎金外框容器
  @property(Node) WinTotalContainer: Node = null; // 用來放數字圖的節點
  @property(Node) WinMultContainer: Node = null; // 用來放倍率圖(數字)

  @property([SpriteFrame]) digitSprites: SpriteFrame[] = []; // 數字圖集（0~9）
  @property([SpriteFrame]) multSprites: SpriteFrame[] = []; // 倍率數字
  // @property(SpriteFrame) winSprite: SpriteFrame = null; // WIN 圖片
  // @property(SpriteFrame) xSprite: SpriteFrame = null; // x 圖片

  @property(Node) bonusGameUI: Node = null; // 導入提示大獎父節點
  @property(Node) MANIABg: Node = null; // 內容父節點
  @property(Node) BobusTitle: Node = null; // 大獎標題節點
  @property(Node) pickNode: Node = null; //
  @property(Node) maniaNode: Node = null;
  @property(Node) superNode: Node = null;

  // 🔑 單例
  static instance: Toast;

  onLoad() {
    this.ExtraPayNode.active = false;
    this.PleaseBetNow.active = false;
    this.BetLocked.active = false;
    this.WinningTips.active = false;

    this.bonusGameUI.active = false;
    // 綁定單例
    Toast.instance = this;
  }

  // ================= 一般中獎提示 ===========================
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

  showWinningTips(mult: number, total: number) {
    this.WinningTips.active = true;
    // AudioManager.instance.playBGM("一般得分音效");
    this.Audio.AudioSources[3].play(); //一般得分音效
    this.Audio.AudioSources[5].play(); // 金幣音效

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

    this.createImageText(this.WinTotalContainer, totalStr, spriteMap, 0.4); // 創建金額數字圖片

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

    this.createImageText(this.WinMultContainer, Mult, multMap, 0.6);

    const opacity = this.WinningTips.getComponent(UIOpacity) || this.WinningTips.addComponent(UIOpacity);
    opacity.opacity = 0;

    tween(opacity).to(0.3, { opacity: 255 }, { easing: 'fade' }).start();
  }

  // 隱藏（可清空文字）
  hideWinningTips() {
    const opacity = this.WinningTips.getComponent(UIOpacity);
    if (!opacity) {
      this.WinningTips.active = false;
      this.Audio.AudioSources[3].stop(); //一般得分音效
      this.Audio.AudioSources[5].stop(); // 金幣音效
      return;
    }

    tween(opacity)
      .to(0.3, { opacity: 0 }, { easing: 'fade' })
      .call(() => {
        this.WinningTips.active = false;
        // AudioManager.instance.stopBGM();
        // this.WinTextContainer.removeAllChildren();
        // 停止音效
        this.Audio.AudioSources[3].stop(); // 一般得分音效
        this.Audio.AudioSources[5].stop(); // 金幣音效

        this.WinTotalContainer.removeAllChildren();
        this.WinMultContainer.removeAllChildren();
      })
      .start();
  }

  // ====================== 顯示 大獎提示 特效 ============================
  showBonusUI(type: string) {
    this.bonusGameUI.active = true; // 啟用父層節點（外框）
    this.MANIABg.active = true;
    this.BobusTitle.active = true;

    // 先全部關閉
    this.pickNode.active = false;
    this.maniaNode.active = false;
    this.superNode.active = false;

    // 顯示指定哪個
    let targetNode: Node | null = null;
    switch (type) {
      case 'PICKPK':
        // pickNode.active = true;
        targetNode = this.pickNode;
        break;
      case 'MANIABOX':
        // maniaNode.active = true;
        targetNode = this.maniaNode;
        break;
      case 'SUPER':
        // superNode.active = true;
        targetNode = this.superNode;
        break;
      default:
        console.warn(`❌ 未知的 BonusUI 類型: ${type}`);
        break;
    }

    // 開啟對應內容
    if (targetNode) {
      targetNode.active = true;

      //
      const uiOpacity = this.MANIABg.getComponent(UIOpacity);
      if (uiOpacity) {
        this.MANIABg.scale = new Vec3(0.5, 0.5, 1); // 初始縮放
        uiOpacity.opacity = 0; // 初始透明度

        tween(this.MANIABg)
          .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
          .start();
        tween(uiOpacity).to(0.3, { opacity: 255 }, { easing: 'fade' }).start();
      }
    }
  }

  // ========= 隱藏大獎特效提示 =============
  hideBonusUI() {
    const uiOpacity = this.MANIABg.getComponent(UIOpacity);

    if (uiOpacity) {
      tween(this.MANIABg)
        .to(0.3, { scale: new Vec3(0.5, 0.5, 1) }, { easing: 'backIn' })
        .start();

      tween(uiOpacity)
        .to(0.3, { opacity: 0 }, { easing: 'fade' })
        .call(() => {
          // 隱藏所有節點
          this.MANIABg.active = false;
          this.bonusGameUI.active = false;
          this.BobusTitle.active = false;

          this.pickNode.active = false;
          this.maniaNode.active = false;
          this.superNode.active = false;
        })
        .start();
    } else {
      // 沒有動畫就直接關
      this.MANIABg.active = false;
      this.bonusGameUI.active = false;
      this.BobusTitle.active = false;
      this.pickNode.active = false;
      this.maniaNode.active = false;
      this.superNode.active = false;
    }
  }

  // ========================== EXTRA PAY 提示 ==============================
  showExtraPay() {
    this.ExtraPayNode.active = true;
    const uiOpacity = this.ExtraPayNode.getComponentInChildren(UIOpacity)!;
    this.ExtraPayNode.scale = new Vec3(0.5, 0.5, 1); //
    uiOpacity.opacity = 0;

    tween(this.ExtraPayNode)
      .to(
        0.3,
        {
          scale: new Vec3(1, 1, 1),
        },
        { easing: 'backOut' }
      )
      .start();

    tween(uiOpacity).to(0.3, { opacity: 255 }, { easing: 'fade' }).start();
  }

  hideExtraPay() {
    const uiOpacity = this.ExtraPayNode.getComponentInChildren(UIOpacity)!;

    tween(uiOpacity)
      .to(0.3, { opacity: 0 }, { easing: 'fade' })
      .call(() => {
        this.ExtraPayNode.active = false;
      })
      .start();
  }

  //=========================== 遊戲啟動顯示提示(開始下注) ===================
  showPleaseBetNow() {
    this.Audio.AudioSources[2].play(); // 播放押注/停止下注 音效
    // console.log(`[🟢 showPleaseBetNow] ${Date.now()}`);
    this.PleaseBetNow.active = true;
    const uiOpacity = this.PleaseBetNow.getComponent(UIOpacity)!;
    this.PleaseBetNow.scale = new Vec3(0.5, 0.5, 1);
    uiOpacity.opacity = 0;

    tween(this.PleaseBetNow)
      .to(
        0.3,
        {
          scale: new Vec3(1, 1, 1),
        },
        { easing: 'backOut' }
      )
      .start();

    tween(uiOpacity).to(0.3, { opacity: 255 }, { easing: 'fade' }).start();
  }

  hidePleaseBetNow() {
    console.log(`[🔴 hidePleaseBetNow] ${Date.now()}`);
    const uiOpacity = this.PleaseBetNow.getComponent(UIOpacity)!;

    tween(uiOpacity)
      .to(0.3, { opacity: 0 }, { easing: 'fade' })
      .call(() => {
        this.PleaseBetNow.active = false;
      })
      .start();
  }

  //====================== Start 輪盤啟動(禁止任何下注動作) ========================
  showBetLocked() {
    this.BetLocked.active = true;
    this.Audio.AudioSources[2].play(); // 播放押注/停止下注 音效
    const uiOpacity = this.BetLocked.getComponent(UIOpacity)!;
    this.BetLocked.setScale(new Vec3(0.5, 0.5, 1));
    uiOpacity.opacity = 0;

    tween(this.BetLocked)
      .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
      .start();

    tween(uiOpacity).to(0.3, { opacity: 255 }, { easing: 'fade' }).start();
  }

  hideBetLocked() {
    const uiOpacity = this.BetLocked.getComponent(UIOpacity)!;

    tween(uiOpacity)
      .to(0.3, { opacity: 0 }, { easing: 'fade' })
      .call(() => {
        this.BetLocked.active = false;
      })
      .start();
  }
}
