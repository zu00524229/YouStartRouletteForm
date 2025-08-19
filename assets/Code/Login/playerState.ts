import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export const player = {
  isLoggedIn: false,
  currentPlayer: null as { username: string; balance: number } | null,
};

@ccclass('playerState')
export class playerState extends Component {}
