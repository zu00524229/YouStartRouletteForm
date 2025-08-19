import { director } from 'cc';
import { LotteryResultEvent, SIGNALR_EVENTS } from '../Type/Types';
import { SignalRClient } from './SignalRClient';

export class GameService {
  static init() {
    SignalRClient.onLotteryResult(
      (result: any) => {
        const eventData: LotteryResultEvent = {
          rewardName: result?.rewardName ?? '',
          rewardIndex: Number(result?.rewardIndex ?? -1),
          multiplier: Number(result?.multiplier ?? 0),
          payout: Number(result?.payout ?? 0),
          isJackpot: Boolean(result?.isJackpot ?? false),
          extraPay: result?.extraPay ?? null,
        };
        // ✅ 這裡才發  事件
        director.emit(SIGNALR_EVENTS.LOTTERY_RESULT, eventData);
      },
      (resp) => {
        // 未登入/餘額不足，不要碰轉盤；只做 UI 提示或錢包更新
        if (resp?.message === '未登入') {
          console.warn('⛔ 未登入：忽略本次轉盤');
          // 這裡可以 emit 一個顯示登入面板的事件
          return;
        }
        // ✅ 這裡你可以額外處理 balance / totalBet / message
        console.log('💰 BalanceUpdate Event：', resp);
        director.emit(SIGNALR_EVENTS.LOTTERY_BALANCE, resp); // 錢包更新
      }
    );
  }
}
