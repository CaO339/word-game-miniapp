// wordList.js - 词库单词浏览页面
const wordManager = require('../../utils/wordManager.js');

Page({
  data: {
    libraryName: '',           // 当前词库名称
    totalWords: 0,             // 总单词数
    words: [],                 // 单词列表
    searchText: '',            // 搜索关键词
    filteredWords: [],         // 过滤后的单词列表
    alphabetIndex: [],         // 字母索引
    currentLetter: '',         // 当前定位的字母
    showLetterToast: false     // 是否显示字母提示
  },

  onLoad: function() {
    this.loadWordList();
  },

  onShow: function() {
    this.loadWordList();
  },

  // 加载单词列表
  loadWordList: function() {
    const wordMgr = wordManager.getWordManager();
    const allWords = wordMgr.getAllWords();
    const libraryName = wordMgr.getLibraryName();
    
    console.log('[WordList] 当前词库:', libraryName);
    console.log('[WordList] 单词总数:', allWords.length);
    
    // 生成字母索引
    const alphabetIndex = this.generateAlphabetIndex(allWords);
    
    this.setData({
      libraryName: libraryName,
      totalWords: allWords.length,
      words: allWords,
      filteredWords: allWords,
      alphabetIndex: alphabetIndex
    });
  },

  // 生成字母索引
  generateAlphabetIndex: function(words) {
    const letters = new Set();
    
    words.forEach(word => {
      if (word.word && word.word.length > 0) {
        const firstLetter = word.word.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter)) {
          letters.add(firstLetter);
        }
      }
    });
    
    return Array.from(letters).sort();
  },

  // 搜索单词
  searchWords: function(e) {
    const searchText = e.detail.value.toLowerCase();
    console.log('[WordList] 搜索关键词:', searchText);
    
    let filteredWords = this.data.words;
    
    if (searchText.trim()) {
      filteredWords = this.data.words.filter(word => {
        const wordMatch = word.word && word.word.toLowerCase().includes(searchText);
        const meaningMatch = word.meaning && word.meaning.toLowerCase().includes(searchText);
        return wordMatch || meaningMatch;
      });
    }
    
    this.setData({
      searchText: searchText,
      filteredWords: filteredWords
    });
    
    console.log('[WordList] 搜索结果数量:', filteredWords.length);
  },

  // 点击字母索引
  jumpToLetter: function(e) {
    const letter = e.currentTarget.dataset.letter;
    console.log('[WordList] 跳转到字母:', letter);
    
    this.setData({
      currentLetter: letter,
      showLetterToast: true
    });
    
    // 3秒后隐藏提示
    setTimeout(() => {
      this.setData({ showLetterToast: false });
    }, 2000);
    
    // 滚动到对应字母位置
    const filteredWords = this.data.filteredWords;
    const index = filteredWords.findIndex(word => 
      word.word && word.word.charAt(0).toUpperCase() === letter
    );
    
    if (index >= 0) {
      // 小程序中可以通过scroll-view的scroll-into-view属性实现滚动定位
      console.log('[WordList] 定位到索引:', index);
    }
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },

  // 跳转到首页
  goHome: function() {
    wx.navigateBack();
  }
});