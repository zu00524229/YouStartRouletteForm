import { SignalRClient } from './../Signal/SignalRClient';

export class NetworkManager {
  private static _initialized = false;

  /** 初始化 SignalR（只會執行一次） */
  public static async init() {
    if (this._initialized) {
      console.log('⚠️ NetworkManager 已初始化，跳過');
      return;
    }

    await SignalRClient.connect((user, message) => {
      console.log(`📩 [訊息忽略] ${user}: ${message}`);
    });

    this._initialized = true;
    console.log('✅ NetworkManager 初始化完成');
  }

  /** 取得 HubProxy，給其他地方呼叫 */
  public static getHubProxy() {
    return SignalRClient.getHubProxy();
  }

  /** 是否已連線 */
  public static isConnected() {
    return SignalRClient.isConnected();
  }
}
