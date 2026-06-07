// 学习页面逻辑
const words = require('../../utils/words.js');

Page({
  data: {
    currentWord: {},      // 当前单词对象
    currentIndex: 0,     // 当前单词索引
    showAnswer: false,   // 是否显示答案
    isLastWord: false,   // 是否是最后一个单词
    totalWords: 0        // 总单词数
  },

  onLoad: function() {
    // 获取单词总数
    const totalWords = words.words.length;
    // 设置当前单词为第一个
    this.setData({
      currentWord: words.words[0],
      currentIndex: 0,
      totalWords: totalWords,
      isLastWord: totalWords === 1
    });
  },

  // 显示答案按钮点击事件
  showAnswer: function() {
    this.setData({
      showAnswer: true
    });
  },

  // 下一个单词按钮点击事件
  nextWord: function() {
    const { currentIndex, totalWords } = this.data;
    const nextIndex = currentIndex + 1;

    // 如果不是最后一个单词
    if (nextIndex < totalWords) {
      this.setData({
        currentIndex: nextIndex,
        currentWord: words.words[nextIndex],
        showAnswer: false,
        isLastWord: nextIndex === totalWords - 1
      });
    }
  },

  // 返回首页按钮点击事件
  goHome: function() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  }
});
