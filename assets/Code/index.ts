import { _decorator, Collider2D, Component, director, EPhysics2DDrawFlags, EventTouch, game, Label, Node, PhysicsSystem2D, Prefab } from 'cc';
import { AudioManager } from './Audio/AudioManager';
import { ChipManager } from './ChipManager';
import { SignalRClient } from './Signal/SignalRClient';
import { LotteryResponse, SIGNALR_EVENTS, UnifiedLotteryEvent } from './Type/Types'; // 型別呼叫
import { Toast } from './Toast';
import { LotteryCache, TurnLottery } from './TurnLottery';
import { player } from './Login/playerState';
import { ToastMessage } from './Toast/ToastMessage';
const { ccclass, property } = _decorator;

@ccclass('index')
export class index extends Component {
  @property(Label) ID_Label: Label = null;
  @property(Label) TimeLabel: Label = null;
  @property(Node) WheelSprite_Node: Node = null; // 導入輪盤自身節點
  @property(Node) Poin_Node: Node = null; // 導入指針父節點
  // @property([Node]) dotNodes: Node[] = []; // <<< 圓盤小圓點
  // @property(Button) StartButton: Button = null;
  // @property({ type: Button }) AutoButton: Button = null; //

  @property(Prefab) Pointer_Prefab: Prefab = null; // 導入指針預製體

  @property(TurnLottery) Lottery: TurnLottery = null; // 連結 TurnLottery
  @property(ChipManager) chipManager: ChipManager = null; // 連結 ChipManager
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager
  // 玩家目前選擇的籌碼金額(在chipManager.ts中管理)
  @property(Toast) toast: Toast = null; // 連結 Toast 腳本

  public static isLoggedIn: boolean = false; // 預設未登入

  // === 初始化階段 ===
  protected onLoad(): void {
    // 開啟 Debug Draw
    // if (PhysicsSystem2D.instance) {
    //   PhysicsSystem2D.instance.debugDrawFlags =
    //     EPhysics2DDrawFlags.Pair | // 碰撞點
    //     EPhysics2DDrawFlags.CenterOfMass | // 質心
    //     EPhysics2DDrawFlags.Shape; // Collider 形狀
    // }
    // 先顯示登入面板
    const loginPanelNode = this.node.getChildByName('login');
    if (loginPanelNode) {
      loginPanelNode.active = true;
    }
    index.isLoggedIn = false;

    // 建立 SignalR 連線
    SignalRClient.connect((user, msg) => {
      console.log(`${user}: ${msg}`);
    });

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

    // director.on(SIGNALR_EVENTS.LOTTERY_RESULT, this.handleLotteryResult, this); // 🎯 轉盤動畫用
    // // director.on('LotteryResultEvent', this.handleLotteryResult, this);
    // // 💰 錢包更新
    // director.on(SIGNALR_EVENTS.LOTTERY_BALANCE, this.handleLotteryBalance, this);

    // 當事件 GetLottryRewardRstEvent 被觸發時，重啟 UI 狀態
    director.on('LotteryEnded', this.onLotteryEnd, this);
    this.chipManager.isLotteryRunning = () => this.Lottery._isLottery; // 委派注入(TrunLottery 的變數值)

    // 為每個下注區 betNode 綁定 TOUCH_END 事件（點擊下注區時執行 BetClick）
    for (const betNode of this.chipManager.betAreaNodes) {
      betNode.on(Node.EventType.TOUCH_END, this.BetClick, this);
    }
  }

  // ==== 回調Lottery 抽獎(PICK)結束後的值 ========
  private handleLotteryResult = (data: UnifiedLotteryEvent) => {
    this.Lottery.onGetLotteryRewardRstEventCallback(data);
  };

  private _lastLotteryResp: LotteryResponse | null = null;
  // 💰 錢包更新
  private handleLotteryBalance(resp: LotteryResponse) {
    console.log('💰 收到 LotteryResponse：', resp);
    this._lastLotteryResp = resp;
    // this.chipManager.Balance_Num = resp.balanceAfter ?? this.chipManager.Balance_Num;
    // this.chipManager.Win_Num = resp.netChange ?? 0;

    console.log('💰 更新餘額：', this.chipManager.Balance_Num, '淨變化：', this.chipManager.Win_Num);
    // this.chipManager.updateGlobalLabels();
    // ❌ 不直接更新 UI，等整合器 push UnifiedLotteryEvent
  }

  onSendClick() {
    SignalRClient.sendMessage('Player1', 'Hello from Cocos');
  }

  // protected onDestroy(): void {
  //   // director.off("LotteryResultEvent", this.Lottery.onGetLotteryRewardRstEventCallback, this);
  //   director.off('LotteryResultEvent', this.handleLotteryResult, this);
  //   director.off('LotteryEnded', this.onLotteryEnd, this);
  // }
  onDisable() {
    director.off('LotteryResultEvent', this.handleLotteryResult, this);
    director.off('LotteryEnded', this.onLotteryEnd, this);
  }

  // === START 啟動輪盤 ===
  onStartButton() {
    if (this.toast.PleaseBetNow.active) {
      return;
    } // 遊戲開始提示玩家下注訊息顯示時，則不能使用START

    this.chipManager.lastBetAmounts = { ...this.chipManager.betAmounts }; // 儲存上局最後下注資訊 使用淺拷貝避免引用同一物件）
    console.log('上局下注資料:', this.chipManager.lastBetAmounts);

    this.chipManager.AllButton.interactable = true;
    this.chipManager.offLightButton(); // 按下start後 鎖住按鈕(關燈)
    // this.chipManager.setAllMasksActive(true); // 開啟所有mask-2
    this.Lottery.onGoLotterEventCallback(); // 轉盤轉動(隨機抽獎)
    window.addEventListener('error', function (e) {
      console.error('🔴 Global Error 捕捉：', e.message, e.filename, e.lineno, e.colno);
    });
  }

  //=================== 點擊 Auto 按鈕(自動下注) ===================
  onAutoBet() {
    // 播放音效
    this.Audio.AudioSources[1].play(); // 播放按鈕音效

    // 如果 Auto 模式已開啟 → 停止
    if (this.chipManager._isAutoMode) {
      this.chipManager._isAutoMode = false; // 關閉 Auto 模式
      this.chipManager.AutoSprite.spriteFrame = this.chipManager.AutoSpriteFrame; // 更新 Auto 按鈕圖片
      this.chipManager.AutoBouttonSprite.spriteFrame = this.chipManager.AutoStartFrame; // 更新 Auto 按鈕圖片 (藍)
      console.log('🛑 Auto 模式已手動關閉');
      // this.toast.showToast("Auto 模式已關閉");
      this.chipManager.updateStartButton();
      this.chipManager.AllButton.interactable = true;
      return;
    }

    if (this.chipManager._isAutoMode) {
      console.warn('已在轉動或 Auto 排程中，忽略此次點擊');
      return;
    }

    // 開啟 Auto 模式
    this.chipManager._isAutoMode = true;
    this.chipManager.AutoSprite.spriteFrame = this.chipManager.StopSpriteFrame; // 更新 Auto 按鈕圖片(Stop)
    this.chipManager.AutoBouttonSprite.spriteFrame = this.chipManager.StopStopFrame; // 更新 Auto 按鈕圖片(粉)
    this.chipManager.offLightButton(); // 關閉按鈕(關燈)
    // this.chipManager.setAllMasksActive(true); // 開啟所有mask-2

    // 儲存目前下注狀態作為 lastBetAmounts（只做一次）
    this.chipManager.lastBetAmounts = { ...this.chipManager.betAmounts };
    console.log('Auto 模式已啟動，下注內容：', this.chipManager.lastBetAmounts);
    // this.toast.showToast("Auto 模式啟動中");

    this.Lottery._isAutoRunning = true;

    // 直接進入轉盤（等同按下 Start）
    this.Lottery.onGoLotterEventCallback(); // 轉盤轉動(隨機抽獎)
  }

  //
  rebetAndStart(): void {
    const lastBets = this.chipManager.lastBetAmounts || {};
    console.log('💰 Auto下注內容：', this.chipManager.lastBetAmounts);

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
      // this.chipManager.AutoSprite.spriteFrame = this.chipManager.AutoSpriteFrame;
      this.chipManager.updateStartButton();
      this.chipManager.AllButton.interactable = true;
      ToastMessage.showToast('餘額不足，自動已停止');
      return; // 不夠錢就不下注，直接退出
    }
    // let totalBet = 0;

    // 遍歷每個下注區的上局金額，逐一補上籌碼
    for (const areaName in lastBets) {
      const amount = lastBets[areaName];
      if (amount > 0) {
        const areaIndex = this.chipManager.betAreaMap[areaName];
        const betNode = this.chipManager.betAreaNodes[areaIndex];

        if (betNode) {
          let remaining = amount;

          // 拆分下注金額成最接近的籌碼，並下注
          while (remaining > 0) {
            const chipValue = this.chipManager.getClosestChip(remaining);
            const actionId = this.chipManager.actionHistory.length + 1;

            this.chipManager.performBet(betNode, chipValue, actionId, 'again');
            remaining -= chipValue;
          }
        }
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
      this.chipManager.offLightButton();
      this.scheduleOnce(() => {
        this.rebetAndStart(); // 重播下注並啟動轉盤
      }, 0.25); // 延遲 0.3 秒啟動下一輪（可調）
    }
  }

  // ========== 下注區域點擊事件 ==========
  BetClick(event: EventTouch) {
    if (this.closePlaceBet()) {
      this.chipManager.onBetClick(event);
    }
  }

  // 禁止下注
  closePlaceBet() {
    return !this.toast.BetLocked.active && !this.Lottery._isLottery;
  }

  // === 遊戲 UI 更新 ===
  start() {
    console.log('🎮 遊戲開始！');
    // const dots = this.node.getComponentsInChildren(Collider2D);
    // dots.forEach((dot) => {
    //   console.log('Dot parent =', dot.node.parent?.name, 'Dot name =', dot.node.name);
    // });
    // AudioManager.instance.playBGM("Lucky Wheel-背景音樂");
    this.chipManager.updateStartButton(); // 判斷 Start 與 下排按鈕是否啟用
    this.toast.showPleaseBetNow(); // 遊戲開始顯示提示(玩家下注)

    this.scheduleOnce(() => {
      this.toast.hidePleaseBetNow();
    }, 1); // 1秒後隱藏提示

    //=================== StatusBar 顯示區 ====================
    this.chipManager.updateGlobalLabels(); // 更新下方的 Bet / Balance / Win 顯示

    // this.ID_Label.string = '帳號: Ethan';

    console.log('🎯 start() 時的 player 狀態：', player);
    if (player.currentPlayer) {
      console.log('✅ 有玩家資料，顯示帳號：', player.currentPlayer.username);
      this.ID_Label.string = `帳號: ${player.currentPlayer.username}`;
    } else {
      console.warn('⚠ 沒有玩家資料，ID_Label 不會更新');
    }

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
