import { _decorator, Component, Node } from 'cc';
import { SignalRClient } from '../../Signal/SignalRClient';

const { ccclass, property } = _decorator;

@ccclass('DebugAPI')
export class DebugAPI extends Component {
  // ========== 發訊息測試 ==========
  public static sendMessage(user: string, message: string) {
    const hub = SignalRClient.getHubProxy();

    if (!hub) {
      console.warn('⚠️ Hub 尚未建立');
      return;
    }
    hub.invoke('send', user, message);
  }
}
