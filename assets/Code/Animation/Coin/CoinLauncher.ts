import { _decorator, Component, Prefab, Node, Vec3, instantiate, UIOpacity, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CoinLauncher')
export class CoinLauncher extends Component {
  @property(Prefab)
  coinPrefab: Prefab = null;

  @property(Node)
  coinContainer: Node = null;

  @property
  direction: number = 1; // 1=右上（預設），-1=左上

  private _spawnInterval = 0.03; // 每 0.03 秒噴一顆

  start() {
    // 自動不停噴
    this.schedule(() => {
      const coinCount = 3 + Math.floor(Math.random() * 6); // 隨機噴 3~6 顆
      for (let i = 0; i < coinCount; i++) {
        const coin = instantiate(this.coinPrefab);
        this.coinContainer.addChild(coin);

        // 起始位置固定在下方中央
        const startPos = new Vec3(0, -100, 0);
        coin.setScale(0.1, 0.1, 1);
        coin.setPosition(startPos);

        // 角度：從 45° ~ 60° 隨機（朝右上）
        // const angleDeg = 45 + Math.random() * 15;
        // const angleDeg = 67.5 - 22.5 + Math.random() * 45; // → 45° ~ 90°
        const angleDeg = 90 - 60 + Math.random() * 120; // ➜ 30° ~ 150°
        const angleRad = angleDeg * (Math.PI / 180);

        // 初始速度（你也可以調整速度範圍）
        const speed = 400 + Math.random() * 200;
        const dx = Math.cos(angleRad) * speed * this.direction;
        const dy = Math.sin(angleRad) * speed * 0.8;

        const endPos = startPos.clone().add(new Vec3(dx, dy, 0));

        // 加入透明控制
        const uiOpacity = coin.getComponent(UIOpacity) || coin.addComponent(UIOpacity);
        uiOpacity.opacity = 255;

        // tween：飛出＋縮小＋淡出
        tween(coin)
          .to(0.8, { position: endPos, scale: new Vec3(0.6, 0.6, 1) }, { easing: 'quadOut' })
          .to(
            0.5,
            {},
            {
              onUpdate: (target, ratio) => {
                const s = 0.6 - 0.4 * ratio;
                coin.setScale(s, s, 1);
                uiOpacity.opacity = 255 * (1 - ratio);
              },
            }
          )
          .call(() => coin.destroy())
          .start();
      }
    }, this._spawnInterval);
  }
}
