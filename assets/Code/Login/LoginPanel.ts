import { SignalRClient } from './../Signal/SignalRClient';
import { _decorator, Component, director, EditBox, EventKeyboard, input, Input, KeyCode, Label, Node } from 'cc';
import { player, playerState } from './playerState';
import { ToastMessage } from '../Managers/Toasts/ToastMessage';
const { ccclass, property } = _decorator;

@ccclass('LoginPanel')
export class LoginPanel extends Component {
  @property(EditBox) usernameInput: EditBox = null;

  @property(EditBox) passwordInput: EditBox = null;

  @property(Node) loginButton: Node = null;

  @property(Label) errorLabel: Label = null;

  public static isLoggedIn: boolean = false; // 預設未登入
  private isLoggingIn: boolean = false;

  onLoad() {
    // this.loginButton.interactable = false;
    this.errorLabel.string = ''; // 清空錯誤訊息
    SignalRClient.connect((user, message) => {
      console.log(`📩 [訊息忽略] ${user}: ${message}`);
    });
    console.log('✅ LoginPanel 已初始化');
  }

  onEnable() {
    console.log('🔎 loginButton =', this.loginButton);
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

    // 在帳號或密碼輸入框按 Enter 都能觸發登入
    this.usernameInput.node.on('editing-return', this.onLoginClick, this);
    this.passwordInput.node.on('editing-return', this.onLoginClick, this);

    // 滑鼠事件
    this.loginButton.on(Node.EventType.TOUCH_END, this.onLoginClick, this);
  }

  onDisable() {
    console.log('🔎 loginButton =', this.loginButton);
    this.loginButton.off(Node.EventType.TOUCH_END, this.onLoginClick, this);

    this.usernameInput.node.off('editing-return', this.onLoginClick, this);
    this.passwordInput.node.off('editing-return', this.onLoginClick, this);
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
  }

  start() {}

  private onKeyDown(event: EventKeyboard) {
    if (event.keyCode === KeyCode.ENTER || event.keyCode === KeyCode.NUM_ENTER) {
      console.log('🔑 按下 Enter，觸發登入');
      // 直接模擬點擊登入按鈕
      this.onLoginClick();
    }
  }

  onLoginClick() {
    if (this.isLoggingIn) return; // 防止重複送出
    this.isLoggingIn = true;

    const username = this.usernameInput.string.trim();
    const password = this.passwordInput.string.trim();

    if (!username || !password) {
      console.log('⚠ 請輸入帳號與密碼');
      ToastMessage.showToast('請輸入帳號與密碼');
      this.isLoggingIn = false; // 重置鎖
      return;
    }

    console.log(`📤 送出登入請求：${username}`);

    // 使用 SignalR 呼叫後端 Login 方法
    const proxy = SignalRClient.getHubProxy();
    if (!proxy || SignalRClient.isConnected()) {
      console.error('尚未連線到 SignalR，請稍後再試');
      this.errorLabel.string = '⚠ 尚未連線伺服器，請稍後再試';
      this.isLoggingIn = false;
      return;
    }

    proxy
      .invoke('Login', { username, password })
      .done((res: any) => {
        this.isLoggingIn = false; // 無論成功失敗都要解鎖
        console.log('📩 後端回應：', res); // ✅ 回應也印出

        if (res.success) {
          console.log(`✅ 登入成功：玩家=${res.username}, 餘額=${res.balance}`);
          this.errorLabel.string = '登入成功! 正在進入遊戲...';

          // 存玩家資料到全域
          player.currentPlayer = {
            username: username,
            balance: res.balance,
          };

          player.isLoggedIn = true; // 🔹 設成已登入
          // 把餘額暫存到全域，進入遊戲場景再設定
          // this.node.active = false; // 登入成功隱藏視窗
          // 切換到遊戲場景
          setTimeout(() => {
            director.loadScene('Game');
          }, 0);
        } else {
          console.warn('❌ 登入失敗：', res.message);

          if (ToastMessage && ToastMessage.showToast) {
            // ToastMessage.showToast('登入失敗：' + res.message);
            this.errorLabel.string = '登入失敗：' + res.message;
          } else {
            console.error('❌ ToastMessage.showToast 不存在，檢查 class 定義或編譯');
          }
        }
      })
      .fail((err: any) => {
        this.isLoggingIn = false;
        console.error('❌ 登入請求錯誤：', err);
      });
  }

  update(deltaTime: number) {}
}
