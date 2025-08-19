import { _decorator, Component, RigidBody2D, Node, Collider2D, Contact2DType, IPhysics2DContact } from 'cc';
import { AudioManager } from '../Audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('PointerSpring')
export class PointerSpring extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager

  @property
  stiffness: number = 50; // 彈性係數（越大越快回正）

  @property
  damping: number = 10; // 阻尼係數（控制來回擺動的次數）

  private rb: RigidBody2D | null = null;

  private _lastHitTime: number = 0;
  private _cooldown: number = 0.1;

  onLoad() {
    this.rb = this.getComponent(RigidBody2D);
    const collider = this.getComponent(Collider2D);
    // console.log("指針是否找到 Collider2D：", !!collider);

    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact) {
    // console.log("💥 觸發碰撞事件");
    const now = performance.now() / 1000;
    // console.log("💥 指針碰撞到：", otherCollider.node.name)

    if (now - this._lastHitTime >= this._cooldown) {
      this._lastHitTime = now;

      if (this.Audio?.AudioSources?.[5]) {
        this.Audio.AudioSources[5].stop();
        // console.log("音效停")
        this.Audio.AudioSources[5].play();
        // console.log("音效開")
      }
    }
  }

  update(dt: number) {
    if (!this.rb) return;

    const angle = this.node.angle; // 當前角度（指針偏離中心）
    const angularVel = this.rb.angularVelocity;

    // 模擬一個彈簧力 F = -kθ - bω
    const torque = -this.stiffness * angle - this.damping * angularVel;

    this.rb.applyTorque(torque, true);
  }
}
