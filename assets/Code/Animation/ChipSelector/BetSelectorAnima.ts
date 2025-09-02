import { _decorator, CCInteger, Component, instantiate, Node, Prefab, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { AudioManager } from '../../Managers/Audio/AudioManager';
import { ChipManager } from '../../Managers/Bet/ChipManager';
const { ccclass, property } = _decorator;

@ccclass('BetSelectorAnima')
export class BetSelectorAnima extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  @property(ChipManager) chipManager: ChipManager = null; // 連結 ChipManager

  @property({ type: [CCInteger] }) chipValues: number[] = [100, 200, 500, 1000, 10000]; // 對應籌碼金額

  @property([Node]) chipButtons: Node[] = []; // 選單(選擇下注籌碼) Bet_50, Bet_100, Bet_500 等按鈕
  @property(Node) chipButton: Node = null; // 籌碼選擇按鈕
  @property(Node) chipPopupPanel: Node = null; // 籌碼選擇面板(彈出式)
  @property([Prefab]) chipPrefab: Prefab[] = []; // [Bet_50, Bet_100, Bet_500 對應 chipValues] (對應籌碼顯示圖庫)
  @property(Prefab) chipButtonPrefab: Prefab = null; // 掛在 ChipButton 上的 Sprite 元件 (最後顯示)

  private chipPopupOpactiy: UIOpacity = null; // 籌碼選單面板的透明度組件
  private isPopupVisible: boolean = false; // 籌碼選單是否可見

  onLoad() {
    // 透明度初始化
    this.chipPopupOpactiy = this.chipPopupPanel.getComponent(UIOpacity);
    if (!this.chipPopupOpactiy) this.chipPopupOpactiy = this.chipPopupPanel.addComponent(UIOpacity);

    // 預設隱藏籌碼選單
    this.chipPopupPanel.active = true; // 先顯示一次才能初始化位置
    this.chipPopupPanel.setPosition(new Vec3(0, -500, 0));
    this.chipPopupOpactiy.opacity = 0;
    this.chipPopupPanel.active = false;
    this.isPopupVisible = false;

    // 每顆籌碼案有事件
    this.chipButtons.forEach((btn, index) => {
      btn.on(Node.EventType.TOUCH_END, () => {
        const value = this.chipValues[index];
        this.selectChip(value);
      });
    });

    // 預設選種第一個籌碼
    if (this.chipValues.length > 0) this.selectChip(this.chipValues[0]);
  }

  // ========= ChipSelector 區域 (玩家選擇籌碼金額) ==========
  // 選擇籌碼金額
  selectChip(value: number) {
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    this.chipManager.selectedChipValue = value; // 儲存當前籌碼金額
    this.chipPopupPanel.active = true; // 顯示籌碼選擇面板(彈出式)

    // 更新按鈕圖示
    const index = this.chipValues.indexOf(value);

    // 更新主 ChipButton 的圖片
    if (index >= 0 && this.chipPrefab[index]) {
      this.chipButton.removeAllChildren(); // 清除之前的籌碼圖示

      const chipNode = instantiate(this.chipPrefab[index]);
      chipNode.setScale(new Vec3(1.1, 1.1, 1)); //  顯示區要大一點
      chipNode.setPosition(0, 0, 0); // 居中

      // 複製預製體並掛上去
      this.chipButton.addChild(chipNode);
      this.chipButtonPrefab = this.chipPrefab[index];

      // 紀錄目前選擇的籌碼預製體（可省略，如果 chipButton 是唯一顯示區）
      this.chipButtonPrefab = this.chipPrefab[index];
    }

    this.hideChipPopup(); // 隱藏籌碼選單（選完自動收起）
  }

  // ========= 籌碼選單(動畫滑出/淡出) ===========
  // 點擊籌碼選單按鈕
  onClickChipButton() {
    if (this.isPopupVisible) {
      this.hideChipPopup();
    } else {
      this.showChipPopup();
    }
  }

  // 顯示動畫
  showChipPopup() {
    // console.log('已啟用');
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    this.chipPopupPanel.active = true;
    // 以 chipButton 為基準定位
    const worldBtnPos = this.chipButton.getWorldPosition();

    // 將世界座標轉換為 chipPopupPanel 的父節點座標
    const localBtnPos = this.chipPopupPanel.parent!.getComponent(UITransform).convertToNodeSpaceAR(worldBtnPos);
    // 再根據這個位置設定起點與終點
    const popupStart = new Vec3(localBtnPos.x, localBtnPos.y - 50, 0); // 從按鈕下方開始
    const popupEnd = new Vec3(localBtnPos.x, localBtnPos.y + 50, 0); // 動畫滑到按鈕上方

    this.chipPopupPanel.setPosition(popupStart);

    this.chipPopupOpactiy.opacity = 0;

    tween(this.chipPopupPanel).to(0.3, { position: popupEnd }, { easing: 'backOut' }).start();

    tween(this.chipPopupOpactiy).to(0.3, { opacity: 255 }, { easing: 'fade' }).start();

    this.isPopupVisible = true;
  }

  // 隱藏動畫
  hideChipPopup() {
    const currentPos = this.chipPopupPanel.getPosition();
    const targetPos = new Vec3(currentPos.x, currentPos.y - 100, 0); // 收回時往下滑

    tween(this.chipPopupPanel)
      .to(0.5, { position: targetPos }, { easing: 'backIn' })
      .call(() => {
        this.chipPopupPanel.active = false;
      })
      .start();

    tween(this.chipPopupOpactiy)
      .to(0.5, {
        opacity: 0,
      })
      .call(() => {
        this.chipPopupPanel.active = false;
      })
      .start();

    this.isPopupVisible = false;
  }
}
