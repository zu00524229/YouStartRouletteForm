import { _decorator, Button, Component, EventTouch, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StartTouch')
export class StartTouch extends Component {
  @property(Node) StartButtonNode: Node = null;
  @property({ tooltip: '長按判定秒數 ( 毫秒 )' }) longPressThreshold: number = 1500;

  private touchStartTime: number = 0;
  private autoTriggered: boolean = false; // 是否已觸發自動事件
  private autoTimer: any = null; // 用來存 setTimeout 的返回值

  onLoad() {
    if (this.StartButtonNode) {
      this.StartButtonNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
      this.StartButtonNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
      this.StartButtonNode.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }
  }

  private onTouchStart(event: EventTouch) {
    this.touchStartTime = Date.now();
    this.autoTriggered = false;

    // 啟動一個計時器, 超過 autoTriggered 時自動觸發 auto-press 事件
    this.autoTimer = setTimeout(() => {
      const btn = this.StartButtonNode.getComponent(Button);
      if (btn && !btn.interactable) return; // 如果按鈕禁止, 則忽略事件

      this.node.emit('auto-press'); // 長按事件(auto)
      this.autoTriggered = true;
    }, this.longPressThreshold);
  }

  private onTouchEnd(event: EventTouch) {
    clearTimeout(this.autoTimer); // 清除計時器

    const btn = this.StartButtonNode.getComponent(Button);
    if (btn && !btn.interactable) return; // 如果按鈕是禁止(關燈)狀態，則忽略事件

    if (!this.autoTriggered) {
      this.node.emit('start-press'); // 短按事件(start)
    }
    this.touchStartTime = 0; // 重置
  }

  // 以防反悔(玩家移開按鈕則重製按住按鈕時間)
  private onTouchCancel(event: EventTouch) {
    clearTimeout(this.autoTimer); // 清除計時器
    this.autoTriggered = false;
    this.touchStartTime = 0; // 重置
  }
}
