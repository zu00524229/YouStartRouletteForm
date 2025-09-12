import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScriptLoader')
export class ScriptLoader extends Component {
  /** 動態載入 script */
  public static loadScript(url: string): Promise<void> {
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
  public static async loadScriptWithCheck(url: string, checkFn: () => boolean): Promise<void> {
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
