import { _decorator, Button, Component, Node, Sprite, SpriteFrame, tween, UIOpacity, Vec3 } from 'cc';
import { AudioManager } from '../Managers/Audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('SettingManager')
export class SettingManager extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager

  @property(Node) settingNode: Node = null; // 設定按鈕節點

  @property(Button) settingMask: Button = null; // 透明Mask(Button)按鈕
  @property(Node) settingPanel: Node = null; // 設定面板節點
  @property(Node) infoPanelNode: Node = null; // 說明面板節點

  @property([Node]) pages: Node[] = [];
  @property(Node) btnPrev: Node = null;
  @property(Node) btnNext: Node = null;

  @property(Button) btnPrevButton: Button = null;
  @property(Button) btnNextButton: Button = null;

  @property(SpriteFrame) sprArrowOn: SpriteFrame = null;
  @property(SpriteFrame) sprArrowOff: SpriteFrame = null;

  private pageIndex = 0;

  onLoad() {
    // 確保一開始是關的
    this.settingPanel.active = false;
    this.settingPanel.setPosition(220.5, 550, 0);
    const opacity = this.settingPanel.getComponent(UIOpacity);
    if (opacity) opacity.opacity = 0;

    this.infoPanelNode.active = false;
    this.settingMask.node.active = false;
    this.settingNode.active = true; // 確保齒輪按鈕一開始是開的

    // 初始位置設在左邊外面
    this.settingPanel.setPosition(new Vec3(-400, this.settingPanel.position.y, 0));
    this.settingNode.setPosition(new Vec3(-310, this.settingNode.position.y, 0));
    // 強制檢查節點是否存在
    if (!this.infoPanelNode || !this.settingPanel) {
      console.error('ERROR: 面板節點未綁定！');
      return;
    }

    this.updatePage();
    this.btnPrev.on(Button.EventType.CLICK, this.onPrev, this);
    this.btnNext.on(Button.EventType.CLICK, this.onNext, this);
  }

  onPrev() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.updatePage();
    }
  }

  onNext() {
    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex++;
      this.updatePage();
    }
  }

  updatePage() {
    // 保險：強制 pageIndex 落在合法範圍
    if (this.pageIndex < 0) this.pageIndex = 0;
    if (this.pageIndex >= this.pages.length) this.pageIndex = this.pages.length - 1;

    this.pages.forEach((page, idx) => {
      page.active = idx === this.pageIndex;
    });

    const isFirst = this.pageIndex === 0;
    const isLast = this.pageIndex === this.pages.length - 1;

    if (this.btnPrevButton) {
      this.btnPrevButton.interactable = !isFirst;
      this.btnPrevButton.target.getComponent(Sprite).spriteFrame = isFirst ? this.sprArrowOff : this.sprArrowOn;
    }

    if (this.btnNextButton) {
      this.btnNextButton.interactable = !isLast;
      this.btnNextButton.target.getComponent(Sprite).spriteFrame = isLast ? this.sprArrowOff : this.sprArrowOn;
    }
  }

  // ===== 開啟選單 ====
  private isAnimatingSetting: boolean = false;
  onChickSetingButton() {
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    if (this._isSetting) {
      this.hideSettingPanel();
    } else {
      this.showSettingPanel();
    }
  }

  private _isSetting: boolean = false;
  // 顯示設定面板動畫（向下滑出）
  showSettingPanel() {
    if (this.isAnimatingSetting) return; // 動畫中禁止再次呼叫
    this.isAnimatingSetting = true; // ✅ 開始動畫就鎖住
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    this.settingPanel.active = true;
    this.settingMask.node.active = true;
    this.settingPanel.setPosition(220.5, 550, 0); // 起始點（畫面外上方）
    const opacity = this.settingPanel.getComponent(UIOpacity);

    // 將滑動與透明化動畫合併
    tween(this.settingPanel)
      .parallel(tween().to(0.4, { position: new Vec3(220.5, 330, 0) }, { easing: 'backOut' }), tween(opacity).to(0.4, { opacity: 255 }))
      .call(() => {
        this._isSetting = true;
        this.isAnimatingSetting = false; // ✅ 動畫結束解鎖
      })
      .start();
    this._isSetting = true;
  }

  // 隱藏設定面板動畫（往上滑回）
  hideSettingPanel() {
    if (this.isAnimatingSetting) return; // 動畫中禁止再次呼叫
    this.isAnimatingSetting = true; // ✅ 開始動畫就鎖住
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    this.settingMask.node.active = false;

    const opacity = this.settingPanel.getComponent(UIOpacity);

    // 將滑動與透明化動畫合併
    tween(this.settingPanel)
      .parallel(tween().to(0.4, { position: new Vec3(220.5, 550, 0) }, { easing: 'backIn' }), tween(opacity).to(0.4, { opacity: 0 }))
      .call(() => {
        this.settingPanel.active = false;
        this._isSetting = false;
        this.isAnimatingSetting = false; // ✅ 動畫結束後解鎖
      })
      .start();

    this._isSetting = false;
  }

  // ======== 資訊按鈕 =======
  openInfoPanel() {
    console.log('啟動openInfoPanel');
    // 顯示說明面板
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    this.infoPanelNode.active = true;
    this.settingPanel.active = false;
  }

  closeInfoPanel() {
    console.log('啟動closeInfoPanel');
    // 隱藏說明面板
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    this.infoPanelNode.active = false;
    this.settingPanel.active = true; // 顯示並滑入設定面板
  }
}
