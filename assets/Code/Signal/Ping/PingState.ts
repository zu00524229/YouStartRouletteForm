import { ToastMessage } from './../../Managers/Toasts/ToastMessage';

import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PingState')
export class PingState extends Component {
  // ============ 心跳 Ping 給後端 檢測連線狀態 ===========
  public static startHeartbeat(hubProxy: any, isConnectedFn: () => boolean) {
    setInterval(() => {
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
    }, 5000); // 每 5 秒一次
  }
}
