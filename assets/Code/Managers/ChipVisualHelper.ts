// ChipVisualHelper.ts
import { Color, Label, Node, Sprite, SpriteFrame } from 'cc';

export class ChipVisualHelper {
  // 0–9 的圖片，外部設定
  public static digitSprites: SpriteFrame[] = [];

  // 各面額對應顏色
  static getColorByAmount(amount: number): Color {
    if (amount >= 10000) return new Color(0xbd, 0x8b, 0x0d); // 10000 金棕色
    if (amount >= 1000) return new Color(0x0e, 0xbd, 0x4d); // 1000 綠
    if (amount >= 500) return new Color(0x84, 0x84, 0x86); // 500 灰
    if (amount >= 200) return new Color(0xf5, 0x2c, 0x2c); // 200 紅
    return new Color(0x30, 0x29, 0xcf); // 100 藍
  }

  // 套用外框與數字
  static applyVisual(node: Node, amount: number) {
    // 1) 設外框顏色
    const frameNode = node.getChildByName('ChangeColor'); // 你外框 sprite node
    if (frameNode) {
      const sp = frameNode.getComponent(Sprite);
      if (sp) sp.color = this.getColorByAmount(amount);
    }

    // 2) 數字容器
    const numberRoot = node.getChildByName('NumberRoot');
    if (!numberRoot || this.digitSprites.length < 10) return;
    numberRoot.removeAllChildren();

    const str = String(amount);
    const len = str.length;

    // 不同位數縮放 & 間距
    let scale = 1;
    let spacing = 30; // 預設間距
    if (len >= 4) {
      scale = 0.7;
      spacing = 22;
    } else if (len == 3) {
      scale = 0.85;
      spacing = 26;
    }

    // 從左到右生成數字 sprite
    const startX = (-(len - 1) * spacing) / 2;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(str[i]);
      const digitNode = new Node(`digit_${digit}`);
      const sp = digitNode.addComponent(Sprite);
      sp.spriteFrame = this.digitSprites[digit];

      digitNode.setScale(scale, scale, 1);
      digitNode.setPosition(startX + i * spacing, 0, 0);

      numberRoot.addChild(digitNode);
    }
  }
}
