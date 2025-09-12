import { _decorator, Component, director, Node } from 'cc';
import { ScriptLoader } from './Utils/ScriptLoader';
import { ToastMessage } from '../Managers/Toasts/ToastMessage';
import { TurnLottery } from '../TurnLottery';
import { BetManager } from '../Managers/Bet/BetManager';
import { ToolButtonsController } from '../Managers/ToolButtonsController';
import { LotteryEventHandler } from './Handlers/LotteryEventHandler';
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

  /**
   * 取得目前的 HubProxy 物件
   * - 提供給 LoginPanel、NetworkManager 呼叫後端方法用
   * - 若還沒連線，可能會是 null
   */
  public static getHubProxy() {
    return this._hubProxy;
  }

  /**
   * 檢查 SignalR 是否已連線成功
   * - 用於判斷是否可以送資料給後端
   * - true = 已連線, false = 尚未連線 / 已斷線
   */
  public static isConnected(): boolean {
    return this._isConnected;
  }

  // =================== SignalR 相關方法 ===================
  // ========== 建立連線 ==========
  public static async connect() {
    try {
      // 測試用
      if (CC_DEV) {
        await ScriptLoader.loadScriptWithCheck('http://localhost:5001/signalr/jquery-3.6.0.min.js', () => typeof (window as any).$ !== 'undefined');
        await ScriptLoader.loadScriptWithCheck('http://localhost:5001/signalr/jquery.signalR-2.4.3.min.js', () => typeof (window as any).$?.hubConnection !== 'undefined');
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
      this._hubProxy = this._connection.createHubProxy('chathub'); // 後端 Hub 名稱（注意大小寫）最好一致
      console.log('hubProxy.hubName =', this._hubProxy.hubName);

      // ==========================================================================================
      this._hubProxy.on('broadcastMessage', (event: string, payload: any) => {
        console.log('📩 收到 broadcastMessage:', event, payload);

        switch (event) {
          case 'ForceLogout':
            // ⚡ 後端在 Login() 時檢查到「同帳號重複登入」，
            // -  會踢掉舊連線，並推送這個事件。
            // -  payload: { message: "帳號已在別處登入" }
            director.emit('ForceLogout', payload);
            break;

          case 'LotteryBalanceUpdate':
            // 💰 後端在 PlaceBet() 時推送的即時餘額更新事件。
            // - 成功下注：payload = { balance, betAmounts }
            // - 失敗（餘額不足 / 超過上限）：payload = { balance, betAmounts, message }
            director.emit(SIGNALR_EVENTS.LOTTERY_BALANCE, payload);
            break;

          default:
            console.warn('⚠️ 未知 broadcastMessage 事件:', event, payload);
            break;
        }
      });

      // 連線
      this._connection
        .start()
        .done(() => {
          console.log('SignalR 已連線, 進入登入畫面');
          // SignalRClient.startHeartbeat(); // ping 連線檢查
          this._isConnected = true;
          // this._hubProxy.invoke('TestEvent', 'hello world');

          // 事件註冊只做一次
          if (!this._handlersRegistered) {
            // this.registerLotteryHandlers();
            LotteryEventHandler.registerLotteryHandlers(this._hubProxy); // 呼叫抽獎相關事件
            this._handlersRegistered = true;
          }
          let retryCount = 0;
          // ✅ 加上斷線提示
          this._connection.disconnected = () => {
            console.warn('⚠️ 與 SignalR 斷線');
            this._isConnected = false;
            ToastMessage.showToast('已斷線');

            const delay = Math.min(30000, 2000 * Math.pow(2, retryCount)); // 最長30秒
            retryCount++;

            // 自動重連（延遲 5 秒）
            setTimeout(() => {
              // console.log('🔄 嘗試重新連線...');
              ToastMessage.showToast(`🔄 嘗試重新連線...(第${retryCount}次)`);
              this._connection
                .start()
                .done(() => {
                  console.log('✅ SignalR 重新連線成功');
                  this._isConnected = true;
                  retryCount = 0; // 成功後重製
                  ToastMessage.showToast('✅ 已重新連線成功');
                })
                .fail((err: any) => {
                  console.error('❌ SignalR 重連失敗:', err);
                  ToastMessage.showToast('❌ 重新連線失敗，將繼續嘗試...');
                });
            }, delay);
          };
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
      ToastMessage.showToast('已斷線');
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

  // =================== 傳送下注資料的方法 ==================
  public static sendBetData(data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this._hubProxy || !this._connection || this._connection.state !== 1) {
        console.warn('⚠️ SignalR 尚未連線完成，不能送下注');
        resolve(false);
        return;
      }

      // ✅ 基本防呆：下注資料是否合法
      if (!data || !data.totalBet || data.totalBet <= 0) {
        console.warn('⚠️ 無效的下注資料，不送 StartLottery', data);
        resolve(false);
        return;
      }
      if (!data.betAmounts || Object.keys(data.betAmounts).length === 0) {
        console.warn('⚠️ 沒有下注區域，不送 StartLottery', data);
        resolve(false);
        return;
      }

      // 送到後端
      this._hubProxy
        .invoke('StartLottery', data) // 這裡用後端方法名稱
        .then(() => {
          console.log('✅ 已送出下注資料:', data);
          resolve(true); // 成功
        })
        .catch((err: any) => {
          console.error('❌ 傳送下注失敗', err);
          reject(err);
        });
    });
  }
}
