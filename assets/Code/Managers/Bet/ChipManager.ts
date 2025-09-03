import { _decorator, Button, CCInteger, Component, find, instantiate, Label, Node, Prefab, Sprite, SpriteFrame, tween, Vec3 } from 'cc';
import { AudioManager } from '../../Managers/Audio/AudioManager';
import { BetHighlighter } from '../../Animation/BetHightlight';
import { ExtraPayController } from '../ExtraPayController';
import { player } from '../../Login/playerState';
import { ToastMessage } from '../../Managers/Toasts/ToastMessage';
const { ccclass, property } = _decorator;

@ccclass('ChipManager')
export class ChipManager extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  //////////////////////////////////////////////////////////////////////////////
  @property(Sprite) AutoSprite: Sprite = null; // 按鈕上預設圖示
  @property(SpriteFrame) AutoSpriteFrame: SpriteFrame = null; // auto 圖示  (play)
  @property(SpriteFrame) StopSpriteFrame: SpriteFrame = null; // stop圖示 (方)

  @property(Sprite) AutoBouttonSprite: Sprite = null; // 預設按鈕圖片(藍)
  @property(SpriteFrame) AutoStartFrame: SpriteFrame = null; // 按鈕預設圖  (藍)
  @property(SpriteFrame) StopStopFrame: SpriteFrame = null; // 按鈕stop圖 (粉)

  // @property([Node]) betAreaNodes: Node[] = []; // 下注區域節點
  @property({ type: [CCInteger] }) chipValues: number[] = [100, 200, 500, 1000, 10000]; // 對應籌碼金額
  @property([Prefab]) chipPrefabs: Prefab[] = []; // 依序對應 50、100 籌碼(預製體)

  @property(Label) Bet_Label: Label = null; // 顯示下注額度
  @property(Label) Balance_Label: Label = null; // 顯示玩家餘額
  @property(Label) Win_Label: Label = null; // 導入贏得籌碼

  Balance_Num: number = player.currentPlayer.balance; // 初始餘額(未來會連後端)

  Bet_Num: number = 0; // 玩家總下注金額(預設0)
  Win_Num: number = 0; // 初始化0

  // selectedChipValue: number = 100; // 玩家當前籌碼金額 預設100

  betAmounts: { [areaName: string]: number } = {}; // 儲存每個下注區域的累積下注金額(哈希表)
  lastBetAmounts: { [areaName: string]: number } = {}; // 用於儲存上局最後下注資訊

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

  canBet: boolean = false;
  _isAutoMode: boolean = false; // 是否為自動下注模式
  Delay_Show = 2;

  private betAreaNodes: Node[] = [];

  // ✅ 提供 Game.ts 注入下注區節點
  public setBetAreas(nodes: Node[]) {
    this.betAreaNodes = nodes;
    // console.log(
    //   '✅ 已注入下注區節點:',
    //   nodes.map((n) => n.name)
    // );
  }

  // ✅ ChipManager 自己用
  public getBetAreas(): Node[] {
    return this.betAreaNodes;
  }

  onLoad() {}

  //? ===============================================================================

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

  //? 1) 新增籌碼圖像並加入下注區（重疊）
  public createChipInArea(betNode: Node, chipValue: number, actionId: number) {
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
    newChip.setScale(new Vec3(1.0, 1.0, 1)); // 初始縮小
    tween(newChip)
      .to(0.1, { scale: new Vec3(1.4, 1.4, 1) }) // 瞬間放大
      .to(0.1, { scale: new Vec3(1.2, 1.2, 1) }) // 縮回正常大小
      .start();

    this.Audio.AudioSources[1].play(); // 播放押注(索引2)音效
  }

  // 更新下注區 Label 顯示的金額
  public updateBetAmountLabel(betNode: Node, newAmount: number) {
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

  //? 取最接近且不超過某個值的籌碼金額
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

  private mergeTimers: { [key: string]: (() => void) | null } = {}; // 每個下注區各自紀錄一個計時器 callback
  //? 2) 下注主要邏輯
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

    // console.log("🔨 正在下注，滑鼠尚未放開");
    // this.updateStartButton(); // 每次下注後都更新 Start 按鈕狀態  (改用事件通知 防止循環依賴)
    this.node.emit('bet-updated');
    console.log('收到 bet-updated 按鈕開關方法');

    // 1) 如果該區已有計時器 > 先清掉
    if (this.mergeTimers[areaName]) {
      this.unschedule(this.mergeTimers[areaName]);
      this.mergeTimers[areaName] = null;
    }

    // 2) 建立一個新 callback function
    const callback = () => {
      this.mergeChips(betNode);
      this.mergeTimers[areaName] = null;
    };

    // 3) 啟動 1 秒後執行
    this.scheduleOnce(callback, 1.0);

    // 4) 紀錄 callback 方便 unschedule
    this.mergeTimers[areaName] = callback;

    return {
      areaName,
      amount: chipValue,
      chips: [chipValue],
    };
  }

  // 高亮下注區域（用於中獎提示或視覺效果）
  public highlightBetArea(betKey: string) {
    // console.log("🎯 highlightBetArea:", betKey);
    // console.log("👉 對應 index:", index);
    // const index = this.betManager.getBetAreasNodes(betKey);
    const node = this.getBetAreas().find((n) => n.name === betKey); // 直接從已注入的 betAreaNodes 找 node
    if (!node) return;

    const highlighter = node.getComponent(BetHighlighter); // 撈子節點getComponentInChildren  撈父節點getComponent
    if (highlighter) {
      this.scheduleOnce(() => {
        highlighter.showWinEffect();
      }, this.Delay_Show);
    }

    const hoverLight = node.getChildByName('framelight');
    if (hoverLight) {
      hoverLight.active = true; // 顯示高亮效果

      this.scheduleOnce(() => {
        hoverLight.active = false; // 延遲後隱藏高亮效果
      }, this.Delay_Show + 1);
    }

    // ✅ 直接讓 Button 可互動
    const btn = node.getComponent(Button);
    if (btn) btn.interactable = true;
  }

  // 清除下注區上的 ExtraPay 標記
  public clearAllExtraPayMarks() {
    for (const node of this.getBetAreas()) {
      const controller = node.getComponentInChildren(ExtraPayController);
      if (controller) controller.hide(); // hide() 就是讓 .active = false
    }
  }

  // 更新下方的 Bet / Balance / Win 顯示
  public updateGlobalLabels() {
    // 更新下注金額與餘額文字顯示
    if (this.Bet_Label) {
      this.Bet_Label.string = (this.Bet_Num ?? 0).toFixed(2);
    }
    if (this.Balance_Label) this.Balance_Label.string = (this.Balance_Num ?? 0).toFixed(2); // 保留兩位小數
    if (this.Win_Label) {
      this.Win_Label.string = (this.Win_Num ?? 0).toFixed(2);
    }
  }

  // ================== 最後合併成 1 顆籌碼,並顯示金額 ================================
  private getChipPrefabByAmount(amount: number): Prefab {
    if (amount < 200) return this.chipPrefabs[0];
    if (amount < 500) return this.chipPrefabs[1];
    if (amount < 1000) return this.chipPrefabs[2];
    if (amount < 10000) return this.chipPrefabs[3];
    return this.chipPrefabs[4];
  }

  // =============== 把該區域籌碼合併 ===============================
  public mergeChips(betNode: Node) {
    const totalAmount = this.betAmounts[betNode.name] || 0;

    // 直接清空該區所有 Chip
    betNode.children.filter((c) => c.name === 'Chip').forEach((c) => c.removeFromParent()); // ⚠️ 這樣立即移除，不等下一幀

    if (totalAmount <= 0) {
      this.updateBetAmountLabel(betNode, 0); // Label 也清空
      return;
    }

    // 選一顆對應級距的籌碼
    const prefab = this.getChipPrefabByAmount(totalAmount);
    const mergedChip = instantiate(prefab);
    mergedChip.name = 'Chip';
    betNode.addChild(mergedChip);
    mergedChip.setPosition(0, 0, 0);
    mergedChip.setScale(new Vec3(1.2, 1.2, 1));

    // 隱藏掉舊的圖片數字 (Number)
    // const numberNode = mergedChip.getChildByName('Number');
    const numberNode = find('ChangeColor/Number', mergedChip);
    // if (numberNode) {
    // console.log(`✅ 找到 Number 節點 (Prefab=${prefab.name})`);
    numberNode.active = false;
    // } else {
    //   console.warn(`⚠️ 沒找到 Number 節點 (Prefab=${prefab.name})`);
    // }

    // 嘗試更新 Label 數字
    // const amountLabel = mergedChip.getChildByName('AmountLabel')?.getComponent(Label);
    const amountNode = find('ChangeColor/AmountLabel', mergedChip);
    if (amountNode) {
      const amountLabel = amountNode.getComponent(Label);
      if (amountLabel) {
        // console.log(`✅ 找到 AmountLabel 節點 (Prefab=${prefab.name})`);
        amountLabel.string = String(totalAmount);
        amountLabel.node.active = true;
        // 動態縮放
        amountLabel.fontSize = totalAmount >= 10000 ? 24 : 30;
      }
    } else {
      console.warn(`⚠️ 沒找到 AmountLabel 節點 (Prefab=${prefab.name})`);
    }
  }

  //   // ================ Agaon 與 Auto 按鈕 (尚未使用) 用來重複下注上局下注區籌碼與金額 =================
  // 點擊 Again 按鈕(重複上次下注)
  onAgainBet() {
    // 檢查是否有上次下注的紀錄
    if (!this.lastBetAmounts || Object.keys(this.lastBetAmounts).length === 0) {
      ToastMessage.showToast('尚無可重複的下注紀錄');
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
      const areaNode = this.getBetAreas().find((node) => node.name === areaName); // 找下注節點
      if (!areaNode) continue;

      let remaining = totalAmount;
      const chips: number[] = [];

      // 根據金額分拆籌碼
      while (remaining > 0) {
        const chip = this.getClosestChip(remaining); // 呼叫自有方法

        // 若餘額不足，則中止下注
        if (this.Balance_Num < chip) {
          ToastMessage.showToast('餘額不足，無法重複下注');
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
