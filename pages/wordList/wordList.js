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
    showLetterToast: false,    // 是否显示字母提示
    loading: true              // 是否正在加载
  },

  onLoad: function() {
    console.log('[WordList] onLoad - 页面加载');
  },

  onShow: function() {
    console.log('[WordList] onShow - 页面显示');
    this.loadWordList();
  },

  // 加载单词列表
  loadWordList: function() {
    console.log('[WordList] loadWordList - 开始加载单词列表');
    
    // 设置加载状态
    this.setData({ loading: true });
    
    const wordMgr = wordManager.getWordManager();
    
    if (!wordMgr) {
      console.error('[WordList] loadWordList - wordManager 为 null');
      this.setData({ 
        loading: false,
        totalWords: 0,
        words: [],
        filteredWords: []
      });
      return;
    }
    
    console.log('[WordList] loadWordList - 获取到wordManager:', wordMgr !== null);
    
    // 使用 getTotalCount() 获取词库总单词数
    const totalCount = wordMgr.getTotalCount();
    console.log('[WordList] loadWordList - getTotalCount返回:', totalCount);
    
    // 使用 getAllWords() 获取单词列表
    const allWords = wordMgr.getAllWords();
    console.log('[WordList] loadWordList - getAllWords返回类型:', typeof allWords);
    console.log('[WordList] loadWordList - getAllWords返回:', allWords);
    console.log('[WordList] loadWordList - getAllWords长度:', allWords ? allWords.length : 0);
    
    const libraryName = wordMgr.getLibraryName();
    console.log('[WordList] loadWordList - 当前词库名称:', libraryName);
    
    const libraryKey = wordMgr.getLibraryKey();
    console.log('[WordList] loadWordList - 当前词库Key:', libraryKey);
    
    // 确保是数组
    const wordsArray = Array.isArray(allWords) ? allWords : [];
    
    // 生成字母索引
    const alphabetIndex = this.generateAlphabetIndex(wordsArray);
    console.log('[WordList] loadWordList - 字母索引:', alphabetIndex);
    
    this.setData({
      libraryName: libraryName,
      totalWords: totalCount,
      words: wordsArray,
      filteredWords: wordsArray,
      alphabetIndex: alphabetIndex,
      loading: false
    });
    
    console.log('[WordList] loadWordList - 数据设置完成');
  },

  // 生成字母索引
  generateAlphabetIndex: function(words) {
    if (!Array.isArray(words)) {
      console.warn('[WordList] generateAlphabetIndex - 输入不是数组:', words);
      return [];
    }
    
    const letters = new Set();
    
    words.forEach(word => {
      if (word && word.word && word.word.length > 0) {
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
    
    if (searchText.trim() && Array.isArray(this.data.words)) {
      filteredWords = this.data.words.filter(word => {
        if (!word) return false;
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
    if (Array.isArray(filteredWords)) {
      const index = filteredWords.findIndex(word => 
        word && word.word && word.word.charAt(0).toUpperCase() === letter
      );
      
      if (index >= 0) {
        console.log('[WordList] 定位到索引:', index);
      }
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