import { _decorator, Component, director, Label, Node, sp, Sprite, SpriteFrame, SpriteFrameEvent, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { MANIAToast } from './MANIAToast';
import { LotteryCache, LotteryResultEvent } from '../../TurnLottery';
// import { AudioManager } from '../Audio/AudioManager';
import { player } from '../../Login/playerState';

const { ccclass, property } = _decorator;

interface ManiaData {
  index: number; // 寶箱索引
  multiplier: number; // 倍率（由後端給定）
  isSelected: boolean; // 是否是玩家選中的卡片
  winAmount?: number; // 中獎金額
  payout?: number; // 後端計算好的總派彩金額
  pickBetAmount: number; // 該區下注金額(由前端快取代入)
  balanceAfterWin: number; // 撈取前場景的 Balance(總分)
}

@ccclass('MANIAController')
export class MANIAController extends Component {
  @property(MANIAToast) MToast: MANIAToast = null; // 關聯 MANIAToast 腳本
  // @property(AudioManager) Audio: AudioManager = null;             // 連結 AudioManager

  @property(Node) KeyAniNode: Node = null; //  鑰匙動畫節點
  @property(Node) MEGAWinTips: Node = null; // 總獎金提示框

  @property(Node) Auto_ButtonNode: Node = null;
  @property(Node) Stop_ButtonNode: Node = null;
  @property(Node) ChooseTargetNode: Node = null;

  @property(Label) ID_Label: Label = null; // 帳號(ID)
  @property(Label) TimeLabel: Label = null; // 時間
  @property(Label) Bet_Label: Label = null; // 顯示下注額度
  @property(Label) Balance_Label: Label = null; // 顯示玩家餘額
  @property(Label) Win_Label: Label = null; // 導入贏得籌碼
  @property(Label) RoundId_Label: Label = null; // 顯示局號

  @property([Node]) multGroups: Node[] = []; // ⬅ X + 數字 同個容器（外層要掛 Layout）

  @property([SpriteFrame]) GetMultPick: SpriteFrame[] = []; // 被選中的倍率數字
  @property([SpriteFrame]) OutMultPick: SpriteFrame[] = []; // 未被選中的倍率數字
  @property(SpriteFrame) GetMultX: SpriteFrame = null; // 黃色X
  @property([SpriteFrame]) OutMultX: SpriteFrame = null; // 灰色X

  Bet_Num = 0;
  Win_Num = 0;
  Balance_Num = 0;
  _hasClicked = false; // 是否有點選寶箱

  Delay_Show = 2; // 延遲顯示
  Delay_Math = 6; // 顯示完提示後延遲加總與顯示餘額
  Delay_Back = 4; // 顯示完餘額後延遲回主畫面

  // private _finalMultiplier = 0;
  private _finalMultiplier: number = 0;
  maniaResultList: ManiaData[] = [];
  // public static hasKeyBeenClicked: boolean = false;   // 防止快速點擊兩把鑰匙

  onLoad() {
    director.on(LotteryResultEvent, this.onGetPickMultiplier, this);
    this.Stop_ButtonNode.active = true;
    this.Auto_ButtonNode.active = false;
    this.ChooseTargetNode.active = true;
    console.log('顯示ChooseTarget', this.ChooseTargetNode);

    if (LotteryCache.lastResult) {
      console.log('🎁 MANIAController 快取中取得資料：', LotteryCache.lastResult);
      const data = LotteryCache.lastResult;

      this.Bet_Num = data.pickBetAmount || 0;
      this.Win_Num = data.winAmount || 0;
      this.Balance_Num = data.balanceAfterWin || 0;
      this.RoundId_Label.string = `#${data.roundId || 0}`;

      // this.ID_Label.string = '帳號: Ethan'; // 如果未來要做動態帳號，也可以改為變數
      this.ID_Label.string = `帳號: ${player.currentPlayer.username}`;
      this.Balance_Label.string = this.Balance_Num.toFixed(2);
      this.Bet_Label.string = this.Bet_Num.toFixed(2);
      // this.Win_Label.string = this.Win_Num.toFixed(2); // 若當下還沒顯示，則留著未來播動畫後再顯示

      this._finalMultiplier = data.multiplier || 0;
    }
    this.MEGAWinTips.active = false;
  }

  // ============ 當前時間 =============
  updateTime() {
    const now = new Date();
    const h = (now.getHours() < 10 ? '0' : '') + now.getHours();
    const m = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    this.TimeLabel.string = `時間：${h}:${m}`;
  }

  private onGetPickMultiplier(data: any) {
    if (data.rewardName === 'GOLD_MANIA' && data.multiplier) {
      this._finalMultiplier = data.multiplier;
      console.log('GOLD_MANIA 確認倍率為：', this._finalMultiplier);
    } else {
      console.warn('⚠️ 資料格式異常或不是 GOLD_MANIA：', data);
    }
  }

  // ============= 接收抽獎結果資料 ========================
  public generateManiaData(selectedIndex: number): ManiaData[] {
    console.log('🎯 收到玩家選擇 index =', selectedIndex);
    const base = LotteryCache.lastResult;
    console.log('📦 讀取快取資料：', LotteryCache.lastResult);
    // ✅ 如果沒資料，用假資料測試

    const list: ManiaData[] = [];

    // ✅ 有快取資料的正常邏輯
    console.log('🎯 玩家選中寶箱 index =', selectedIndex);

    for (let i = 0; i < 3; i++) {
      list.push({
        index: i,
        multiplier: i === selectedIndex ? base.multiplier : this.getRandomMultiplier(25, 500),
        isSelected: i === selectedIndex,
        winAmount: i === selectedIndex ? base.winAmount : 0,
        pickBetAmount: base.pickBetAmount,
        balanceAfterWin: base.balanceAfterWin,
      });
    }

    this.Bet_Num = base.pickBetAmount;
    this.Win_Num = base.winAmount;
    this.Balance_Num = base.balanceAfterWin;
    this._finalMultiplier = base.multiplier;

    this.Bet_Label.string = this.Bet_Num.toFixed(2);
    this.Balance_Label.string = this.Balance_Num.toFixed(2);

    return list;
  }

  // 寶箱倍率顯示(準備結束 回到主畫面)
  public showMultiplierResult() {
    for (let data of this.maniaResultList) {
      const groupNode = this.multGroups[data.index];
      console.log('📦 groupNode name:', groupNode.name);
      console.log('🎯 data:', data);

      this.setMultiplierDisplay(data, groupNode);
      console.log('💥 maniaResultList:', this.maniaResultList);
    }

    //  2s 延遲顯示獎金提示框（等倍率數字動畫播完）
    this.scheduleOnce(() => {
      const finalMultiplier = this._finalMultiplier || 0;
      const finalTotal = this.Win_Num || 0;

      console.log('🏆 顯示獎金提示框：', finalMultiplier, finalTotal);
      this.MToast?.showMegaTips(finalMultiplier, finalTotal);

      this.scheduleOnce(() => {
        this.Balance_Num += finalTotal;
        this.Win_Num = finalTotal;

        this.Bet_Label.string = this.Bet_Num.toFixed(2);
        this.Balance_Label.string = this.Balance_Num.toFixed(2);
        this.Win_Label.string = this.Win_Num.toFixed(2);

        LotteryCache.lastResult.balanceAfterWin = this.Balance_Num;
        console.log('💾 快取資料，準備帶回 C1 主畫面', this.Balance_Num);

        // 再延遲 2 秒 回主畫面
        this.scheduleOnce(() => {
          director.loadScene('Game');
        }, this.Delay_Back); // 延遲 回主場景 (C1)
      }, this.Delay_Math); // 延遲加總
    }, this.Delay_Show); // 顯示獎金提示框的延遲（倍率動畫播完）
  }

  start() {
    this.updateTime(); // 顯示時間
    this.schedule(this.updateTime, 1);

    this.MToast.showChooseTargetTip();
    this.playKeyEffect(); // 鑰匙(Hover)動畫
  }

  // 鑰匙(Hover)動畫
  playKeyEffect() {
    const skeleton = this.KeyAniNode.getComponent(sp.Skeleton);
    if (!skeleton) {
      console.warn('RedKeyAniNode 上找不到 Skeleton 組件');
      return;
    }

    // 播放特效動畫，第二個參數為 loop，第三個是從頭播放
    skeleton.setAnimation(0, 'animation', false); // 'animation' 替換成實際動畫名稱
  }

  private setMultiplierDisplay(data: ManiaData, groupNode: Node) {
    const digits = data.multiplier.toString().split('');
    const spriteMap = data.isSelected ? this.GetMultPick : this.OutMultPick; // 選中用黃色，未選用(灰色)
    const xSprite = data.isSelected ? this.GetMultX : this.OutMultX; // 對應 X 的圖

    groupNode.removeAllChildren(); // 清空原有節點(避免重複顯示)

    //=============== 動畫前準備工作 ===============

    const originalPos = groupNode.getPosition();
    const startY = originalPos.y - 100; // 下移
    groupNode.setPosition(originalPos.x, startY, originalPos.z);

    // 初始化透明度 ( 0 -> 255 淡入)
    const groupOpacity = groupNode.getComponent(UIOpacity) || groupNode.addComponent(UIOpacity);
    groupOpacity.opacity = 0;

    // 加入 X 圖
    const xNode = new Node();
    const xSpriteComp = xNode.addComponent(Sprite);
    xSpriteComp.spriteFrame = xSprite;
    xNode.setScale(0.8, 0.8, 1); // X 圖縮小
    const xUI = xNode.getComponent(UITransform) || xNode.addComponent(UITransform);
    xUI.setContentSize(40, 60);
    groupNode.addChild(xNode);

    // 加入倍率數字圖
    for (let digit of digits) {
      const node = new Node();
      const sprite = node.addComponent(Sprite);
      sprite.spriteFrame = spriteMap[parseInt(digit)];
      node.setScale(1.1, 1.1, 1); // 略放大
      const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
      ui.setContentSize(40, 60);
      groupNode.addChild(node);
    }

    // === 播放動畫：位置上移 + 淡入 ===

    tween(groupNode)
      .to(
        1.0,
        {
          position: new Vec3(originalPos.x, originalPos.y, originalPos.z),
        },
        { easing: 'quadOut' }
      ) // 平滑上移
      .start();

    tween(groupOpacity)
      .to(1.0, { opacity: 255 }, { easing: 'quadOut' }) // 同步淡入
      .start();

    console.log(`🎯 顯示倍率：x${data.multiplier}`);
  }

  private getRandomMultiplier(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
