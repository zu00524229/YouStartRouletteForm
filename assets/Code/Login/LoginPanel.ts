import { SignalRClient } from './../Signal/SignalRClient';
import { NetworkManager } from '../Signal/NetworkController';
import { _decorator, Component, director, EditBox, EventKeyboard, input, Input, KeyCode, Label, Node, Prefab } from 'cc';
import { player, playerState } from './playerState';
import { PingState } from '../Signal/Ping/PingState'; // ✅ 引入
import { ToastMessage } from '../Managers/Toasts/ToastMessage';
import { ConfirmDialog } from './../Managers/Toasts/ConfirmDialog';
const { ccclass, property } = _decorator;

@ccclass('LoginPanel')
export class LoginPanel extends Component {
  @property(EditBox) usernameInput: EditBox = null;
  @property(EditBox) passwordInput: EditBox = null;
  @property(Node) loginButton: Node = null;
  @property(Label) errorLabel: Label = null;

  @property(Prefab) confirmDialogPrefab: Prefab = null; // 登出登入提示
  @property(Prefab) toastPrefab: Prefab = null; // 一般提示

  public static isLoggedIn: boolean = false; // 預設未登入
  private isLoggingIn: boolean = false;

  async onLoad() {
    this.errorLabel.string = ''; // 清空錯誤訊息

    // 確保全域連線已初始化
    await NetworkManager.init();
    console.log('✅ LoginPanel 已初始化');
    // ✅ 預先註冊 Prefab
    ConfirmDialog.registerPrefab(this.confirmDialogPrefab);
    if (this.toastPrefab) {
      ToastMessage.registerPrefab(this.toastPrefab);
    }
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
    const proxy = NetworkManager.getHubProxy();
    if (!proxy || !NetworkManager.isConnected()) {
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

          player.currentPlayer = { username, balance: res.balance };
          player.isLoggedIn = true;

          PingState.startHeartbeat(proxy, () => NetworkManager.isConnected()); // 啟動心跳

          setTimeout(() => director.loadScene('Game'), 0); // 呼叫主遊戲場景
        } else {
          console.warn('❌ 登入失敗：', res.message);
          this.errorLabel.string = '登入失敗：' + res.message;
        }
      })
      .catch((err: any) => {
        this.isLoggingIn = false;
        console.error('❌ 登入請求錯誤：', err);
        this.errorLabel.string = '登入失敗，請稍後再試';
      });
  }
}
