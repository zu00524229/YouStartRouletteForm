import { _decorator, Component, Node, Sprite, SpriteFrame, resources, tween, sp, Vec3, UIOpacity, UITransform, director, Label } from 'cc';
import { CardRef } from './CardRef';
import { LotteryResultEvent, LotteryCache } from '../../TurnLottery'; // 或你的 TurnLottery 檔案相對路徑
import { PickToast } from './PickToast';
import { AudioManager } from '../../Managers/Audio/AudioManager';
import { player } from '../../Login/playerState';

const { ccclass, property } = _decorator;

interface CardData {
  index: number; // 卡片索引
  multiplier: number; // 倍率（由後端給定）
  isSelected: boolean; // 是否是玩家選中的卡片
  ref: CardRef; // 卡片對應的節點與元件
  originalScale: Vec3; // 原始縮放，用於翻牌動畫恢復
  winAmount?: number; // 中獎金額
  payout?: number; // 後端計算好的總派彩金額
  pickBetAmount: number; // 該區下注金額(由前端快取代入)
  balanceAfterWin: number; // 撈取前場景的 Balance(總分)
}

@ccclass('PickController')
export class PickController extends Component {
  @property(AudioManager) Audio: AudioManager = null; // 連結 AudioManager

  @property(PickToast) PToast: PickToast = null; // 關聯 PickToast 腳本
  @property(Node) BigWinTips: Node = null; // showPickTips 獎金節點

  @property({ type: [CardRef] }) public cardRefs: CardRef[] = []; // 在編輯器中拖入每張卡片的節點組

  @property(Node) Auto_ButtonNode: Node = null;
  @property(Node) Stop_ButtonNode: Node = null;
  @property(Node) ChooseTargetNode: Node = null;

  @property([SpriteFrame]) GetMultPick: SpriteFrame[] = []; // 被選中的倍率數字
  @property([SpriteFrame]) OutMultPick: SpriteFrame[] = []; // 未被選中的倍率數字
  @property(SpriteFrame) GetMultX: SpriteFrame = null; // 黃色X
  @property([SpriteFrame]) OutMultX: SpriteFrame = null; // 灰色X

  @property(Label) ID_Label: Label = null; // 帳號(ID)
  @property(Label) TimeLabel: Label = null; // 時間
  @property(Label) Bet_Label: Label = null; // 顯示下注額度
  @property(Label) Balance_Label: Label = null; // 顯示玩家餘額
  @property(Label) Win_Label: Label = null; // 導入贏得籌碼
  @property(Label) RoundId_Label: Label = null; // 顯示局號

  private Balance_Num: number = 20000.0;
  private Bet_Num: number = 0;
  private Win_Num: number = 0;

  public assignedMultiplier: number = 0; //  從後端傳入的中獎倍率，所有卡片翻牌都會顯示這個值
  private cardList: CardData[] = []; // 用來儲存每張卡的資料
  private isFlipped: boolean = false; // 避免重複翻牌

  Delay_Show = 1.5; // 延遲顯示
  Delay_Math = 3; // 3 秒後加總
  Delay_Back = 3; // 加總後再等 3 秒回主畫面

  onLoad() {
    console.log('🐞 PickController onLoad 執行中');
    director.on(LotteryResultEvent, this.onGetPickMultiplier, this);
    this.Stop_ButtonNode.active = true;
    this.Auto_ButtonNode.active = false;
    this.ChooseTargetNode.active = true;

    if (LotteryCache.lastResult) {
      console.log(' PickController 快取中取得資料：', LotteryCache.lastResult);
      // this.onGetPickMultiplier(LotteryCache.lastResult);
      const data = LotteryCache.lastResult;
      this.Bet_Num = data.pickBetAmount || 0;
      this.Win_Num = data.winAmount || 0;
      this.Balance_Num = data.balanceAfterWin || 0;
      this.RoundId_Label.string = `#${data.roundId || 0}`;
      this.ID_Label.string = `帳號: ${data.username || 'Guest'}`;

      // this.ID_Label.string = '帳號: Ethan';
      this.Balance_Label.string = this.Balance_Num.toFixed(2);
      this.Bet_Label.string = this.Bet_Num.toFixed(2);
      // this.Win_Label.string = this.Win_Num.toFixed(2);

      this._finalMultiplier = data.multiplier || 0;
    }
    this.BigWinTips.active = false;
  }

  private _finalMultiplier: number = 0;

  private onGetPickMultiplier(data: any) {
    if (data.rewardName === 'PRIZE_PICK' && data.multiplier) {
      this._finalMultiplier = data.multiplier;
      console.log('PRIZE_PICK 確認倍率為：', this._finalMultiplier);
    } else {
      console.warn('⚠️ 資料格式異常或不是 PRIZE_PICK：', data);
    }
  }

  start() {
    // const testSpine = this.cardRefs[0].effect.getComponent(sp.Skeleton);
    // testSpine.setAnimation(0, "Standby_Pick", true);    // 強制播放動畫

    for (let i = 0; i < this.cardRefs.length; i++) {
      const ref = this.cardRefs[i];
      // if (!ref) {
      //     console.error(`❌ cardRefs[${i}] 是 null，請檢查是否拖錯`);
      //     continue;
      // }

      // if (!ref.node || !ref.backCard || !ref.frontCard || !ref.effect) {
      //     console.error(`❌ 第 ${i + 1} 張卡片有欄位沒設好：`, {
      //         node: ref.node?.name,
      //         back: ref.backCard,
      //         front: ref.frontCard,
      //         effect: ref.effect
      //     });
      //     continue;
      // }
      const cardData: CardData = {
        index: i,
        multiplier: 0, // 初始倍率
        isSelected: false, // 預設為未選中
        ref: ref, // 對應卡片元件
        originalScale: ref.node.scale.clone(), // 儲存原始縮放
        winAmount: 0, // 初始化為 0，之後選中才會設成中獎金額
        pickBetAmount: 0, // 一併初始化，轉場快取後會更新
        balanceAfterWin: 0,
      };

      this.cardList.push(cardData);
      this.showBack(cardData); // 顯示卡片背面(初始化)

      // 綁定卡片點擊事件
      ref.node.on(Node.EventType.TOUCH_END, () => this.onCardClicked(cardData), this);

      this.updateTime();
      this.schedule(this.updateTime, 1);
      // this.PToast.showChooseTargetTip();
    }
  }
  // ============ 當前時間 =============
  updateTime() {
    const now = new Date();
    const h = (now.getHours() < 10 ? '0' : '') + now.getHours();
    const m = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    this.TimeLabel.string = `時間：${h}:${m}`;
  }

  // ======================== 處理點選卡片的事件 =============================
  private onCardClicked(selectedCard: CardData) {
    if (this.isFlipped) return; // 若已翻過， 則忽略
    this.Stop_ButtonNode.active = false;
    this.Auto_ButtonNode.active = true;
    this.ChooseTargetNode.active = false;

    this.isFlipped = true;
    selectedCard.isSelected = true;
    // selectedCard.multiplier = this._finalMultiplier || 15;      // 後端給的倍率，若沒拿到後端值，預設 15 倍
    // this.setMultiplierDisplay(selectedCard);                    // 顯示選中的卡倍率＋動畫

    const multiplier = this._finalMultiplier || 15; // 後端給的倍率，若沒拿到後端值，預設 15 倍
    const pickBetAmount = LotteryCache.lastResult?.pickBetAmount || 0;
    const winAmount = multiplier * pickBetAmount;

    selectedCard.multiplier = multiplier;
    selectedCard.winAmount = winAmount;

    // 所有卡一起翻面（包含選中與未選中）
    for (const card of this.cardList) {
      card.isSelected = card === selectedCard; // 只有這張是true
      this.flipCard(card);
    }

    // const winAmount = selectedCard.multiplier * 1;

    // 延遲顯示中獎提示
    this.scheduleOnce(() => {
      if (!this.PToast) {
        console.error('❌ PToast 尚未綁定，請在 Inspector 拖入 Toast 節點');
        return;
      }
      // 顯示中獎提示(保持顯示)
      this.PToast.showPickTips(multiplier, winAmount);

      // 延遲 Delay_Math 秒後加總獎金與更新顯示
      this.scheduleOnce(() => {
        this.Balance_Num += winAmount; // 加入獎金
        this.Win_Num = winAmount;

        this.Bet_Label.string = this.Bet_Num.toFixed(2);
        this.Balance_Label.string = this.Balance_Num.toFixed(2); // 保留兩位小數
        this.Win_Label.string = this.Win_Num.toFixed(2);

        LotteryCache.lastResult.balanceAfterWin = this.Balance_Num; // 快取資料, 給 Game 場景
        console.log('快取資料,準備帶回 Game 主畫面', this.Balance_Num);

        // 延遲 Delay_Back 秒後回主畫面
        this.scheduleOnce(() => {
          director.loadScene('Game'); // 回主畫面
        }, this.Delay_Back); // 回主畫面延遲
      }, this.Delay_Math); // 加總與顯示餘額延遲
    }, this.Delay_Show); // 顯示提示延遲
  }

  // 翻轉卡片動畫 + 播放對應特效
  private flipCard(card: CardData) {
    const { frontCard, effect, node } = card.ref;
    const spine = effect?.getComponent(sp.Skeleton);
    // const effectOpacity = effect.getComponent(UIOpacity);
    const frontOpacity = frontCard.getComponent(UIOpacity);

    if (card.isSelected) {
      // ✅ 被選中的卡片：直接顯示倍率＋播放動畫
      effect.active = true;
      this.Audio.AudioSources[6].play(); // 翻牌音效
      spine?.setAnimation(0, 'Standby_Pick', false);
      spine?.addAnimation(0, 'Standby_Pick_Glow', false);
      spine?.addAnimation(0, 'Standby_Pick_Glow_Loop', true);

      frontCard.active = true;
      frontOpacity.opacity = 0;
      this.setMultiplierDisplay(card); //  設定倍率圖 // 設定倍率圖
      tween(frontOpacity).to(0.3, { opacity: 255 }).start();
    } else {
      // ❌ 未選中的卡片：翻牌 + 顯示倍率（不播放動畫）
      tween(node)
        .to(0.2, { scale: new Vec3(0, card.originalScale.y, 1) })
        .call(() => {
          spine?.clearTrack(0); // 移除動畫
          effect.active = false;

          frontCard.active = true; //  先開啟節點
          this.setMultiplierDisplay(card); //  設定倍率圖

          frontOpacity.opacity = 0;
          tween(frontOpacity).to(0.3, { opacity: 255 }).start();
        })
        .to(0.2, { scale: Vec3.clone(card.originalScale) })
        .start();
    }
  }

  // 顯示卡片背面 + 設定初始動畫
  private showBack(card: CardData) {
    const { frontCard, effect } = card.ref;

    // 初始狀態：只顯示背面
    effect.active = true;

    // 關閉發光效果 → 設定為 Standby
    const spine = effect?.getComponent(sp.Skeleton);
    if (spine) {
      spine.clearTrack(0); // 重置動畫
      spine.setAnimation(0, 'Standby', true); // 背面待機動畫
    }

    card.ref.node.setScale(new Vec3(card.originalScale));

    // FrontCard 預設關閉（倍率圖）
    card.ref.frontCard.active = false;
  }

  // 設定卡片正面的倍率圖（之後可根據 multiplier 顯示不同倍率圖）
  // card: CardData 結構中包含 multiplier（被選中的來自後端，未選中的將隨機產生）與 isSelected
  private setMultiplierDisplay(card: CardData) {
    const multiplier = card.isSelected ? card.multiplier : this.getRandomMultiplier(15, 99);

    const digits = multiplier.toString().split('');

    const spriteMap = card.isSelected ? this.GetMultPick : this.OutMultPick;
    const xSprite = card.isSelected ? this.GetMultX : this.OutMultX;

    const multContainer = card.ref.multContainer;
    const xContainer = card.ref.XContainer;

    // 清空原本內容
    multContainer.removeAllChildren();
    xContainer.removeAllChildren();

    // 淡入
    const multOpacity = multContainer.getComponent(UIOpacity) || multContainer.addComponent(UIOpacity);
    const xOpacity = xContainer.getComponent(UIOpacity) || xContainer.addComponent(UIOpacity);
    multOpacity.opacity = 0;
    xOpacity.opacity = 0;

    //  加入 X 符號（到 xContainer）
    const xNode = new Node();
    const xSpriteComp = xNode.addComponent(Sprite);
    xSpriteComp.spriteFrame = xSprite;
    xNode.setScale(1.5, 1.4, 1);

    const xUI = xNode.getComponent(UITransform) || xNode.addComponent(UITransform);
    xUI.setContentSize(40, 60);
    xContainer.addChild(xNode);

    // 加入倍率數字（到 multContainer）
    for (let digit of digits) {
      const node = new Node();
      const sprite = node.addComponent(Sprite);
      sprite.spriteFrame = spriteMap[parseInt(digit)];
      node.setScale(1.9, 1.9, 1);

      const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
      ui.setContentSize(40, 60);
      multContainer.addChild(node);
    }

    // 執行淡入動畫
    tween(multOpacity).to(0.3, { opacity: 255 }).start();

    tween(xOpacity).to(0.3, { opacity: 255 }).start();

    console.log(`🎯 顯示倍率：x${multiplier}`);
  }

  private getRandomMultiplier(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
