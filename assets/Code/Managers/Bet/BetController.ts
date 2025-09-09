import { _decorator, Component, EventTouch, Node } from 'cc';
import { ChipManager } from './ChipManager';
import { BetManager } from './BetManager';
import { ToastMessage } from '../../Managers/Toasts/ToastMessage';
import { AudioManager } from '../../Managers/Audio/AudioManager';
import { Toast } from '../Toasts/Toast';
import { ToolButtonsController } from '../ToolButtonsController';

const { ccclass, property } = _decorator;

@ccclass('BetController')
export class BetController extends Component {
  @property(ToolButtonsController) toolButton: ToolButtonsController = null; // 脫有 ToolButtonController 的節點
  @property(ChipManager) chipManager: ChipManager = null; // 拖有 ChipManager 的節點
  @property(BetManager) betManager: BetManager = null; // 拖有 BetManager 的節點
  @property(Toast) toast: Toast = null; // 拖 有掛載 Toast 腳本的節點
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager

  // Bet_Num: number = 0; // 玩家總下注金額(預設0)
  // Balance_Num: number = player.currentPlayer.balance; // 初始餘額(未來會連後端)

  public currentActionId = 0; // 下注唯一Id
  selectedChipValue: number = 100; // 玩家當前籌碼金額 預設100
  totalNeeded: number = 0; // 預設總共需要的下注金額

  onLoad() {
    this.totalNeeded = this.selectedChipValue * this.betManager.getAllBetAreas().length; // 總共需要的下注金額(每個下注區域都下注選擇的籌碼金額) 用來判斷餘額夠不夠
  }

  // ========== 下注區域點擊事件(onBetClick用) ==========
  public BetClick(event: EventTouch) {
    // console.log('👉 BetClick 被觸發:', event.currentTarget?.name);

    if (this.canPlaceBet()) {
      this.onBetClick(event);
    }
  }

  // 禁止下注
  public canPlaceBet() {
    return !this.toast.BetLocked.active && !this.toolButton.isLotteryRunning() && !this.chipManager._isAutoMode;
  }

  // ================== 下注區域點擊事件 ==================
  // 下注區域點擊事件（需在下注區域節點）
  onBetClick(event: EventTouch) {
    // console.log('👉 onBetClick 被觸發', event.currentTarget?.name);
    const betNode = event.currentTarget as Node; // 取得被點擊的下注區域節點
    // console.log('🎲 嘗試下注:', betNode.name);

    const chipValue = this.selectedChipValue; // 取得目前選擇的籌碼金額
    const actionId = ++this.currentActionId;

    // 餘額不足就不能下注
    if (this.chipManager.Balance_Num < chipValue) {
      console.log('❌ 餘額不足，無法下注！');
      ToastMessage.showToast('餘額不足，無法下注！'); // 呼叫方法(提示訊息框)
      return;
    }

    // 呼叫 ChipManager 執行下注,回傳結果
    const result = this.chipManager.performBetMerged(betNode, chipValue, actionId, 'bet');

    if (result) {
      // ✅ 建立動作紀錄（單擊下注也要 push）
      this.chipManager.actionHistory.push({
        type: 'bet',
        actionId,
        actions: [result], // 單一區域下注
      });
    }

    this.chipManager.updateGlobalLabels();
    this.toolButton.updateStartButton();
  }

  // ================== 點擊 All Bet 按鈕觸發 ====================
  onAllBetClick() {
    this.Audio.AudioSources[0].play(); // 播放按鈕音效

    // 用 ChipManager 的資料源
    const areas = this.chipManager.getBetAreas();
    const selected = this.selectedChipValue;
    // 確認餘額是否足夠
    const totalNeeded = selected * areas.length;
    if (this.chipManager.Balance_Num < totalNeeded) {
      ToastMessage.showToast('餘額不足，無法全部下注');
      return;
    }

    const actionId = ++this.currentActionId;

    // ==== 建立動作紀錄
    const actionRecord = {
      type: 'bet' as const,
      actionId,
      actions: [] as {
        areaName: string;
        amount: number;
        chips: number[];
      }[],
    };

    // 新版直接交給 ChipManager.performBet 方法
    // 遍歷所有下注區域
    for (const betNode of areas) {
      const areaName = betNode.name;

      // this.chipManager.performBet(betNode, selected, actionId, 'bet');
      this.chipManager.performBetMerged(betNode, selected, actionId, 'bet');

      // 加入動作紀錄
      actionRecord.actions.push({
        areaName,
        amount: selected,
        chips: [selected],
      });
    }

    // ==== 把 ALL Bet 的集合動作丟進歷史堆疊 =====
    this.chipManager.actionHistory.push(actionRecord);

    this.chipManager.updateGlobalLabels();

    // All Bet 後更新 Start 按鈕狀態
    this.toolButton.updateStartButton();
  }

  // =========================================== 清除籌碼(結算)  ======================================================
  clearAllBets(): void {
    // 用在轉盤結束後,清除下注區籌碼,進入新的一局
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    // 歸零 betAmounts 中每個下注區的金額
    for (const key in this.chipManager.betAmounts) {
      if (this.chipManager.betAmounts.hasOwnProperty(key)) {
        this.chipManager.betAmounts[key] = 0;
      }
    }
    // 清除每個下注區的籌碼圖像與金額文字
    for (const betNode of this.chipManager.getBetAreas()) {
      //  清除籌碼圖像
      const chips = betNode.children.filter((child) => child.name === 'Chip');
      for (const chip of chips) {
        chip.destroy(); // 移除籌碼節點（推薦 destroy 而不是 removeFromParent）
      }

      // 清除下注金額文字
      this.chipManager.updateBetAmountLabel(betNode, 0);
    }

    // 重設總下注金額
    this.chipManager.Bet_Num = 0;

    // 更新下方的總下注 / 餘額 / 贏得金額顯示
    this.chipManager.updateGlobalLabels();
  }

  // ================ ToolButtons 區域 =================
  // 點擊 Double 按鈕(當前所有下注區的金額加倍下注)
  onDoubleClick() {
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    const actionId = ++this.currentActionId; // 每次加倍下注都產生新的 actionId
    // const doubleActions = [];

    // 建立 Double 的集合動作紀錄
    const actionRecord = {
      type: 'double' as const,
      actionId,
      actions: [] as { areaName: string; amount: number; chips: number[] }[],
    };

    //  先計算全部加倍需要的總金額
    let totalDoubleAmount = 0;
    for (const betNode of this.chipManager.getBetAreas()) {
      const areaName = betNode.name;
      const currentAmount = this.chipManager.betAmounts[areaName] || 0;
      if (currentAmount > 0) {
        totalDoubleAmount += currentAmount; // 加倍需要再補同樣金額
      }
    }

    // 餘額不足，無法加倍，跳過該區域
    if (this.chipManager.Balance_Num < totalDoubleAmount) {
      ToastMessage.showToast(`餘額不足，無法加倍！`);
      return;
    }

    // 餘額足夠 → 執行加倍下注
    for (const betNode of this.chipManager.getBetAreas()) {
      const areaName = betNode.name;
      const currentAmount = this.chipManager.betAmounts[areaName] || 0;
      if (currentAmount === 0) continue;

      // 依照加倍金額產生籌碼並顯示在畫面上
      let remaining = currentAmount;
      // ================== 統一交給 ChipManager.performBet 方法計算 ========================
      while (remaining > 0) {
        const chipValue = this.chipManager.getClosestChip(remaining); // 根據剩餘金額取出最接近的籌碼面額
        // const result = this.chipManager.performBet(betNode, chipValue, actionId, 'bet');
        const result = this.chipManager.performBetMerged(betNode, chipValue, actionId, 'bet');
        if (result) {
          actionRecord.actions.push(result); // 收集下注結果
        }
        remaining -= chipValue;
      }
    }

    // ✅ 最後 push 一次
    if (actionRecord.actions.length > 0) {
      this.chipManager.actionHistory.push(actionRecord);
    }
    this.toolButton.updateStartButton(); // 更新 Start 按鈕
  }

  // 點擊undo(撤銷)按鈕
  undoBet() {
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    if (this.chipManager.actionHistory.length === 0) {
      ToastMessage.showToast('❌ 沒有可撤銷的動作');
      return;
    }

    const lastAction = this.chipManager.actionHistory.pop();
    const actionId = lastAction.actionId;
    console.log('🔙 Undo Action:', lastAction);

    for (const { areaName, amount, chips } of lastAction.actions.reverse()) {
      const betNode = this.chipManager.getBetAreas().find((node) => node.name === areaName);
      if (!betNode) continue;

      this.chipManager.Balance_Num += amount;
      this.chipManager.Bet_Num -= amount;
      this.chipManager.betAmounts[areaName] -= amount;
      if (this.chipManager.betAmounts[areaName] <= 0) delete this.chipManager.betAmounts[areaName];

      const chipsToRemove = [...betNode.children].filter((c) => c.name === 'Chip' && c['actionId'] === actionId);
      chipsToRemove.forEach((c) => c.destroy());

      // this.chipManager.updateBetAmountLabel(betNode, this.chipManager.betAmounts[areaName] || 0);
      // 3. 重新合併並繪製最新籌碼 (金額 + Prefab + Label)
      this.chipManager.mergeChips(betNode);
    }

    this.chipManager.updateGlobalLabels(); // 更新
    this.toolButton.updateStartButton(); // 更新 Start 按鈕是否可用
  }

  // 點擊 clear 按鈕
  clearBets() {
    this.Audio.AudioSources[0].play(); // 播放按鈕音效
    // 1. 將所有下注金額退還給玩家餘額
    for (const areaName in this.chipManager.betAmounts) {
      const amount = this.chipManager.betAmounts[areaName] || 0;
      this.chipManager.Balance_Num += amount; // 歸還下注金額
    }

    // 2. 清空下注總額與區域下注紀錄
    this.chipManager.Bet_Num = 0;
    this.chipManager.betAmounts = {};

    // 3. 移除所有下注區中的籌碼節點
    for (const betNode of this.chipManager.getBetAreas()) {
      const chips = betNode.children.filter((child) => child.name === 'Chip');
      for (const chip of chips) {
        chip.destroy(); // 移除籌碼節點
      }

      // 4. 清除下注區金額文字
      this.chipManager.updateBetAmountLabel(betNode, 0);
    }

    // 5. 更新下方總下注金額與餘額顯示
    this.chipManager.updateGlobalLabels();

    this.toolButton.updateStartButton(); // 清除後可能沒下注，Start 要變灰
  }

  //   // ================ Agaon 與 Auto 按鈕 (尚未使用) 用來重複下注上局下注區籌碼與金額 =================
  //   // 點擊 Again 按鈕(重複上次下注)
  //   onAgainBet() {
  //     // 檢查是否有上次下注的紀錄
  //     if (!this.lastBetAmounts || Object.keys(this.lastBetAmounts).length === 0) {
  //       ToastMessage.showToast('尚無可重複的下注紀錄');
  //       return;
  //     }

  //     const actionId = Date.now(); // 可用時間戳當作唯一 ID
  //     const actions: {
  //       areaName: string;
  //       amount: number;
  //       chips: number[];
  //     }[] = [];

  //     // 遍歷每個上次下注的區域與金額
  //     for (const areaName in this.lastBetAmounts) {
  //       const totalAmount = this.lastBetAmounts[areaName];
  //       const areaNode = this.betAreaNodes.find((node) => node.name === areaName); // 找下注節點
  //       if (!areaNode) continue;

  //       let remaining = totalAmount;
  //       const chips: number[] = [];

  //       // 根據金額分拆籌碼
  //       while (remaining > 0) {
  //         const chip = this.getClosestChip(remaining); // 呼叫自有方法

  //         // 若餘額不足，則中止下注
  //         if (this.Balance_Num < chip) {
  //           ToastMessage.showToast('餘額不足，無法重複下注');
  //           return;
  //         }

  //         // 使用 performBet 進行實際下注邏輯（會自動更新畫面與記錄單筆 chip）
  //         this.performBet(areaNode, chip, actionId, 'again');
  //         chips.push(chip);
  //         remaining -= chip;
  //       }

  //       // 紀錄每個區域下注的總比數與金額
  //       actions.push({
  //         areaName,
  //         amount: totalAmount,
  //         chips,
  //       });
  //     }
  //     // push 一筆綜合紀錄, 方便 undo / auto 使用
  //     this.actionHistory.push({
  //       type: 'again',
  //       actionId,
  //       actions,
  //     });
}
