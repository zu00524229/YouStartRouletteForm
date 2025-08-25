import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ToastMessage')
export class ToastMessage extends Component {
  @property(Node) toastNode: Node = null; // 提示訊息(餘額不足)
  @property(Label) toastText: Label = null; // 提示訊息文字

  // 🔑 單例
  static instance: ToastMessage;

  onLoad() {
    console.log('✅ ToastMessage 已初始化');

    this.toastNode.active = false;
    // 綁定單例
    ToastMessage.instance = this;
  }
  //============================== 一般提示訊息 ============================

  public static showToast(message: string) {
    console.log('👉 showToast 被呼叫', message);
    if (ToastMessage.instance?.toastNode && ToastMessage.instance.toastText) {
      ToastMessage.instance.toastNode.active = true;
      ToastMessage.instance.toastText.string = message;
      console.log('toastText.string =', ToastMessage.instance.toastText.string);

      const node = ToastMessage.instance.toastNode;

      node.active = true;
      node.setScale(1, 1, 1);
      node.setSiblingIndex(node.parent.children.length - 1);

      // 🔍 Debug log
      console.log('toastNode.active =', node.active);
      console.log('toastNode.worldPosition =', node.worldPosition);
    } else {
      console.warn('⚠ Toast 節點或文字沒有綁定');
    }
  }

  public hideToast() {
    if (ToastMessage.instance?.toastNode) {
      ToastMessage.instance.toastNode.active = false;
    }
  }
}
