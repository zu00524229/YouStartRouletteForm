import { _decorator, Component, director, Label, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StartLoading')
export class StartLoading extends Component {
  @property(Label) loadingText: Label = null;
  @property(ProgressBar) progressBar: ProgressBar = null;

  start() {
    // 預載遊戲場景 C1
    director.preloadScene(
      'C1',
      (completedCount, totalCount) => {
        const progress = completedCount / totalCount;

        // 更新進度條
        if (this.progressBar) {
          this.progressBar.progress = progress;
        }
      },
      () => {
        // 預載完成後，切換到遊戲場景
        director.loadScene('C1', () => {
          console.log('C1場景載入完成');
        });
      }
    );
  }

  update(deltaTime: number) {}
}
