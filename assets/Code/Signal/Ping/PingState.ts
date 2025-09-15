/**
 * PingState.ts
 * --------------------------------------------
 * 用途：
 * - 管理前端的「心跳機制」
 * - 登入成功後，會每隔一段時間（預設 2 秒）主動呼叫後端的 Ping()
 * - 讓後端知道玩家連線仍然存活，並更新 HeartbeatManager 的時間戳
 * - 如果心跳長時間沒回覆，後端會判定玩家斷線，並清理連線狀態
 *
 * 功能：
 * - startHeartbeat() : 啟動心跳，避免重複開啟
 * - stopHeartbeat()  : 停止心跳（強制登出、斷線、返回登入頁時呼叫）
 *
 * 注意事項：
 * - 這是前端主動 Ping 後端，不是接收後端 Ping
 * - _intervalId 只用來記錄 setInterval 的代號，方便清掉
 */
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PingState')
export class PingState extends Component {
  private static _intervalId: any = null; // 存 setInterval 的代號

  // ============ 心跳 Ping 給後端 檢測連線狀態 ===========
  public static startHeartbeat(hubProxy: any, isConnectedFn: () => boolean) {
    // 如果已經有心跳在跑，就先清掉，避免重複
    if (this._intervalId) {
      clearInterval(this._intervalId); // 避免重複開
      this._intervalId = null;
    }

    // 建立新的心跳
    this._intervalId = setInterval(() => {
      if (hubProxy && isConnectedFn()) {
        // this._hubProxy.invoke('Ping').catch((err: any) => console.warn('Ping 失敗', err));
        hubProxy
          .invoke('Ping')
          .then(() => {
            console.log('Ping 成功(心跳送出)');
          })
          .catch((err: any) => {
            console.log('Ping 失敗', err);
          });
      }
    }, 2000); // 每 2 秒一次
  }
  // 強制登出/ 斷線 / 返回登入頁
  public static stopHeartbeat() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
      console.log('⏹️ 已停止心跳');
    }
  }
}
