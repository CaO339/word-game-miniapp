// WordCard 组件
const audioPlayer = require('../../utils/audioPlayer.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    word: {
      type: Object,
      value: {},
      observer: 'onWordChange'
    },
    showAnswer: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    collocationList: [],
    audioError: ''
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onWordChange(word) {
      // 清除错误提示
      this.setData({ audioError: '' });
      
      if (word && word.collocation) {
        // 将分号分隔的搭配字符串转换为数组
        const collocations = word.collocation.split(';').map(item => item.trim()).filter(item => item);
        this.setData({
          collocationList: collocations
        });
      } else {
        this.setData({
          collocationList: []
        });
      }
    },

    /**
     * 播放英音
     */
    playUK() {
      const word = this.properties.word.word || this.properties.word.english;
      if (!word) return;
      
      this.setData({ audioError: '' });
      
      audioPlayer.playUK(
        word,
        (err) => {
          this.setData({ audioError: err });
          // 3秒后自动清除错误提示
          setTimeout(() => {
            this.setData({ audioError: '' });
          }, 3000);
        },
        () => {
          // 播放成功，清除错误提示
          this.setData({ audioError: '' });
        }
      );
    },

    /**
     * 播放美音
     */
    playUS() {
      const word = this.properties.word.word || this.properties.word.english;
      if (!word) return;
      
      this.setData({ audioError: '' });
      
      audioPlayer.playUS(
        word,
        (err) => {
          this.setData({ audioError: err });
          // 3秒后自动清除错误提示
          setTimeout(() => {
            this.setData({ audioError: '' });
          }, 3000);
        },
        () => {
          // 播放成功，清除错误提示
          this.setData({ audioError: '' });
        }
      );
    }
  },

  /**
   * 组件挂载时
   */
  attached() {
    this.onWordChange(this.properties.word);
    audioPlayer.init();
  },

  /**
   * 组件卸载时
   */
  detached() {
    audioPlayer.stop();
  }
});