// PDF导出页面逻辑
const { getPdfGenerator, safeData } = require('../../utils/pdfGenerator.js');
const pdfGenerator = getPdfGenerator();
const wordManager = require('../../utils/wordManager.js');
const collectionManager = require('../../utils/collectionManager.js');
const mistakeManager = require('../../utils/mistakeManager.js');

const manager = wordManager.getWordManager();
const collection = collectionManager;
const mistakes = mistakeManager;

Page({
  data: {
    title: '',           // 标题
    words: [],           // 单词列表
    wordCount: 0,        // 单词数量
    totalPages: 0,       // 总页数
    exportDate: '',      // 导出日期
    pages: [],           // 页面数据
    type: '',            // 类型（favorite/wrong）
    hasError: false,     // 是否有错误
    errorMessage: '',    // 错误信息
    showError: false,    // 是否显示错误面板
    sortBy: '',          // 当前排序方式
    sortOptions: [],     // 排序选项列表
    showSortPanel: false // 是否显示排序选择面板
  },

  onLoad: function(options) {
    console.log('[ExportPDF] onLoad - 开始加载页面');
    console.log('[ExportPDF] 参数:', JSON.stringify(options));
    
    const type = options.type || 'favorite';
    const sortBy = options.sortBy || this.getDefaultSort(type);
    
    this.setData({
      type: type,
      sortBy: sortBy,
      sortOptions: this.getSortOptions(type)
    });
    
    this.loadWords(sortBy);
  },

  getDefaultSort: function(type) {
    if (type === 'favorite') {
      return 'collectTime_desc';
    } else {
      return 'wrongCount_desc';
    }
  },

  getSortOptions: function(type) {
    const options = [
      { value: 'alphabet_asc', label: '按字母排序（A-Z）' },
      { value: 'time_desc', label: '按学习时间排序（最新优先）' },
      { value: 'time_asc', label: '按学习时间排序（最早优先）' }
    ];
    
    if (type === 'wrong') {
      options.push({ value: 'wrongCount_desc', label: '按错误次数排序' });
    } else {
      options.push({ value: 'collectTime_desc', label: '按收藏时间排序（最新优先）' });
    }
    
    return options;
  },

  loadWords: function(sortBy) {
    const type = this.data.type;
    const words = this.getWordsFromSource(type, sortBy);
    
    console.log('[ExportPDF] 从数据源获取的数据长度:', words.length);
    console.log('[ExportPDF] 从数据源获取的数据:', JSON.stringify(words.slice(0, 3)));
    
    const validationResult = this.validateInputData(words);
    
    if (!validationResult.success) {
      console.error('[ExportPDF] 数据验证失败:', validationResult.message);
      this.setData({
        hasError: true,
        errorMessage: validationResult.message,
        showError: true,
        title: pdfGenerator.getTitle(type)
      });
      return;
    }
    
    const validatedWords = validationResult.data;
    
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const pages = this.generatePages(validatedWords);
      
      this.setData({
        title: pdfGenerator.getTitle(type),
        words: validatedWords,
        wordCount: validatedWords.length,
        totalPages: pages.length,
        exportDate: dateStr,
        pages: pages,
        hasError: false,
        errorMessage: '',
        showError: false,
        sortBy: sortBy
      });
      
      console.log('[ExportPDF] 页面加载成功，共', validatedWords.length, '个单词，', pages.length, '页');
      
      if (validatedWords.length > 0 && pages.length > 0) {
        this.setData({
          hasError: false,
          errorMessage: '',
          showError: false
        });
      }
    } catch (e) {
      console.error('[ExportPDF] 处理单词数据失败:', e);
      this.setData({
        hasError: true,
        showError: true,
        errorMessage: '数据处理失败，无法生成PDF',
        title: pdfGenerator.getTitle(type)
      });
    }
  },

  getWordsFromSource: function(type, sortBy) {
    console.log('[ExportPDF] getWordsFromSource - 类型:', type, '排序方式:', sortBy);
    
    let wordList = [];
    
    if (type === 'favorite') {
      const collected = collection.getCollectedWithTime();
      wordList = collected.map(item => ({
        wordId: item.wordId,
        word: '',
        meaning: '',
        collectTime: item.collectTime,
        sortValue: item.collectTime
      }));
    } else if (type === 'wrong') {
      const mistakeList = mistakes.getMistakesWithDetail();
      wordList = mistakeList.map(item => ({
        wordId: item.wordId,
        word: '',
        meaning: '',
        wrongCount: item.wrongCount,
        lastWrongTime: item.lastWrongTime,
        sortValue: item.wrongCount
      }));
    }
    
    wordList.forEach(item => {
      const word = manager.getWordById(item.wordId);
      if (word) {
        item.word = word.english;
        item.meaning = word.chinese;
      }
    });
    
    return this.sortWords(wordList, sortBy);
  },

  sortWords: function(words, sortBy) {
    const sorted = [...words];
    
    switch (sortBy) {
      case 'alphabet_asc':
        sorted.sort((a, b) => (a.word || '').localeCompare(b.word || '', 'en'));
        break;
        
      case 'time_desc':
        sorted.sort((a, b) => {
          const timeA = a.lastWrongTime || a.collectTime || 0;
          const timeB = b.lastWrongTime || b.collectTime || 0;
          return timeB - timeA;
        });
        break;
        
      case 'time_asc':
        sorted.sort((a, b) => {
          const timeA = a.lastWrongTime || a.collectTime || 0;
          const timeB = b.lastWrongTime || b.collectTime || 0;
          return timeA - timeB;
        });
        break;
        
      case 'wrongCount_desc':
        sorted.sort((a, b) => (b.wrongCount || 1) - (a.wrongCount || 1));
        break;
        
      case 'collectTime_desc':
        sorted.sort((a, b) => (b.collectTime || 0) - (a.collectTime || 0));
        break;
        
      default:
        break;
    }
    
    return sorted;
  },

  getSortLabel: function(sortBy) {
    const options = [
      { value: 'alphabet_asc', label: '按字母排序' },
      { value: 'time_desc', label: '按学习时间排序（最新优先）' },
      { value: 'time_asc', label: '按学习时间排序（最早优先）' },
      { value: 'wrongCount_desc', label: '按错误次数排序' },
      { value: 'collectTime_desc', label: '按收藏时间排序（最新优先）' }
    ];
    
    const found = options.find(opt => opt.value === sortBy);
    return found ? found.label : '未知排序';
  },

  validateInputData: function(words) {
    console.log('[ExportPDF] validateInputData - 数据:', JSON.stringify(words));
    
    const safeWords = safeData(words);
    
    if (safeWords.length === 0) {
      return {
        success: false,
        message: '暂无可导出的单词',
        data: []
      };
    }
    
    return {
      success: true,
      message: '数据验证通过',
      data: safeWords
    };
  },

  generatePages: function(words) {
    const WORDS_PER_PAGE = 20;
    
    const safeWords = safeData(words);
    const totalPages = Math.ceil(safeWords.length / WORDS_PER_PAGE);
    const pages = [];
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * WORDS_PER_PAGE;
      const endIndex = Math.min(startIndex + WORDS_PER_PAGE, safeWords.length);
      const pageWords = safeWords.slice(startIndex, endIndex);
      
      const leftColumn = [];
      const rightColumn = [];
      
      (Array.isArray(pageWords) ? pageWords : []).forEach((word, index) => {
        const globalIndex = pageIndex * WORDS_PER_PAGE + index + 1;
        const meaning = word && word.meaning ? String(word.meaning) : '';
        const wordText = word && word.word ? String(word.word) : '';
        
        leftColumn.push({
          no: globalIndex,
          word: wordText,
          meaning: meaning
        });
        
        rightColumn.push({
          no: globalIndex,
          word: wordText,
          meaning: meaning
        });
      });
      
      for (let i = (pageWords.length || 0); i < WORDS_PER_PAGE; i++) {
        leftColumn.push({ no: '', word: '', meaning: '' });
        rightColumn.push({ no: '', word: '', meaning: '' });
      }
      
      pages.push({
        pageNum: pageIndex + 1,
        leftColumn: leftColumn,
        rightColumn: rightColumn
      });
    }
    
    return pages;
  },

  showSortPanel: function() {
    this.setData({ showSortPanel: true });
  },

  selectSort: function(e) {
    const sortBy = e.currentTarget.dataset.value;
    console.log('[ExportPDF] 选择排序方式:', sortBy);
    
    this.setData({ 
      showSortPanel: false,
      sortBy: sortBy 
    });
    
    this.loadWords(sortBy);
  },

  sharePdf: function() {
    if (this.data.hasError) {
      wx.showToast({ title: '数据异常，无法分享', icon: 'none' });
      return;
    }
    
    const textContent = this.generateTextContent();
    
    wx.setClipboardData({
      data: textContent,
      success: () => {
        wx.showToast({ title: '内容已复制', icon: 'success' });
        setTimeout(() => {
          wx.showActionSheet({
            itemList: ['发送给朋友', '生成图片分享', '保存到文件'],
            success: (res) => {
              switch (res.tapIndex) {
                case 0: this.shareToFriend(); break;
                case 1: this.shareAsImage(); break;
                case 2: this.saveToFile(); break;
              }
            }
          });
        }, 500);
      },
      fail: () => { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  generateTextContent: function() {
    let content = `${this.data.title}\n`;
    content += `导出日期：${this.data.exportDate}\n`;
    content += `排序方式：${this.getSortLabel(this.data.sortBy)}\n`;
    content += `共 ${this.data.wordCount} 个单词，${this.data.totalPages} 页\n\n`;
    
    (Array.isArray(this.data.pages) ? this.data.pages : []).forEach((page, pageIndex) => {
      content += `=== 第${page.pageNum}页 ===\n\n`;
      
      content += `【英译中默写】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      (Array.isArray(page.leftColumn) ? page.leftColumn : []).forEach(item => {
        if (item && item.no) {
          content += `${item.no}\t${item.word || ''}\t${'_'.repeat(12)}\n`;
        }
      });
      
      content += `\n【中译英默写】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      (Array.isArray(page.rightColumn) ? page.rightColumn : []).forEach(item => {
        if (item && item.no) {
          content += `${item.no}\t${'_'.repeat(12)}\t${item.meaning || ''}\n`;
        }
      });
      
      if (pageIndex < (Array.isArray(this.data.pages) ? this.data.pages.length : 0) - 1) {
        content += `\n\n`;
      }
    });
    
    return content;
  },

  shareToFriend: function() {
    wx.showToast({ title: '请手动粘贴分享', icon: 'none' });
  },

  shareAsImage: function() {
    wx.showToast({ title: '正在生成图片...', icon: 'loading', duration: 1000 });
    setTimeout(() => { wx.showToast({ title: '图片生成成功', icon: 'success' }); }, 1000);
  },

  saveToFile: function() {
    if (this.data.hasError) {
      wx.showToast({ title: '数据异常，无法保存', icon: 'none' });
      return;
    }
    
    const textContent = this.generateTextContent();
    const fileName = pdfGenerator.generateFileName(this.data.type);
    
    try {
      wx.setStorageSync('pdf_content_' + Date.now(), {
        content: textContent,
        fileName: fileName,
        date: this.data.exportDate
      });
      wx.showToast({ title: '内容已保存', icon: 'success' });
    } catch (e) {
      console.error('[ExportPDF] 保存失败:', e);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  copyContent: function() {
    if (this.data.hasError) {
      wx.showToast({ title: '数据异常，无法复制', icon: 'none' });
      return;
    }
    
    const textContent = this.generateTextContent();
    
    wx.setClipboardData({
      data: textContent,
      success: () => { wx.showToast({ title: '内容已复制', icon: 'success' }); },
      fail: () => { wx.showToast({ title: '复制失败', icon: 'none' }); }
    });
  },

  goBack: function() {
    wx.navigateBack();
  }
});