import { _decorator, Component, director, Node } from 'cc';
import { ToastMessage } from '../../Managers/Toasts/ToastMessage';
import { player } from '../../Login/playerState';
const { ccclass, property } = _decorator;

@ccclass('ForceLogout')
export class ForceLogout extends Component {
  /** 強制登出處理 */
  public static handleForceLogout(data: any) {
    console.warn('⚠️ 被強制登出:', data.message);
    ToastMessage.showToast(data.message);

    // 重置玩家狀態
    player.isLoggedIn = false;
    player.currentPlayer = null;

    // 跳回登入場景
    setTimeout(() => director.loadScene('Login'), 1000);

    // 同時發 Cocos 事件（給需要的地方用）
    director.emit('ForceLogout', data);
  }
}
