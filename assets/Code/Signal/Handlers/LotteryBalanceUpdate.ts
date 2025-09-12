import { _decorator, Component, director, Node } from 'cc';
import { SIGNALR_EVENTS } from '../../Type/Types';
const { ccclass, property } = _decorator;

@ccclass('LotteryBalanceUpdate')
export class LotteryBalanceUpdate extends Component {
  /** 餘額更新處理 */
  public static handleBalanceUpdate(payload: any) {
    console.log('💰 餘額更新:', payload);
    // director.emit('LotteryBalanceUpdate', payload);
    director.emit(SIGNALR_EVENTS.LOTTERY_BALANCE, payload);
  }
}
