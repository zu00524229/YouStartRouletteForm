import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export const player = {
  isLoggedIn: false,
  currentPlayer: { username: '', balance: 0 }, // 預設 balance=0
};

@ccclass('playerState')
export class playerState extends Component {}
