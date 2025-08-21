import { _decorator, Component, RigidBody2D, Node, Collider2D, Contact2DType, IPhysics2DContact, misc } from 'cc';
import { AudioManager } from '../Audio/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('PointerSpring')
export class PointerSpring extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager

  @property
  stiffness: number = 2.5; // 彈性係數（越大越快回正）

  @property
  damping: number = 0.3; // 阻尼係數（越大晃動越快停止）

  private rb: RigidBody2D | null = null;
  private _lastHitTime: number = 0;
  private _cooldown: number = 0.2; // 冷卻時間（秒）

  onLoad() {
    this.rb = this.getComponent(RigidBody2D);
    const collider = this.getComponent(Collider2D);

    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
  }

  onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact) {
    const now = performance.now() / 1000;

    if (now - this._lastHitTime >= this._cooldown) {
      this._lastHitTime = now;

      // 播音效
      if (this.Audio?.AudioSources?.[5]) {
        this.Audio.AudioSources[5].stop();
        this.Audio.AudioSources[5].play();
      }
      // ❌ 不再加任何額外衝擊力
    }
  }

  update(dt: number) {
    if (!this.rb) return;

    // 角度轉弧度
    const angleRad = misc.degreesToRadians(this.node.angle);
    const angularVel = misc.degreesToRadians(this.rb.angularVelocity);

    // 彈簧回正公式 torque = -kθ - bω
    const torque = -this.stiffness * angleRad - this.damping * angularVel;
    this.rb.applyTorque(torque, true);
  }
}
