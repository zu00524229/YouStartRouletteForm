import { _decorator, CCInteger, Component, director, Label, Node, tween, UIOpacity, UITransform } from 'cc';
// import { RLRotation } from '../Main_RL/RLRotation';
import { LotteryCache, LotteryResultEvent } from '../TurnLottery';
import { SuperLight } from './SuperLight';
import { RLRotation } from '../Main_RL/RLRotation';
import { SuperToast } from './SuperToast';
const { ccclass, property } = _decorator;

interface SuperData {
  index: number;
  multiplier: number;
  isSelected: boolean;
  winAmount?: number; // 原本計算用的獎金（可繼續用）
  payout?: number; // 後端計算好的總派彩金額
  pickBetAmount: number;
  balanceAfterWin: number;
}

// // ✅ 定義倍率與 index 對應表（Super 轉盤用）
// type RewardSuperInfo = {
//     indices: number[];
//     multiplier: number;
// };

// // ✅ Super 輪盤格子資料表（每格代表的倍率）
// const rewardSuperMapTable: Record<string, RewardSuperInfo> = {
//     "100X":  { indices: [2, 4, 5, 8, 9, 12, 15, 16, 19, 22, 23], multiplier: 100 },
//     "800X":  { indices: [1, 6, 11, 13, 18, 21], multiplier: 800 },
//     "1700X": { indices: [3, 7, 14, 17, 20], multiplier: 1700 },
//     "3000X": { indices: [0], multiplier: 3000 },
// };

@ccclass('SuperController')
export class SuperController extends Component {
  @property(RLRotation) RLRota: RLRotation = null; // 連結 RLRotation
  @property(SuperLight) Light: SuperLight = null; // 連接 SuperLight
  @property(SuperToast) Sup: SuperToast = null; // 連接 SuperToast

  @property(Node) Auto_button: Node = null; // Auto 父節點
  @property(Node) Stop_button: Node = null; // Stop 父節點

  @property(Node) blueGroup: Node = null; // 藍指針父節點
  @property(Node) redGroup: Node = null; // 紅指針父節點
  @property(Node) greenGroup: Node = null; // 綠指針父節點

  @property(Node) blueTarget: Node = null; // 指針終點位置
  @property(Node) redTarget: Node = null;
  @property(Node) greenTarget: Node = null;

  @property(Node) blueGlow: Node = null; // 藍指針強光節點
  @property(Node) redGlow: Node = null; // 紅指針強光節點
  @property(Node) greenGlow: Node = null; // 綠指針強光節點

  @property(Node) turnBgNode: Node = null; // 旋轉軸心
  @property(CCInteger) rewardTypeCount: number = 24; // 轉盤中獎品分區數量
  @property(CCInteger) rotatelottertSecs: number = 12; // 轉盤動畫旋轉次數
  @property(CCInteger) lotterSecsL: number = 7; // 抽獎動畫持續時間

  @property(Label) ID_Label: Label = null; // 帳號(ID)
  @property(Label) TimeLabel: Label = null; // 時間
  @property(Label) Bet_Label: Label = null; // 顯示下注額度
  @property(Label) Balance_Label: Label = null; // 顯示玩家餘額
  @property(Label) Win_Label: Label = null; // 導入贏得籌碼

  Bet_Num = 0;
  Win_Num = 0;
  Balance_Num = 0;

  Delay_Show = 2; // 延遲 2秒 顯示 EPIC WIN
  Delay_Math = 6; // 6 秒後加總
  Delay_Back = 4; // 等 4 秒回主畫面

  private isSelected: boolean = false;
  private pointerOffset: number = 0; // 玩家選擇的指針偏移角度

  // 總共24格(以矯正)
  rewardSuperMap: { [index: number]: string } = {
    0: '3000X',
    1: '800X',
    2: '100X',
    3: '1700X',
    4: '100X',
    5: '100X',
    6: '800X',
    7: '1700X',
    8: '100X',
    9: '100X',
    10: '3000X',
    11: '800X',
    12: '100X',
    13: '800X',
    14: '1700X',
    15: '100X',
    16: '100X',
    17: '1700X',
    18: '800X',
    19: '100X',
    20: '1700X',
    21: '800X',
    22: '100X',
    23: '100X',
  };

  onLoad() {
    // console.log("🧊 Super 轉盤收到的快取資料：", LotteryCache.lastResult);

    if (LotteryCache.lastResult) {
      console.log('🎁 SuperController 快取中取得資料：', LotteryCache.lastResult);
      const data = LotteryCache.lastResult;

      this.Bet_Num = data.pickBetAmount ?? 0;
      this.Win_Num = data.winAmount ?? 0;
      this.Balance_Num = data.balanceAfterWin ?? 0;

      this.ID_Label.string = '帳號: Ethan'; // 如果未來要做動態帳號，也可以改為變數
      this.Balance_Label.string = this.Balance_Num.toFixed(2);
      this.Bet_Label.string = this.Bet_Num.toFixed(2);
      // this.Win_Label.string = this.Win_Num.toFixed(2); // 若當下還沒顯示，則留著未來播動畫後再顯示
    }

    // 清除所有指針遮罩(初始化)
    this.blueGroup.getChildByName('mask').active = false;
    this.redGroup.getChildByName('mask').active = false;
    this.greenGroup.getChildByName('mask').active = false;
    this.Auto_button.active = true;
    this.Stop_button.active = false;

    this.blueGroup.on(Node.EventType.TOUCH_END, () => this.selectPointer('blue'));
    this.redGroup.on(Node.EventType.TOUCH_END, () => this.selectPointer('red'));
    this.greenGroup.on(Node.EventType.TOUCH_END, () => this.selectPointer('green'));
  }

  start() {
    this.updateTime(); // 顯示時間
    this.schedule(this.updateTime, 1);
  }

  // ============ 當前時間 =============
  updateTime() {
    const now = new Date();
    const h = (now.getHours() < 10 ? '0' : '') + now.getHours();
    const m = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    this.TimeLabel.string = `時間：${h}:${m}`;
  }

  // ==================== 選擇指針移動到指定位置 =====================
  private selectPointer(color: 'blue' | 'red' | 'green') {
    if (this.isSelected) return; // 若已選擇，則不重複處理
    this.isSelected = true;
    this.Sup.showChooseTargetTip(); // 呼叫方法 淡出 ChooseYourTarget
    this.Auto_button.active = false; // 隱藏節點
    this.Stop_button.active = true; // 顯示節點

    // 所有指針一併移動
    this.playSelectionEffect(this.blueGroup, this.blueTarget, 30); // 藍指針轉 30°
    this.playSelectionEffect(this.redGroup, this.redTarget, 0); // 紅指針不轉
    this.playSelectionEffect(this.greenGroup, this.greenTarget, -30); // 綠指針轉 -30°

    // 只有選中的顯示 Glow
    this.blueGlow.active = color === 'blue';
    this.redGlow.active = color === 'red';
    this.greenGlow.active = color === 'green';

    this.blueGroup.getChildByName('mask').active = color !== 'blue';
    this.redGroup.getChildByName('mask').active = color !== 'red';
    this.greenGroup.getChildByName('mask').active = color !== 'green';

    const segmentAngle = 360 / this.rewardTypeCount; // 每格角度( 360 / 24 = 15)

    // 根據顏色取得對應的指針、目標節點、角度與偏移值
    let targetGroup: Node = null;
    let targetNode: Node = null;
    let angle: number = 0;
    let pointerOffset = 0;

    switch (color) {
      case 'blue':
        targetGroup = this.blueGroup;
        targetNode = this.blueTarget;
        angle = 30;
        pointerOffset = 2 * segmentAngle;
        this.Light.highLightAnctor.angle = 30;
        break;
      case 'red':
        targetGroup = this.redGroup;
        targetNode = this.redTarget;
        angle = 0;
        pointerOffset = 0;
        this.Light.highLightAnctor.angle = 0;
        break;
      case 'green':
        targetGroup = this.greenGroup;
        targetNode = this.greenTarget;
        angle = -30;
        pointerOffset = -2 * segmentAngle;
        this.Light.highLightAnctor.angle = -30;
        break;
    }

    this.pointerOffset = pointerOffset; // 儲存 offser 給轉盤使用

    // 呼叫含 callback 的動畫，動畫結束後開始轉盤
    this.playSelectionEffect(targetGroup, targetNode, angle, () => {
      console.log('🎯 指針到位，開始轉盤');
      const rewardIndex = LotteryCache.lastResult?.rewardIndex; // 從快取取出 index
      this.superLottery(rewardIndex);
    });
  }

  // ========================= 指針移動動畫 =========================
  private playSelectionEffect(pointerGroup: Node, target: Node, angle: number, callback?: () => void) {
    // 世界位置 -> 轉為 pointerGroup 的父節點的本地座標
    const worldPos = target.getWorldPosition();
    const localPos = pointerGroup.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);

    tween(pointerGroup)
      .to(
        2.0,
        {
          position: localPos,
          angle: angle,
        },
        { easing: 'quadOut' }
      )
      .call(() => {
        callback?.(); // 有傳入 callback 才執行
      })
      .start();
  }

  // ================ Super 輪盤轉動動畫 =========================
  public superLottery(rewardIndex: number = 23) {
    if (!this.turnBgNode) {
      console.warn('❗ turnBgNode 尚未綁定');
      return;
    }
    console.log('✅ 預期落在1 index：', rewardIndex);
    this.RLRota.playRotationEffect(); // 水波選轉特效
    /// 先初始化轉盤角度，避免轉盤累積太多旋轉角度
    this.turnBgNode.angle %= 360;
    const pointerOffset = this.pointerOffset || 0; // 依照選擇的指針當作調整起點(終點)位置
    const segmentAngle = 360 / this.rewardTypeCount; // 每格的角度（例：24 格就是 360 / 24 = 15 度）
    const targetAngle = -this.rotatelottertSecs * 360 + rewardIndex * segmentAngle + pointerOffset; // 計算轉盤最終要轉到的角度

    console.log('🎯 準備轉盤角度', targetAngle);

    // 使用 tween 製作轉盤旋轉動畫
    tween(this.turnBgNode)
      .to(this.lotterSecsL, { angle: targetAngle }, { easing: 'cubicInOut' }) // 緩動旋轉到目標角度
      .call(() => {
        const finalAngle = ((this.turnBgNode.angle % 360) + 360) % 360;
        console.log('🎯 最終角度：', finalAngle.toFixed(2));
        console.log('✅ 預期落在 index：', rewardIndex);

        this.Light.playSuperLight(); // 轉盤結束後顯示中獎光圈特效

        // 2 秒後顯示 EPIC 提示 + 更新 WIN
        this.scheduleOnce(() => {
          const data = LotteryCache.lastResult as SuperData;
          const mult = data?.multiplier || 1;
          const total = data?.winAmount ?? mult * (data?.pickBetAmount || 0);

          this.Sup.showEPICTips(mult, total);
          this.Win_Num = total;

          // 6 秒後顯示 WIN, 並結算 Balance
          this.scheduleOnce(() => {
            this.Balance_Num += total; // 加入獎金

            this.Bet_Label.string = this.Bet_Num.toFixed(2);
            this.Balance_Label.string = this.Balance_Num.toFixed(2);
            this.Win_Label.string = this.Win_Num.toFixed(2);

            LotteryCache.lastResult.balanceAfterWin = this.Balance_Num; // 快取資料(準備給主畫面)
            this.scheduleOnce(() => {
              director.loadScene('C1');
            }, this.Delay_Back); // 4秒 + 前面6秒 = 10秒 回主畫面延遲
          }, this.Delay_Math); // 轉盤結束後第6秒，顯示WIN並結算
        }, this.Delay_Show); // 轉盤結束後第2秒，顯示EPIC提示
      })
      .start();
  }
}
