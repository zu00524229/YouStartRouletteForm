import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum Lang {
    TW = "TW",
    EN = "EN",
    VN = "VN",
    TL = "TL"
}

@ccclass('LanguageManager')
export class LanguageManager extends Component {
    static currentLang: Lang = Lang.TW;

    static getPath(fileName: string): string {
        return `Language/language-${this.currentLang}/${fileName}`;
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


