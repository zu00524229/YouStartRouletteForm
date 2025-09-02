import { _decorator, Component, EventTouch, Node } from 'cc';
import { ChipManager } from './ChipManager';
import { BetManager } from './BetManager';
import { ToastMessage } from '../../Managers/Toasts/ToastMessage';
import { player } from '../../Login/playerState';
import { Toast } from '../Toasts/Toast';

const { ccclass, property } = _decorator;

@ccclass('BetController')
export class BetController extends Component {
  @property(ChipManager) chipManager: ChipManager = null; // 拖有 ChipManager 的節點
  @property(BetManager) betManager: BetManager = null; // 拖有 BetManager 的節點
  @property(Toast) toast: Toast = null; // 拖 有掛載 Toast 腳本的節點

  Balance_Num: number = player.currentPlayer.balance; // 初始餘額(未來會連後端)

  private currentActionId = 0;
  selectedChipValue: number = 100; // 玩家當前籌碼金額 預設100
  totalNeeded: number = 0;

  onLoad() {
    this.totalNeeded = this.selectedChipValue * this.betManager.getAllBetAreas().length; // 總共需要的下注金額(每個下注區域都下注選擇的籌碼金額) 用來判斷餘額夠不夠
  }

  // ========== 下注區域點擊事件 ==========
  public BetClick(event: EventTouch) {
    // console.log('👉 BetClick 被觸發:', event.currentTarget?.name);

    if (this.canPlaceBet()) {
      this.onBetClick(event);
    }
  }

  // 禁止下注
  public canPlaceBet() {
    return !this.toast.BetLocked.active && !this.chipManager.isLotteryRunning() && !this.chipManager._isAutoMode;
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
    if (this.Balance_Num < chipValue) {
      console.log('❌ 餘額不足，無法下注！');
      ToastMessage.showToast('餘額不足，無法下注！'); // 呼叫方法(提示訊息框)
      return;
    }

    this.chipManager.performBet(betNode, chipValue, actionId, 'bet');
  }

  // // 清除籌碼(結算)
  // clearAllBets(): void {
  //   // 歸零 betAmounts 中每個下注區的金額
  //   for (const key in this.betAmounts) {
  //     if (this.betAmounts.hasOwnProperty(key)) {
  //       this.betAmounts[key] = 0;
  //     }
  //   }
  //   // 清除每個下注區的籌碼圖像與金額文字
  //   for (const betNode of this.betAreaNodes) {
  //     //  清除籌碼圖像
  //     const chips = betNode.children.filter((child) => child.name === 'Chip');
  //     for (const chip of chips) {
  //       chip.destroy(); // 移除籌碼節點（推薦 destroy 而不是 removeFromParent）
  //     }

  //     // 清除下注金額文字
  //     this.updateBetAmountLabel(betNode, 0);
  //   }

  //   // 重設總下注金額
  //   this.Bet_Num = 0;

  //   // 更新下方的總下注 / 餘額 / 贏得金額顯示
  //   this.updateGlobalLabels();
  // }

  // // ================== 點擊 All Bet 按鈕觸發 ====================
  //   onAllBetClick() {
  //     this.Audio.AudioSources[0].play(); // 播放按鈕音效
  //     // 確認餘額是否足夠
  //     const totalNeeded = this.selectedChipValue * this.betAreaNodes.length;
  //     if (this.Balance_Num < totalNeeded) {
  //       ToastMessage.showToast('餘額不足，無法全部下注');
  //       return;
  //     }

  //     const actionId = ++this.currentActionId;
  //     const actionRecord = {
  //       type: 'bet' as const,
  //       actionId: actionId,
  //       actions: [] as {
  //         areaName: string;
  //         amount: number;
  //         chips: number[];
  //       }[],
  //     };

  //     // 遍歷所有下注區域
  //     for (const betNode of this.betAreaNodes) {
  //       const areaName = betNode.name;

  //       // 扣除餘額與累加下注金額
  //       this.Balance_Num -= this.selectedChipValue;
  //       this.Bet_Num += this.selectedChipValue;

  //       // 更新下注區金額
  //       const currentAmount = this.betAmounts[areaName] ?? 0;
  //       const newAmount = currentAmount + this.selectedChipValue;
  //       this.betAmounts[areaName] = newAmount;

  //       // 建立籌碼圖像
  //       this.createChipInArea(betNode, this.selectedChipValue, actionId);

  //       // 更新下注區金額 Label
  //       this.updateBetAmountLabel(betNode, newAmount);

  //       // 加入動作紀錄
  //       actionRecord.actions.push({
  //         areaName: areaName,
  //         amount: this.selectedChipValue,
  //         chips: [this.selectedChipValue],
  //       });
  //     }

  //     // 加入歷史堆疊
  //     this.actionHistory.push(actionRecord);

  //     // 更新畫面下方資訊
  //     this.updateGlobalLabels();

  //     this.updateStartButton(); // 全部下注後也要更新按鈕
  //   }

  //   // ================ ToolButtons 區域 =================
  //   // 點擊 Double 按鈕(當前所有下注區的金額加倍下注)
  //   onDoubleClick() {
  //     this.Audio.AudioSources[0].play(); // 播放按鈕音效
  //     const doubleActions = [];
  //     const actionId = ++this.currentActionId; // 每次加倍下注都產生新的 actionId

  //     // 遍歷所有下注區域節點
  //     for (const betNode of this.betAreaNodes) {
  //       const areaName = betNode.name; // 取得下注區名稱
  //       const currentAmount = this.betAmounts[areaName] || 0; // 取得該區已下注金額，預設為 0

  //       if (currentAmount === 0) continue; // 若該區尚未下注，跳過這一圈
  //       const doubleAmount = currentAmount; // 要額外再下注相同金額（加倍）

  //       // 餘額不足，無法加倍，跳過該區域
  //       if (this.Balance_Num < doubleAmount) {
  //         ToastMessage.showToast(`❌ 餘額不足，無法在加倍下注！`);
  //         continue;
  //       }

  //       //  餘額足夠，執行加倍下注邏輯
  //       this.Balance_Num -= doubleAmount; // 扣除餘額
  //       this.Bet_Num += doubleAmount; // 增加總下注金額
  //       this.betAmounts[areaName] += doubleAmount; // 更新此區的下注金額

  //       // 依照加倍金額產生籌碼並顯示在畫面上
  //       let remaining = doubleAmount;
  //       const chipsToCreate: number[] = []; // 暫存每顆籌碼的面額

  //       while (remaining > 0) {
  //         const chipValue = this.getClosestChip(remaining); // 根據剩餘金額取出最接近的籌碼面額
  //         this.createChipInArea(betNode, chipValue, actionId); // 在該下注區生成籌碼
  //         chipsToCreate.push(chipValue); // 紀錄這次生成籌碼
  //         remaining -= chipValue; // 扣除已使用的籌碼金額
  //       }

  //       doubleActions.push({
  //         areaName,
  //         amount: doubleAmount,
  //         chips: chipsToCreate,
  //       });

  //       // 更新下注區域上的金額 Label 顯示
  //       this.updateBetAmountLabel(betNode, this.betAmounts[areaName]);
  //     }

  //     if (doubleActions.length > 0) {
  //       this.actionHistory.push({
  //         type: 'double',
  //         actions: doubleActions,
  //         actionId,
  //       });
  //     }

  //     // 最後統一更新畫面上的 Balance / Bet / Win 顯示
  //     this.updateGlobalLabels();
  //   }

  //   // 點擊undo(撤銷)按鈕
  //   undoBet() {
  //     this.Audio.AudioSources[0].play(); // 播放按鈕音效
  //     if (this.actionHistory.length === 0) {
  //       ToastMessage.showToast('❌ 沒有可撤銷的動作');
  //       return;
  //     }

  //     const lastAction = this.actionHistory.pop();
  //     const actionId = lastAction.actionId;
  //     console.log('🔙 Undo Action:', lastAction);

  //     for (const { areaName, amount, chips } of lastAction.actions.reverse()) {
  //       const betNode = this.betAreaNodes.find((node) => node.name === areaName);
  //       if (!betNode) continue;

  //       this.Balance_Num += amount;
  //       this.Bet_Num -= amount;
  //       this.betAmounts[areaName] -= amount;
  //       if (this.betAmounts[areaName] <= 0) delete this.betAmounts[areaName];

  //       const chipsToRemove = [...betNode.children].filter((c) => c.name === 'Chip' && c['actionId'] === actionId);
  //       chipsToRemove.forEach((c) => c.destroy());

  //       this.updateBetAmountLabel(betNode, this.betAmounts[areaName] || 0);
  //     }

  //     this.updateGlobalLabels();
  //     this.updateStartButton(); // 更新 Start 按鈕是否可用
  //   }

  //   // 點擊 clear 按鈕
  //   clearBets() {
  //     this.Audio.AudioSources[0].play(); // 播放按鈕音效
  //     // 1. 將所有下注金額退還給玩家餘額
  //     for (const areaName in this.betAmounts) {
  //       const amount = this.betAmounts[areaName] || 0;
  //       this.Balance_Num += amount; // 歸還下注金額
  //     }

  //     // 2. 清空下注總額與區域下注紀錄
  //     this.Bet_Num = 0;
  //     this.betAmounts = {};

  //     // 3. 移除所有下注區中的籌碼節點
  //     for (const betNode of this.betAreaNodes) {
  //       const chips = betNode.children.filter((child) => child.name === 'Chip');
  //       for (const chip of chips) {
  //         chip.destroy(); // 移除籌碼節點
  //       }

  //       // 4. 清除下注區金額文字
  //       this.updateBetAmountLabel(betNode, 0);
  //     }

  //     // 5. 更新下方總下注金額與餘額顯示
  //     this.updateGlobalLabels();

  //     this.updateStartButton(); // 清除後可能沒下注，Start 要變灰
  //   }

  //   // ================ Agaon 與 Auto 按鈕 =================
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
