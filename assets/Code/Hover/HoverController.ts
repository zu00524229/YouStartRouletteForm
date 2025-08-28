import { _decorator, Component, Node, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HoverController')
export class HoverController extends Component {
  // 指定 Hover 圖片得節點 ( 通常是半透明的高光圖層 )
  @property(Node) hoverNode: Node = null;

  public static _isHighlight: boolean = false; // 是否正在高亮

  start() {
    const btn = this.getComponent(Button); // 取得 Button 組件
    if (!btn || !this.hoverNode) return; // 防呆: 如果沒有按鈕 則不執行

    // 滑鼠移入：當按鈕可互動時才顯示 hover 圖層
    this.node.on(Node.EventType.MOUSE_ENTER, () => {
      if (btn.interactable && !HoverController._isHighlight) this.hoverNode.active = true;
    });

    // 滑鼠移出：無論是否可互動，一律隱藏 hover 圖層
    this.node.on(Node.EventType.MOUSE_LEAVE, () => {
      // console.log("🟢 hover 開啟！");
      if (!HoverController._isHighlight) {
        this.hoverNode.active = false;
      }
    });

    // 防呆：一開始不要亮
    this.hoverNode.active = false;
  }
}
