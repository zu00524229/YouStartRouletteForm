import { _decorator, Component, director, EventTouch, find, Label, Node, Prefab } from 'cc';
import { BetController } from './Managers/Bet/BetController';
import { StartTouch } from './Managers/Touch/StartTouch';
import { AudioManager } from './Managers/Audio/AudioManager';
import { ChipManager } from './Managers/Bet/ChipManager';
import { SignalRClient } from './Signal/SignalRClient';
import { LotteryResponse, SIGNALR_EVENTS, UnifiedLotteryEvent } from './Type/Types'; // 型別呼叫
import { Toast } from './Managers/Toasts/Toast';
import { LotteryCache, TurnLottery } from './TurnLottery';
import { player } from './Login/playerState';
import { ToastMessage } from './Managers/Toasts/ToastMessage';
import { BetManager } from './Managers/Bet/BetManager';
import { ToolButtonsController } from './Managers/ToolButtonsController';
const { ccclass, property } = _decorator;

@ccclass('index')
export class index extends Component {
  @property(Label) ID_Label: Label = null;
  @property(Label) TimeLabel: Label = null;
  @property(Node) WheelSprite_Node: Node = null; // 導入輪盤自身節點
  @property(Node) Poin_Node: Node = null; // 導入指針父節點

  @property(Prefab) Pointer_Prefab: Prefab = null; // 導入指針預製體

  @property(ToolButtonsController) toolButton: ToolButtonsController = null; // 脫有 ToolButtonController 的節點
  @property(TurnLottery) Lottery: TurnLottery = null; // 連結 TurnLottery
  @property(ChipManager) chipManager: ChipManager = null; // 連結 ChipManager
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  @property(BetManager) betManager: BetManager = null; // 連結 BetManager
  @property(BetController) betController: BetController = null; // 連結 BetManager

  // 玩家目前選擇的籌碼金額(在chipManager.ts中管理)
  @property(Toast) toast: Toast = null; // 連結 Toast 腳本

  // private betManager: BetManager | null = null;
  public static isLoggedIn: boolean = false; // 預設未登入
  private roundIdLabel: Label | null = null;

  // public setBetManager(manager: BetManager) {
  //   this.betManager = manager;
  // }

  // === 初始化階段 ===
  protected onLoad(): void {
    // 先顯示登入面板
    const loginPanelNode = this.node.getChildByName('login');
    if (loginPanelNode) {
      loginPanelNode.active = true;
    }
    index.isLoggedIn = false;

    // // 建立 SignalR 連線
    // SignalRClient.connect((user, msg) => {
    //   console.log(`${user}: ${msg}`);
    // });

    this.ID_Label.string = `帳號： ${player.currentPlayer.username}`;

    // ============ StartTouch 組件綁定事件 ==============
    const startTouch = this.getComponentInChildren(StartTouch); // 取得 StartTouch 組件
    if (startTouch) {
      startTouch.node.on(
        'start-press',
        () => {
          if (this.chipManager._isAutoMode) {
            this.onAutoBet(); // 如果在 Auto 模式，短按也觸發 onAutoBet
            if (!this.toast.PleaseBetNow.active) this.betManager.offLightButton(false); // 短按才開遮罩(觸發start)
          } else {
            this.onStartButton(); // 否則觸發 onStartButton
            this.betManager.offLightButton(false); // 一般 Start 也要遮罩
          }
        },
        this
      ); // 短按事件綁定到 onStartButton 方法
      startTouch.node.on(
        'auto-press',
        () => {
          this.onAutoBet(); // 長按 → 啟動 Auto
          this.betManager.offLightButton(true); // 長按 → 換圖但不開遮罩
        },
        this
      );
    }

    // ========= 接收 PICK 回傳的值 ==============
    if (LotteryCache.lastResult?.balanceAfterWin) {
      this.chipManager.Balance_Num = LotteryCache.lastResult.balanceAfterWin;
    }
    // 播背景音樂（使用者點一下才播放）
    // const bgm = this.Audio?.AudioSources?.[0];
    // const tryPlayBGM = () => {
    //   if (bgm) {
    //     bgm.loop = true;
    //     bgm.play();
    //     console.log('🎵 播放背景音樂');
    //   }
    //   window.removeEventListener('mousedown', tryPlayBGM);
    //   window.removeEventListener('touchstart', tryPlayBGM);
    // };
    // window.addEventListener('mousedown', tryPlayBGM, { once: true });
    // window.addEventListener('touchstart', tryPlayBGM, { once: true });

    // // 切出視窗時暫停遊戲與音樂，切回來恢復
    // document.addEventListener('visibilitychange', () => {
    //   if (document.visibilityState === 'hidden') {
    //     game.pause();
    //     bgm?.pause();
    //   } else if (document.visibilityState === 'visible') {
    //     game.resume();
    //     bgm?.play();
    //   }
    // });

    // // 切換分頁或最小化
    // document.addEventListener('visibilitychange', () => {
    //   if (document.visibilityState === 'hidden') {
    //     game.pause();
    //     bgm?.pause();
    //   } else if (document.visibilityState === 'visible') {
    //     game.resume();
    //     bgm?.play();
    //   }
    // });

    // // 切到別的應用程式 / 雙螢幕移開視窗
    // window.addEventListener('blur', () => {
    //   game.pause();
    //   bgm?.pause();
    // });
    // window.addEventListener('focus', () => {
    //   game.resume();
    //   bgm?.play();
    // });

    // 當事件 OnLotteryResult 被觸發時，就執行對應的回呼函式（抽獎結果處理）
    director.on(SIGNALR_EVENTS.UNIFIED_LOTTERY_EVENT, this.handleLotteryResult, this);

    // 當事件 GetLottryRewardRstEvent 被觸發時，重啟 UI 狀態
    director.on('LotteryEnded', this.onLotteryEnd, this);
    this.toolButton.isLotteryRunning = () => this.Lottery._isLottery; // 委派注入(TrunLottery 的變數值)

    // 撈局號 Label 節點
    const roundIdNode = find('Canvas/UI/RoundId/roundId');
    this.roundIdLabel = roundIdNode?.getComponent(Label) || null;
  }

  // ==== 回調Lottery 抽獎(PICK)結束後的值 ========
  private handleLotteryResult = (data: UnifiedLotteryEvent) => {
    if (this.roundIdLabel) this.roundIdLabel.string = `# ${data.roundId}`;
    this.Lottery.onGetLotteryRewardRstEventCallback(data);
  };

  onSendClick() {
    SignalRClient.sendMessage('Player1', 'Hello from Cocos');
  }

  onDisable() {
    director.off('LotteryResultEvent', this.handleLotteryResult, this);
    director.off('LotteryEnded', this.onLotteryEnd, this);
  }

  // === START 啟動輪盤 ===
  onStartButton() {
    if (this.toast.PleaseBetNow.active) {
      this.toast.PleaseBetNow.active = false; // 🚀 玩家搶按 → 直接關掉提示並繼續流程
    } // 遊戲開始提示玩家下注訊息顯示時，則不能使用START

    this.chipManager.lastBetAmounts = { ...this.chipManager.betAmounts }; // 儲存上局最後下注資訊 使用淺拷貝避免引用同一物件）
    console.log('上局下注資料:', this.chipManager.lastBetAmounts);

    if (this.chipManager._isAutoMode) {
      this.toolButton.AllButton.interactable = false;
    } else {
      this.toolButton.AllButton.interactable = true;
    }

    this.Lottery.onGoLotterEventCallback(); // 轉盤轉動(隨機抽獎)
    window.addEventListener('error', function (e) {
      console.error('🔴 Global Error 捕捉：', e.message, e.filename, e.lineno, e.colno);
    });
  }

  //=================== 點擊 Auto 按鈕(自動下注) ===================
  onAutoBet() {
    // 播放音效
    this.Audio.AudioSources[0].play(); // 播放按鈕音效

    // 如果 Auto 模式已開啟 → 停止
    if (this.chipManager._isAutoMode) {
      this.chipManager._isAutoMode = false; // 關閉 Auto 模式
      this.chipManager.AutoSprite.spriteFrame = this.chipManager.AutoSpriteFrame; // 更新 Auto 按鈕圖片
      this.chipManager.AutoBouttonSprite.spriteFrame = this.chipManager.AutoStartFrame; // 更新 Auto 按鈕圖片 (藍)
      console.log('🛑 Auto 模式已手動關閉');
      // this.toast.showToast("Auto 模式已關閉");
      this.toolButton.updateStartButton();
      return;
    }

    // if (this.chipManager._isAutoMode) {
    //   console.warn('已在轉動或 Auto 排程中，忽略此次點擊');
    //   return;
    // }

    // 開啟 Auto 模式
    this.chipManager._isAutoMode = true;
    this.chipManager.AutoSprite.spriteFrame = this.chipManager.StopSpriteFrame; // 更新 Auto 按鈕圖片(Stop)
    this.chipManager.AutoBouttonSprite.spriteFrame = this.chipManager.StopStopFrame; // 更新 Auto 按鈕圖片(粉)

    // 儲存目前下注狀態作為 lastBetAmounts（只做一次）
    this.chipManager.lastBetAmounts = { ...this.chipManager.betAmounts };
    console.log('Auto 模式已啟動，下注內容：', this.chipManager.lastBetAmounts);
    // this.toast.showToast("Auto 模式啟動中");

    this.Lottery._isAutoRunning = true;

    // 直接進入轉盤（等同按下 Start）
    this.Lottery.onGoLotterEventCallback(); // 轉盤轉動(隨機抽獎)
  }

  // 給Auto 模式使用 重複上局下注
  rebetAndStart(): void {
    console.log('🔄 進入 rebetAndStart()，Auto 模式檢查中');
    const lastBets = this.chipManager.lastBetAmounts || {};
    console.log('💰 Auto下注內容：', lastBets);

    // 計算上局總下注金額
    let totalNeeded = 0;
    for (const areaName in lastBets) {
      if (Object.prototype.hasOwnProperty.call(lastBets, areaName)) {
        totalNeeded += Number(lastBets[areaName]) || 0;
      }
    }

    // 檢查餘額是否足夠
    if (this.chipManager.Balance_Num < totalNeeded) {
      console.warn('🛑 餘額不足，停止自動下注');
      this.chipManager._isAutoMode = false;
      this.Lottery._isAutoRunning = false;
      this.toolButton.updateStartButton();
      ToastMessage.showToast('餘額不足，自動已停止');

      // 還原
      this.chipManager.AutoSprite.spriteFrame = this.chipManager.AutoSpriteFrame; // 更新 Auto 按鈕圖片
      this.chipManager.AutoBouttonSprite.spriteFrame = this.chipManager.AutoStartFrame; // 更新 Auto 按鈕圖片 (藍)
      // this.chipManager.AllButton.interactable = true;
      return; // 不夠錢就不下注，直接退出
    }
    // let totalBet = 0;

    // 遍歷每個下注區的上局金額，逐一補上籌碼
    for (const areaName in lastBets) {
      const amount = lastBets[areaName];
      if (amount > 0) {
        // const areaIndex = this.chipManager.betAreaMap[areaName];
        const betNode = this.chipManager.getBetAreas().find((n) => n.name === areaName);

        if (!betNode) continue;
        let remaining = amount;
        const actionId = ++this.betController.currentActionId;

        // 拆分下注金額成最接近的籌碼，並下注
        while (remaining > 0) {
          const chipValue = this.chipManager.getClosestChip(remaining);
          const result = this.chipManager.performBet(betNode, chipValue, actionId, 'again');
          if (result) {
            this.chipManager.actionHistory.push({
              type: 'again',
              actionId,
              actions: [result],
            });
          }

          // const actionId = this.chipManager.actionHistory.length + 1;

          // this.chipManager.performBet(betNode, chipValue, actionId, 'again');
          remaining -= chipValue;
        }
        // 最後統一合併
        this.chipManager.mergeChips(betNode);
      }
    }
    // 延遲啟動
    this.scheduleOnce(() => {
      this.onStartButton(); //開始下一輪轉盤
    }, 0.25);
  }
  // ========== 當轉盤結束後觸發 ==========
  onLotteryEnd() {
    // 如果 Auto 模式是開的，就再來一輪
    if (this.chipManager._isAutoMode) {
      this.scheduleOnce(() => {
        this.rebetAndStart(); // 重播下注並啟動轉盤
      }, 0.25); // 延遲 0.3 秒啟動下一輪（可調）
    }
  }

  // === 遊戲 UI 更新 ===
  start() {
    console.log('🎮 遊戲開始！');

    this.chipManager.setBetAreas(this.betManager.getAllBetAreas()); // ✅ 把 BetManager 的下注區節點，注入給 ChipManager

    for (const betNode of this.betManager.getAllBetAreas()) {
      // console.log('🎯 綁定下注區事件:', betNode.name);
      // betNode.on(Node.EventType.TOUCH_END, this.betController.BetClick, this.betController);
      betNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
        this.betController.BetClick(event);
      });
    }

    if (player.isLoggedIn) {
      console.log(`✅ 有玩家資料，帳號=${player.currentPlayer.username}, 餘額=${player.currentPlayer.balance}`);
    } else {
      console.warn('⚠️ 尚未登入玩家');
    }
    this.toolButton.updateStartButton(); // 判斷 Start 與 下排按鈕是否啟用
    this.toast.showPleaseBetNow(); // 遊戲開始顯示提示(玩家下注)

    this.scheduleOnce(() => {
      this.toast.hidePleaseBetNow();
    }, 1); // 1秒後隱藏提示

    //=================== StatusBar 顯示區 ====================
    this.chipManager.updateGlobalLabels(); // 更新下方的 Bet / Balance / Win 顯示
    this.updateTime();
    this.schedule(this.updateTime, 1);
    // this.TimeLabel.string = '時間';
  }

  updateTime() {
    const now = new Date();
    const h = (now.getHours() < 10 ? '0' : '') + now.getHours();
    const m = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    this.TimeLabel.string = `時間：${h}:${m}`;
  }

  update(deltaTime: number) {}
}
