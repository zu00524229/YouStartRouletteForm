import { _decorator, Component, director, Node } from 'cc';
import { LotteryResponse, LotteryResultEvent, PlaceBetRequest, SIGNALR_EVENTS, UnifiedLotteryEvent } from '../Type/Types'; // 型別呼叫

const { ccclass } = _decorator;
declare const $: any;
declare const CC_DEV: boolean;

@ccclass('SignalRClient')
export class SignalRClient {
  private static _connection: any = null;
  private static _hubProxy: any = null;

  private static _isConnected = false;
  private static _handlersRegistered = false;

  // 是給 LoginPanel 用的
  public static getHubProxy() {
    return this._hubProxy;
  }

  // =================== SignalR 相關方法 ===================
  // ========== 建立連線 ==========
  public static async connect(onMessageReceived: (user: string, message: string) => void) {
    try {
      // 測試用
      if (CC_DEV) {
        await this.loadScriptWithCheck('http://localhost:5001/signalr/jquery-3.6.0.min.js', () => typeof (window as any).$ !== 'undefined');
        await this.loadScriptWithCheck('http://localhost:5001/signalr/jquery.signalR-2.4.3.min.js', () => typeof (window as any).$?.hubConnection !== 'undefined');
      }

      if (typeof $ === 'undefined' || !$.hubConnection) {
        console.error('❌ SignalR 未正確載入 jQuery');
        return;
      }

      if (this._isConnected) {
        console.log('⚠️ 已連線過，跳過 connect()');
        return;
      }
      console.log('✅ jQuery 與 SignalR 載入成功');

      this._connection = $.hubConnection('http://172.16.5.21:5000'); // 這條線插哪台伺服器（URL/Port/協定）
      this._hubProxy = this._connection.createHubProxy('ChatHub'); // 後端 Hub 名稱（注意大小寫）最好一致
      console.log(this._hubProxy.hubName);

      // ==========================================================================================
      this._hubProxy.on('broadcastMessage', (user: string, message: string) => {
        console.log('📩 收到訊息:', user, message);
        onMessageReceived(user, message);
      });

      // 連線
      this._connection
        .start()
        .done(() => {
          console.log('SignalR 已連線');
          this._isConnected = true;

          // 事件註冊只做一次
          if (!this._handlersRegistered) {
            this.registerLotteryHandlers();
            this._handlersRegistered = true;
          }
        })
        .fail((err: any) => {
          console.error('❌ SignalR 連線失敗:', err);
        });
    } catch (err) {
      console.error('❌ SignalR 連線錯誤:', err);
    }
  }

  // =================== 單區下注 ==================
  public static placeBet(req: PlaceBetRequest) {
    if (!this._hubProxy || !this._connection || this._connection.state !== 1) {
      console.warn('⚠️ SignalR 尚未連線完成，不能送下注');
      return;
    }
    this._hubProxy
      .invoke('PlaceBet', req.areaName, req.amount) // 對應後端的 PlaceBet(string areaName, int amount)
      .then(() => {
        console.log(`✅ 已送出下注：區域=${req.areaName}, 金額=${req.amount}`);
      })
      .catch((err: any) => {
        console.error('❌ 傳送失敗', err);
      });
  }

  // ========== 抽獎事件註冊（只註冊一次） ==========
  private static registerLotteryHandlers() {
    if (!this._hubProxy) return;

    let lastResult: LotteryResultEvent | null = null;
    let lastBalance: LotteryResponse | null = null;

    // 🚀 整合器：檢查是否兩邊都回來了
    const tryEmitUnified = () => {
      if (lastResult && lastBalance) {
        const unified: UnifiedLotteryEvent = {
          ...lastResult,
          roundId: lastBalance.roundId, // 局號
          balanceBefore: lastBalance.balanceBefore,
          balanceAfter: lastBalance.balanceAfter,
          totalBet: lastBalance.totalBet,
          netChange: lastBalance.netChange,
          insufficientBalance: lastBalance.insufficientBalance,
          message: lastBalance.message,
        };

        console.log('🚀 發射 UnifiedLotteryEvent：', unified);
        director.emit(SIGNALR_EVENTS.UNIFIED_LOTTERY_EVENT, unified);

        // 用完清掉，避免舊資料卡住
        lastResult = null;
        lastBalance = null;
      }
    };

    // 🎯 轉盤動畫用：只有抽獎結果
    this._hubProxy.on('broadcastLotteryResult', (result: LotteryResultEvent) => {
      console.log('🎯 收到 broadcastLotteryResult：', result);
      lastResult = result;
      tryEmitUnified();
    });

    // 📦 完整封包：錢包 / UI 用
    this._hubProxy.on('lotteryResult', (resp: LotteryResponse) => {
      console.log('📦 收到 lotteryResult (完整封包)：', resp);
      lastBalance = resp;
      tryEmitUnified();
    });
  }

  // ========== 提供給外部註冊 callback（如果還要用） ==========
  public static onLotteryResult(callback: (result: any) => void, onResponse?: (response: any) => void): void {
    director.on(SIGNALR_EVENTS.LOTTERY_RESULT, callback);
    if (onResponse) {
      director.on(SIGNALR_EVENTS.LOTTERY_BALANCE, onResponse);
    }
  }

  // ========== 發訊息測試 ==========
  public static sendMessage(user: string, message: string) {
    if (!this._hubProxy) {
      console.warn('⚠️ Hub 尚未建立');
      return;
    }
    this._hubProxy.invoke('send', user, message);
  }

  // =================== 傳送下注資料的方法 ==================
  public static sendBetData(data: any /* TODO: 改成 BetData */) {
    if (!this._hubProxy || !this._connection || this._connection.state !== 1) {
      // 1 = connected
      console.warn('⚠️ SignalR 尚未連線完成，不能送下注');
      return;
    }
    if (this._hubProxy) {
      this._hubProxy
        .invoke('StartLottery', data)
        .then(() => {
          console.log('✅ 下注資料已送出', data);
        })
        .catch((err) => {
          console.error('❌ 傳送失敗', err);
        });
    }
  }

  /** 動態載入 script */
  private static loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🟡 載入中: ' + url); // 👈 觀察真實網址
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`載入失敗: ${url}`));
      document.head.appendChild(script);
    });
  }
  // =================== 動態載入 script 結束 ===================
  private static async loadScriptWithCheck(url: string, checkFn: () => boolean): Promise<void> {
    await this.loadScript(url);
    return new Promise((resolve, reject) => {
      const maxWait = 3000;
      const interval = 50;
      let waited = 0;
      const timer = setInterval(() => {
        if (checkFn()) {
          clearInterval(timer);
          resolve();
        } else if ((waited += interval) >= maxWait) {
          clearInterval(timer);
          reject(new Error(`❌ ${url} 載入超時或格式錯誤`));
        }
      }, interval);
    });
  }
}
