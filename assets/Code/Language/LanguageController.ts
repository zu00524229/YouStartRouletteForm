import { _decorator, Component, director } from 'cc';
import { LanguageManager, Lang } from './LanguageManager';
import { LanguageSprite } from './LanguageSprite';

const { ccclass } = _decorator;

@ccclass('LanguageController')
export class LanguageController extends Component {

    public static changeLanguage(lang: Lang) {
        LanguageManager.currentLang = lang;

        // 通知所有 LanguageSprite 重新載入圖片
        const all = director.getScene().getComponentsInChildren(LanguageSprite);
        for (const langNode of all) {
            langNode.updateSprite();
        }
    }
}
