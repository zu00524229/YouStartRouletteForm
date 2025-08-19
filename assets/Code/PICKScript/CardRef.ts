import { _decorator, Component, Node, sp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CardRef')
export class CardRef extends Component {
  @property(Node) frontCard: Node = null;
  @property(Node) effect: Node = null; // Spine 動畫節點
  @property(Node) multContainer: Node = null; // 倍數節點
  @property(Node) XContainer: Node = null; // X 顯示節點

  public showBack() {
    this.frontCard.active = false;
    this.effect.active = false;
  }

  public flipToFront(isSelected: boolean) {
    this.frontCard.active = true;
    this.effect.active = true;

    const spine = this.effect.getComponent(sp.Skeleton);
    if (spine) {
      if (isSelected) {
        spine.setAnimation(0, 'Standby_Pick', false);
        spine.addAnimation(0, 'Standby_Pick_Glow', false);
        spine.addAnimation(0, 'Standby_Pick_Glow_Loop', true);
      } else {
        spine.setAnimation(0, 'Standby_No_picking', true);
      }
    }
  }

  start() {}

  update(deltaTime: number) {}
}
