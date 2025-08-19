import { SignalRClient } from './../Signal/SignalRClient';
import { index } from '../index';
import { _decorator, Component, director, EditBox, Node } from 'cc';
import { player, playerState } from './playerState';
const { ccclass, property } = _decorator;

@ccclass('LoginPanel')
export class LoginPanel extends Component {
  // @property(playerState) player: playerState = null;

  @property(EditBox) usernameInput: EditBox = null;

  @property(EditBox) passwordInput: EditBox = null;

  @property(Node) loginButton: Node = null;

  public static isLoggedIn: boolean = false; // 預設未登入
  private isLoggingIn: boolean = false;

  onLoad() {
    SignalRClient.connect((user, message) => {
      console.log(`📩 [訊息忽略] ${user}: ${message}`);
    });
    this.loginButton.on(Node.EventType.TOUCH_END, this.onLoginClick, this);
  }

  onDestroy() {
    // this.loginButton.off(Node.EventType.TOUCH_END, this.onLoginClick, this);
  }
  start() {}

  onLoginClick() {
    if (this.isLoggingIn) return; // 防止重複送出
    this.isLoggingIn = true;

    const username = this.usernameInput.string.trim();
    const password = this.passwordInput.string.trim();

    if (!username || !password) {
      console.log('⚠ 請輸入帳號與密碼');
      this.isLoggingIn = false; // 重置鎖
      return;
    }

    console.log(`📤 送出登入請求：${username}`);

    // 使用 SignalR 呼叫後端 Login 方法
    const proxy = SignalRClient.getHubProxy();
    if (!proxy) {
      console.error('❌ 尚未連線到 SignalR');
      this.isLoggingIn = false;
      return;
    }

    proxy
      .invoke('Login', { username, password })
      .done((res: any) => {
        this.isLoggingIn = false; // 無論成功失敗都要解鎖
        console.log('📩 後端回應：', res); // ✅ 回應也印出

        if (res.success) {
          console.log('✅ 登入成功，餘額：', res.balance);

          // 存玩家資料到全域
          player.currentPlayer = {
            username: username,
            balance: res.balance,
          };

          player.isLoggedIn = true; // 🔹 設成已登入
          // 把餘額暫存到全域，進入遊戲場景再設定
          // this.node.active = false; // 登入成功隱藏視窗
          // 切換到遊戲場景
          director.loadScene('C1'); // 這裡換成你遊戲場景的名字
        } else {
          console.warn('❌ 登入失敗：', res.message);
        }
      })
      .fail((err: any) => {
        this.isLoggingIn = false;
        console.error('❌ 登入請求錯誤：', err);
      });
  }

  update(deltaTime: number) {}
}
