// import { playerState } from './Login/playerState';
import { _decorator, Button, CCInteger, Component, EventTouch, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { AudioManager } from './Audio/AudioManager';
import { BetHighlighter } from './BetHightlight';
import { ExtraPayController } from './ExtraPayController';
import { Toast } from './Toast';
import { player } from './Login/playerState';
const { ccclass, property } = _decorator;

@ccclass('ChipManager')
export class ChipManager extends Component {
  @property(Toast) toast: Toast = null; // 連結 Toast 組件，用於顯示提示訊息
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  // @property(TurnLottery) Lottery: TurnLottery = null; // 連結 TurnLottery
  // ========= 下注區域(設置Button(無功能) 是為了視覺) ======
  @property({ type: Button }) GOLDENTREASUREBet: Button = null;
  @property({ type: Button }) GOLDMANIABet: Button = null;
  @property({ type: Button }) PRIZEPICKBet: Button = null;
  @property({ type: Button }) X2Bet: Button = null; // X2下注區
  @property({ type: Button }) X4Bet: Button = null;
  @property({ type: Button }) X6Bet: Button = null;
  @property({ type: Button }) X10Bet: Button = null;
  // @property(SpriteFrame) winSpriteFrame: SpriteFrame = null; // 轉盤獎賞 指定下注區亮起(WIN)
  //////////////////////////////////////////////////////////////////////////////
  @property({ type: Button }) Proportion: Button = null;
  @property(Node) ProporMask: Node = null;

  // @property({ type: Button }) StartButton: Button = null;
  @property({ type: Button }) AllButton: Button = null;
  @property({ type: Button }) X2Button: Button = null; // 雙倍按鈕

  // @property({ type: Button }) AgainButton: Button = null;
  @property({ type: Button }) AutoButton: Button = null;
  // @property(Label) AutoLabel: Label = null;
  // @property(Sprite) AutoSprite: Sprite = null;
  // @property(SpriteFrame) AutoSpriteFrame: SpriteFrame = null; // Auto 按鈕的圖片
  // @property(SpriteFrame) StopSpriteFrame: SpriteFrame = null; // Stop 按鈕的圖片

  @property({ type: Button }) UndoButton: Button = null;
  @property({ type: Button }) ClearButton: Button = null;

  @property([Node]) betAreaNodes: Node[] = []; // 下注區域節點
  // @property({type: [Number]}) chipValues: number[] = [10, 200, 500, 1000, 10000];     // 對應籌碼金額
  @property({ type: [CCInteger] }) chipValues: number[] = [100, 200, 500, 1000, 10000]; // 對應籌碼金額
  @property([Prefab]) chipPrefabs: Prefab[] = []; // 依序對應 50、100 籌碼(預製體)

  @property([Node]) chipButtons: Node[] = []; // 選單(選擇下注籌碼) Bet_50, Bet_100, Bet_500 等按鈕
  @property(Node) chipButton: Node = null; // 籌碼選擇按鈕
  @property(Node) chipPopupPanel: Node = null; // 籌碼選擇面板(彈出式)
  @property([Prefab]) chipPrefab: Prefab[] = []; // [Bet_50, Bet_100, Bet_500 對應 chipValues] (對應籌碼顯示圖庫)
  @property(Prefab) chipButtonPrefab: Prefab = null; // 掛在 ChipButton 上的 Sprite 元件 (最後顯示)

  // @property(Label) Bet_TitleLabel: Label = null; // 下注額度標題
  @property(Label) Bet_Label: Label = null; // 顯示下注額度
  // @property(Label) Balance_TitleLabel: Label = null; // 餘額標題
  @property(Label) Balance_Label: Label = null; // 顯示玩家餘額
  // @property(Label) Win_TitleLabel: Label = null; // 贏得條碼標題
  @property(Label) Win_Label: Label = null; // 導入贏得籌碼

  Balance_Num: number = 0; // 初始餘額(未來會連後端)

  // set Balance_Num(val: number) {
  //   console.log('🔎 Balance 改變:', this._balance, '→', val, new Error().stack);
  //   this._balance = val;
  // }

  // get Balance_Num(): number {
  //   return this._balance;
  // }

  Bet_Num: number = 0; // 玩家總下注金額(預設0)
  Win_Num: number = 0; // 初始化0

  selectedChipValue: number = 50; // 玩家當前籌碼金額 預設50
  totalNeeded = this.selectedChipValue * this.betAreaNodes.length; // 總共需要的下注金額(每個下注區域都下注選擇的籌碼金額) 用來判斷餘額夠不夠

  betAmounts: { [areaName: string]: number } = {}; // 儲存每個下注區域的累積下注金額(哈希表)
  betAreaMap: { [areaName: string]: number } = {
    Bet_PRIZE_PICK: 0,
    Bet_GOLD_MANIA: 1,
    Bet_GOLDEN_TREASURE: 2,
    Bet_X2: 3,
    Bet_X4: 4,
    Bet_X6: 5,
    Bet_X10: 6,
  };
  lastBetAmounts: { [areaName: string]: number } = {}; // 用於儲存上局最後下注資訊
  private currentActionId = 0;

  private chipPopupOpactiy: UIOpacity = null; // 籌碼選單面板的透明度組件
  private isPopupVisible: boolean = false; // 籌碼選單是否可見

  public isLotteryRunning = () => false; // 預設為 false（避免報錯）
  canBet: boolean = false;
  _isAutoMode: boolean = false; // 是否為自動下注模式
  Delay_Show = 2;

  // 儲存下注歷史紀錄(堆疊法)
  actionHistory: {
    type: 'bet' | 'double' | 'again';
    actionId: number;
    actions: {
      areaName: string;
      amount: number;
      chips: number[];
    }[];
  }[] = [];

  onLoad() {
    this.chipPopupOpactiy = this.chipPopupPanel.getComponent(UIOpacity);
    if (!this.chipPopupOpactiy) {
      this.chipPopupOpactiy = this.chipPopupPanel.addComponent(UIOpacity);
    }

    // 預設隱藏籌碼選單
    this.chipPopupPanel.active = true; // 強制先顯示一次才能讓位置初始化生效
    this.chipPopupPanel.setPosition(new Vec3(0, -500, 0)); // 預設隱藏位置(下方隱藏)
    // 設定透明度為 0
    const opacity = this.chipPopupPanel.getComponent(UIOpacity);
    if (opacity) {
      opacity.opacity = 0;
    }
    this.chipPopupPanel.active = false;
    this.isPopupVisible = false;

    // 每個籌碼按鈕點擊事件(初始化籌碼按鈕事件)
    this.chipButtons.forEach((btn, index) => {
      btn.on(Node.EventType.TOUCH_END, () => {
        // 根據索引取得對應籌碼金額
        const selectedValue = this.chipValues[index];
        this.selectChip(selectedValue); // 呼叫方法設為當前選擇的籌碼
      });
    });

    // 預設選擇第一個籌碼,並更新按鈕樣式與主圖式
    this.selectChip(this.chipValues[0]);
  }

  // ========= ChipSelector 區域 (玩家選擇籌碼金額) ==========
  // 選擇籌碼金額
  selectChip(value: number) {
    this.Audio.AudioSources[1].play(); // 播放按鈕音效
    this.selectedChipValue = value; // 儲存當前籌碼金額
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
    this.Audio.AudioSources[1].play(); // 播放按鈕音效
    this.chipPopupPanel.active = true;
    // 以 chipButton 為基準定位
    const worldBtnPos = this.chipButton.getWorldPosition();

    // 將世界座標轉換為 chipPopupPanel 的父節點座標
    const localBtnPos = this.chipPopupPanel.parent!.getComponent(UITransform).convertToNodeSpaceAR(worldBtnPos);
    // 再根據這個位置設定起點與終點
    const popupStart = new Vec3(localBtnPos.x, localBtnPos.y - 100, 0); // 從按鈕下方開始
    const popupEnd = new Vec3(localBtnPos.x, localBtnPos.y + 180, 0); // 動畫滑到按鈕上方

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

  // ======== 判斷按鈕 是否啟用 (下注區有籌碼(且沒在轉動) 就啟動按鈕) =========
  updateStartButton() {
    const isLotteryRunning = this.isLotteryRunning(); // 輪盤是否轉動
    const isAutoMode = this._isAutoMode;
    // ===== 控制 Again / Auto 狀態按鈕 =====
    const hasLastBet = Object.keys(this.lastBetAmounts).length > 0;
    const hasAnyBet = Object.keys(this.betAmounts).some((key) => this.betAmounts[key] > 0); // 有任何下注區有籌碼

    // ===== 控制(Start / X2 / Undo / Clear) 是否啟動 ====
    const shouldEnableButtons = hasAnyBet && !isLotteryRunning && !isAutoMode;
    this.AutoButton.interactable = shouldEnableButtons;
    // this.StartButton.interactable = shouldEnableButtons;
    this.X2Button.interactable = shouldEnableButtons;
    this.UndoButton.interactable = shouldEnableButtons;
    this.ClearButton.interactable = shouldEnableButtons;

    // this.AllButton.interactable = !isAutoMode && !isLotteryRunning;
    // ===== 控制下注區區塊是否可互動 =====
    const shouldEnableBet = !this.isLotteryRunning() && !this._isAutoMode;

    this.AllButton.interactable = shouldEnableBet;
    this.GOLDENTREASUREBet.interactable = shouldEnableBet;
    this.GOLDMANIABet.interactable = shouldEnableBet;
    this.PRIZEPICKBet.interactable = shouldEnableBet;
    this.X2Bet.interactable = shouldEnableBet;
    this.X4Bet.interactable = shouldEnableBet;
    this.X6Bet.interactable = shouldEnableBet;
    this.X10Bet.interactable = shouldEnableBet;
    // if (!shouldEnableBet) {
    //     this.ProporMask.active = true;
    // } else {
    //     this.ProporMask.active = false;
    // }

    if (this._isAutoMode) {
      // Auto 模式開啟
      this.AutoButton.node.active = true;
      this.AutoButton.interactable = true;
      // this.AgainButton.node.active = false;
    } else if (hasAnyBet) {
      // 有下注 → 顯示 Auto，Again 隱藏
      this.AutoButton.node.active = true;
      this.AutoButton.interactable = true;
      // this.AgainButton.node.active = false;
    } else if (hasLastBet) {
      // 有上局下注紀錄
      // this.AgainButton.node.active = true;
      // this.AgainButton.interactable = true;
      this.AutoButton.node.active = true;
    } else {
      // 無可操作項目
      // this.AgainButton.node.active = true;
      // this.AgainButton.interactable = false;
      this.AutoButton.node.active = true;
    }
  }

  // ==== 按下 START 後按鈕關燈 (鎖定所有下注與操作按鈕) ======
  offLightButton() {
    // this.StartButton.interactable = false;
    this.AllButton.interactable = false;
    this.X2Button.interactable = false;
    // this.AgainButton.interactable = false;
    this.UndoButton.interactable = false;
    this.ClearButton.interactable = false;
    this.GOLDENTREASUREBet.interactable = false;
    this.GOLDMANIABet.interactable = false;
    this.PRIZEPICKBet.interactable = false;
    this.X2Bet.interactable = false;
    this.X4Bet.interactable = false;
    this.X6Bet.interactable = false;
    this.X10Bet.interactable = false;
  }

  onLightBetArea() {
    this.GOLDENTREASUREBet.interactable = true;
    this.GOLDMANIABet.interactable = true;
    this.PRIZEPICKBet.interactable = true;
    this.X2Bet.interactable = true;
    this.X4Bet.interactable = true;
    this.X6Bet.interactable = true;
    this.X10Bet.interactable = true;
  }

  // ================ 下注區域相關方法 =================
  // 計算下注區偏移用的 offsetMap
  private readonly offsetMap: Record<string, { x: number; y: number }> = {
    Bet_X2: { x: 0, y: 0 },
    Bet_X4: { x: 0, y: 0 },
    Bet_X6: { x: 0, y: 0 },
    Bet_X10: { x: 0, y: 0 },
    Bet_PRIZE_PICK: { x: 0, y: 0 },
    Bet_GOLD_MANIA: { x: 0, y: 0 },
    Bet_GOLDEN_TREASURE: { x: 0, y: 0 },
  };

  // 新增籌碼圖像並加入下注區（重疊）
  createChipInArea(betNode: Node, chipValue: number, actionId: number) {
    // 根據籌碼金額取得對應的籌碼預製體 prefab
    const chipIndex = this.chipValues.indexOf(chipValue); // 例：chipValue 為 50，找到 chipPrefabs 對應 index
    const chipPrefab = this.chipPrefabs[chipIndex]; // 取得對應的籌碼預製體

    const chipCount = betNode.children.filter((child) => child.name === 'Chip').length; // 計算目前下注區內已有幾枚籌碼
    const baseY = chipCount * 5; // 每枚籌碼往上疊高 5 單位，讓籌碼疊起來有層次感

    const offset = this.offsetMap[betNode.name] ?? { x: 0, y: 0 }; // 若不再offsetMap中，則使用0
    const chipX = offset.x;
    const chipY = baseY + offset.y; // 疊高 + Y 偏移

    // 生成新的籌碼實體並加入下注區
    const newChip = instantiate(chipPrefab); // 建立新籌碼節點
    newChip.name = 'Chip'; // 統一命名方便後續辨識與清除
    newChip.setPosition(chipX, chipY, 0); // 設定位置
    newChip['chipValue'] = chipValue;
    newChip['actionId'] = actionId; // 標記籌碼來源
    betNode.addChild(newChip); // 加入至對應下注區節點下

    // === 動畫效果：出現時放大後縮回原狀 ===
    newChip.setScale(new Vec3(0.6, 0.6, 1)); // 初始縮小
    tween(newChip)
      .to(0.1, { scale: new Vec3(0.9, 0.9, 1) }) // 瞬間放大
      .to(0.1, { scale: new Vec3(0.6, 0.6, 1) }) // 縮回正常大小
      .start();

    this.Audio.AudioSources[2].play(); // 播放押注(索引2)音效
  }

  // 更新下注區 Label 顯示的金額
  private updateBetAmountLabel(betNode: Node, newAmount: number) {
    // 取得下注區中的金額容器節點(AmountLabel)
    const amountLabelNode = betNode.getChildByName('AmountLabel');
    // 在AmountLabel 中取得顯示文字的 Label 組件
    const labelNode = amountLabelNode?.getChildByName('Label');
    // 取得 Label 組件，修改文字內容
    const labelComp = labelNode?.getComponent(Label);
    // 如果 labelComp 存在，則更新顯示的金額
    if (labelComp) {
      labelComp.string = String(newAmount);
    }
  }

  // 更新下方的 Bet / Balance / Win 顯示
  updateGlobalLabels() {
    // 更新下注金額與餘額文字顯示
    if (this.Bet_Label) {
      this.Bet_Label.string = (this.Bet_Num ?? 0).toFixed(2);
    }
    if (this.Balance_Label) this.Balance_Label.string = (this.Balance_Num ?? 0).toFixed(2); // 保留兩位小數
    if (this.Win_Label) {
      this.Win_Label.string = (this.Win_Num ?? 0).toFixed(2);
    }
  }

  // 取最接近且不超過某個值的籌碼金額
  getClosestChip(targetAmount: number): number {
    // 複製並由大到小排序籌碼金額陣列（確保從最大值開始比較）
    const sorted = [...this.chipValues].sort((a, b) => b - a);

    // 遍歷排序後的籌碼金額，找出第一個小於等於目標金額的籌碼
    for (const value of sorted) {
      if (value <= targetAmount) {
        return value;
      }
    }

    // 如果沒有任何籌碼小於等於 targetAmount，則回傳最小的籌碼金額
    // 這個情況發生在所有籌碼都比目標金額還大（例：target=1，但最低籌碼是5）
    return sorted[sorted.length - 1]; // 如果全都比 target 大，就取最小值
  }

  // 清除籌碼(結算)
  clearAllBets(): void {
    // 歸零 betAmounts 中每個下注區的金額
    for (const key in this.betAmounts) {
      if (this.betAmounts.hasOwnProperty(key)) {
        this.betAmounts[key] = 0;
      }
    }
    // 清除每個下注區的籌碼圖像與金額文字
    for (const betNode of this.betAreaNodes) {
      //  清除籌碼圖像
      const chips = betNode.children.filter((child) => child.name === 'Chip');
      for (const chip of chips) {
        chip.destroy(); // 移除籌碼節點（推薦 destroy 而不是 removeFromParent）
      }

      // 清除下注金額文字
      this.updateBetAmountLabel(betNode, 0);
    }

    // 重設總下注金額
    this.Bet_Num = 0;

    // 更新下方的總下注 / 餘額 / 贏得金額顯示
    this.updateGlobalLabels();
  }

  // 下注主要邏輯
  performBet(betNode: Node, chipValue: number, actionId: number, type: 'bet' | 'again') {
    const areaName = betNode.name;
    this.Balance_Num -= chipValue; // 扣除餘額
    this.Bet_Num += chipValue; // 增加總下注金額

    // 將籌碼機到該下注區的累積下注金額中 (若無則初始化為0)
    this.betAmounts[areaName] = (this.betAmounts[areaName] || 0) + chipValue;

    // 視覺與數值更新
    this.createChipInArea(betNode, chipValue, actionId); // 在下注區生成籌碼
    this.updateBetAmountLabel(betNode, this.betAmounts[areaName]); // 更新下注區上的金額標籤
    this.updateGlobalLabels(); // 更新總下注金額與餘額顯示
    this.actionHistory.push({
      type: 'bet',
      actions: [
        {
          areaName,
          amount: chipValue,
          chips: [chipValue],
        },
      ],
      actionId, //  記錄來源 id
    }); // 紀錄下注動作

    // console.log("🔨 正在下注，滑鼠尚未放開");
    this.updateStartButton(); // 每次下注後都更新 Start 按鈕狀態
  }

  // 高亮下注區域（用於中獎提示或視覺效果）
  public highlightBetArea(betKey: string) {
    // console.log("🎯 highlightBetArea:", betKey);
    const index = this.betAreaMap[betKey];
    // console.log("👉 對應 index:", index);
    const node = this.betAreaNodes[index];
    if (!node) return;

    const highlighter = node.getComponent(BetHighlighter);
    if (highlighter) {
      this.scheduleOnce(() => {
        highlighter.showWinEffect();
      }, this.Delay_Show);
    }

    // 2 對應下注按鈕高亮（啟用可互動）
    switch (betKey) {
      case 'Bet_X2':
        this.X2Bet.interactable = true;
        break;
      case 'Bet_X4':
        this.X4Bet.interactable = true;
        break;
      case 'Bet_X6':
        this.X6Bet.interactable = true;
        break;
      case 'Bet_X10':
        this.X10Bet.interactable = true;
        break;
      case 'Bet_PRIZE_PICK':
        this.PRIZEPICKBet.interactable = true;
        break;
      case 'Bet_GOLD_MANIA':
        this.GOLDMANIABet.interactable = true;
        break;
      case 'Bet_GOLDEN_TREASURE':
        this.GOLDENTREASUREBet.interactable = true;
        break;
    }
  }

  // 清除下注區上的 ExtraPay 標記
  public clearAllExtraPayMarks() {
    for (const node of this.betAreaNodes) {
      const controller = node.getComponent(ExtraPayController);
      if (controller) controller.hide(); // hide() 就是讓 .active = false
    }
  }

  // ================== 下注區域點擊事件 ==================
  // 下注區域點擊事件（需在下注區域節點）
  onBetClick(event: EventTouch) {
    console.log('👉 onBetClick 被觸發', event.currentTarget?.name);
    const betNode = event.currentTarget as Node; // 取得被點擊的下注區域節點
    const chipValue = this.selectedChipValue; // 取得目前選擇的籌碼金額
    const actionId = ++this.currentActionId;

    // 餘額不足就不能下注
    if (this.Balance_Num < chipValue) {
      console.log('❌ 餘額不足，無法下注！');
      this.toast.showToast('餘額不足，無法下注！'); // 呼叫方法(提示訊息框)
      return;
    }

    this.performBet(betNode, chipValue, actionId, 'bet');
  }

  // ================== 點擊 All Bet 按鈕觸發 ====================
  onAllBetClick() {
    this.Audio.AudioSources[1].play(); // 播放按鈕音效
    // 確認餘額是否足夠
    const totalNeeded = this.selectedChipValue * this.betAreaNodes.length;
    if (this.Balance_Num < totalNeeded) {
      this.toast.showToast('餘額不足，無法全部下注');
      return;
    }

    const actionId = ++this.currentActionId;
    const actionRecord = {
      type: 'bet' as const,
      actionId: actionId,
      actions: [] as {
        areaName: string;
        amount: number;
        chips: number[];
      }[],
    };

    // 遍歷所有下注區域
    for (const betNode of this.betAreaNodes) {
      const areaName = betNode.name;

      // 扣除餘額與累加下注金額
      this.Balance_Num -= this.selectedChipValue;
      this.Bet_Num += this.selectedChipValue;

      // 更新下注區金額
      const currentAmount = this.betAmounts[areaName] ?? 0;
      const newAmount = currentAmount + this.selectedChipValue;
      this.betAmounts[areaName] = newAmount;

      // 建立籌碼圖像
      this.createChipInArea(betNode, this.selectedChipValue, actionId);

      // 更新下注區金額 Label
      this.updateBetAmountLabel(betNode, newAmount);

      // 加入動作紀錄
      actionRecord.actions.push({
        areaName: areaName,
        amount: this.selectedChipValue,
        chips: [this.selectedChipValue],
      });
    }

    // 加入歷史堆疊
    this.actionHistory.push(actionRecord);

    // 更新畫面下方資訊
    this.updateGlobalLabels();

    this.updateStartButton(); // 全部下注後也要更新按鈕
  }

  // ================ ToolButtons 區域 =================
  // 點擊 Double 按鈕(當前所有下注區的金額加倍下注)
  onDoubleClick() {
    this.Audio.AudioSources[1].play(); // 播放按鈕音效
    const doubleActions = [];
    const actionId = ++this.currentActionId; // 每次加倍下注都產生新的 actionId

    // 遍歷所有下注區域節點
    for (const betNode of this.betAreaNodes) {
      const areaName = betNode.name; // 取得下注區名稱
      const currentAmount = this.betAmounts[areaName] || 0; // 取得該區已下注金額，預設為 0

      if (currentAmount === 0) continue; // 若該區尚未下注，跳過這一圈
      const doubleAmount = currentAmount; // 要額外再下注相同金額（加倍）

      // 餘額不足，無法加倍，跳過該區域
      if (this.Balance_Num < doubleAmount) {
        this.toast.showToast(`❌ 餘額不足，無法在加倍下注！`);
        continue;
      }

      //  餘額足夠，執行加倍下注邏輯
      this.Balance_Num -= doubleAmount; // 扣除餘額
      this.Bet_Num += doubleAmount; // 增加總下注金額
      this.betAmounts[areaName] += doubleAmount; // 更新此區的下注金額

      // 依照加倍金額產生籌碼並顯示在畫面上
      let remaining = doubleAmount;
      const chipsToCreate: number[] = []; // 暫存每顆籌碼的面額

      while (remaining > 0) {
        const chipValue = this.getClosestChip(remaining); // 根據剩餘金額取出最接近的籌碼面額
        this.createChipInArea(betNode, chipValue, actionId); // 在該下注區生成籌碼
        chipsToCreate.push(chipValue); // 紀錄這次生成籌碼
        remaining -= chipValue; // 扣除已使用的籌碼金額
      }

      doubleActions.push({
        areaName,
        amount: doubleAmount,
        chips: chipsToCreate,
      });

      // 更新下注區域上的金額 Label 顯示
      this.updateBetAmountLabel(betNode, this.betAmounts[areaName]);
    }

    if (doubleActions.length > 0) {
      this.actionHistory.push({
        type: 'double',
        actions: doubleActions,
        actionId,
      });
    }

    // 最後統一更新畫面上的 Balance / Bet / Win 顯示
    this.updateGlobalLabels();
  }

  // 點擊undo(撤銷)按鈕
  undoBet() {
    this.Audio.AudioSources[1].play(); // 播放按鈕音效
    if (this.actionHistory.length === 0) {
      this.toast.showToast('❌ 沒有可撤銷的動作');
      return;
    }

    const lastAction = this.actionHistory.pop();
    const actionId = lastAction.actionId;
    console.log('🔙 Undo Action:', lastAction);

    for (const { areaName, amount, chips } of lastAction.actions.reverse()) {
      const betNode = this.betAreaNodes.find((node) => node.name === areaName);
      if (!betNode) continue;

      this.Balance_Num += amount;
      this.Bet_Num -= amount;
      this.betAmounts[areaName] -= amount;
      if (this.betAmounts[areaName] <= 0) delete this.betAmounts[areaName];

      const chipsToRemove = [...betNode.children].filter((c) => c.name === 'Chip' && c['actionId'] === actionId);
      chipsToRemove.forEach((c) => c.destroy());

      this.updateBetAmountLabel(betNode, this.betAmounts[areaName] || 0);
    }

    this.updateGlobalLabels();
    this.updateStartButton(); // 更新 Start 按鈕是否可用
  }

  // 點擊 clear 按鈕
  clearBets() {
    this.Audio.AudioSources[1].play(); // 播放按鈕音效
    // 1. 將所有下注金額退還給玩家餘額
    for (const areaName in this.betAmounts) {
      const amount = this.betAmounts[areaName] || 0;
      this.Balance_Num += amount; // 歸還下注金額
    }

    // 2. 清空下注總額與區域下注紀錄
    this.Bet_Num = 0;
    this.betAmounts = {};

    // 3. 移除所有下注區中的籌碼節點
    for (const betNode of this.betAreaNodes) {
      const chips = betNode.children.filter((child) => child.name === 'Chip');
      for (const chip of chips) {
        chip.destroy(); // 移除籌碼節點
      }

      // 4. 清除下注區金額文字
      this.updateBetAmountLabel(betNode, 0);
    }

    // 5. 更新下方總下注金額與餘額顯示
    this.updateGlobalLabels();

    this.updateStartButton(); // 清除後可能沒下注，Start 要變灰
  }

  // ================ Agaon 與 Auto 按鈕 =================
  // 點擊 Again 按鈕(重複上次下注)
  onAgainBet() {
    // 檢查是否有上次下注的紀錄
    if (!this.lastBetAmounts || Object.keys(this.lastBetAmounts).length === 0) {
      this.toast.showToast('尚無可重複的下注紀錄');
      return;
    }

    const actionId = Date.now(); // 可用時間戳當作唯一 ID
    const actions: {
      areaName: string;
      amount: number;
      chips: number[];
    }[] = [];

    // 遍歷每個上次下注的區域與金額
    for (const areaName in this.lastBetAmounts) {
      const totalAmount = this.lastBetAmounts[areaName];
      const areaNode = this.betAreaNodes.find((node) => node.name === areaName); // 找下注節點
      if (!areaNode) continue;

      let remaining = totalAmount;
      const chips: number[] = [];

      // 根據金額分拆籌碼
      while (remaining > 0) {
        const chip = this.getClosestChip(remaining); // 呼叫自有方法

        // 若餘額不足，則中止下注
        if (this.Balance_Num < chip) {
          this.toast.showToast('餘額不足，無法重複下注');
          return;
        }

        // 使用 performBet 進行實際下注邏輯（會自動更新畫面與記錄單筆 chip）
        this.performBet(areaNode, chip, actionId, 'again');
        chips.push(chip);
        remaining -= chip;
      }

      // 紀錄每個區域下注的總比數與金額
      actions.push({
        areaName,
        amount: totalAmount,
        chips,
      });
    }
    // push 一筆綜合紀錄, 方便 undo / auto 使用
    this.actionHistory.push({
      type: 'again',
      actionId,
      actions,
    });
  }
}
