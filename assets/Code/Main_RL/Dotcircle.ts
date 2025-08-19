// 此腳本用於編輯器模式下排列子節點成圓形（Radial Layout）
import { _decorator, Component, Node, Vec3, math, CCInteger, CCBoolean } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('RadialLayout')
@executeInEditMode
export class RadialLayout extends Component {
  @property({ type: CCInteger })
  radius: number = 340;

  @property({ type: CCInteger })
  spacingAngle: number = 0; // 每個點額外間隔角度（可為0）

  @property autoUpdate: boolean = true;

  update() {
    if (!this.autoUpdate) return;

    const children = this.node.children;
    const count = children.length;
    const angleStep = 360 / count + this.spacingAngle;

    for (let i = 0; i < count; i++) {
      const angle = math.toRadian(i * angleStep);
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      children[i].setPosition(new Vec3(x, y, 0));
    }
  }
}
