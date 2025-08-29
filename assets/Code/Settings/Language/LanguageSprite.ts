import { _decorator, Component, Sprite, SpriteFrame, resources } from 'cc';
import { LanguageManager } from './LanguageManager';
const { ccclass, property } = _decorator;

@ccclass('LanguageSprite')
export class LanguageSprite extends Component {
    @property
    public fileName: string = '';  // 例：score / all bet / double

    start() {
        this.updateSprite();
    }

    public updateSprite() {
        const path = LanguageManager.getPath(this.fileName);
        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn(`❌ 找不到語言圖片：${path}`);
                return;
            }
            const sprite = this.getComponent(Sprite);
            if (sprite) sprite.spriteFrame = spriteFrame;
        });
    }
}
