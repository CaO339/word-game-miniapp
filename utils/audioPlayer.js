// 音频播放工具类
class AudioPlayer {
  constructor() {
    this.audioContext = null;
    this.currentWord = '';
    this.currentType = 0; // 1: 英音, 2: 美音
    this.errorCallback = null;
    this.successCallback = null;
  }

  /**
   * 初始化音频上下文
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = wx.createInnerAudioContext();
      this.audioContext.onError((err) => {
        console.error('音频播放失败:', err);
        if (this.errorCallback) {
          this.errorCallback('发音加载失败');
        }
      });
      this.audioContext.onEnded(() => {
        if (this.successCallback) {
          this.successCallback();
        }
      });
    }
    return this;
  }

  /**
   * 播放发音
   * @param {string} word - 单词
   * @param {number} type - 1: 英音, 2: 美音
   * @param {Function} onError - 失败回调
   * @param {Function} onSuccess - 成功回调
   */
  play(word, type = 1, onError = null, onSuccess = null) {
    if (!word) {
      if (onError) onError('单词不能为空');
      return;
    }

    this.currentWord = word;
    this.currentType = type;
    this.errorCallback = onError;
    this.successCallback = onSuccess;

    // 构建音频URL
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;
    
    if (!this.audioContext) {
      this.init();
    }

    try {
      this.audioContext.src = audioUrl;
      this.audioContext.play();
    } catch (err) {
      console.error('播放异常:', err);
      if (onError) {
        onError('发音加载失败');
      }
    }
  }

  /**
   * 播放英音
   */
  playUK(word, onError, onSuccess) {
    this.play(word, 1, onError, onSuccess);
  }

  /**
   * 播放美音
   */
  playUS(word, onError, onSuccess) {
    this.play(word, 2, onError, onSuccess);
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.audioContext) {
      try {
        this.audioContext.stop();
      } catch (err) {
        console.error('停止播放失败:', err);
      }
    }
  }

  /**
   * 销毁音频上下文
   */
  destroy() {
    if (this.audioContext) {
      try {
        this.audioContext.destroy();
        this.audioContext = null;
      } catch (err) {
        console.error('销毁音频上下文失败:', err);
      }
    }
  }
}

// 创建单例
const audioPlayer = new AudioPlayer();

module.exports = audioPlayer;