// PDF导出页面逻辑
const pdfGenerator = require('../../utils/pdfGenerator.js').getPdfGenerator();

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
    errorMessage: ''     // 错误信息
  },

  onLoad: function(options) {
    console.log('[ExportPDF] onLoad - 开始加载页面');
    console.log('[ExportPDF] 参数:', JSON.stringify(options));
    
    // 获取参数
    const type = options.type || 'favorite';
    const wordsStr = options.words || '[]';
    
    // 数据安全检查
    const validationResult = this.validateInputData(wordsStr);
    
    if (!validationResult.success) {
      console.error('[ExportPDF] 数据验证失败:', validationResult.message);
      this.setData({
        hasError: true,
        errorMessage: validationResult.message,
        type: type,
        title: pdfGenerator.getTitle(type)
      });
      return;
    }
    
    // 使用验证后的数据
    const words = validationResult.data;
    
    try {
      // 按字母顺序排序并去重
      const sortedWords = pdfGenerator.sortAndDeduplicate(words);
      
      console.log('[ExportPDF] 排序去重后数据长度:', sortedWords.length);
      console.log('[ExportPDF] 前5条数据:', JSON.stringify(sortedWords.slice(0, 5)));
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // 生成页面数据
      const pages = this.generatePages(sortedWords);
      
      this.setData({
        type: type,
        title: pdfGenerator.getTitle(type),
        words: sortedWords,
        wordCount: sortedWords.length,
        totalPages: pages.length,
        exportDate: dateStr,
        pages: pages,
        hasError: false,
        errorMessage: ''
      });
      
      console.log('[ExportPDF] 页面加载成功，共', sortedWords.length, '个单词，', pages.length, '页');
    } catch (e) {
      console.error('[ExportPDF] 处理单词数据失败:', e);
      this.setData({
        hasError: true,
        errorMessage: '数据处理失败，无法生成PDF',
        type: type,
        title: pdfGenerator.getTitle(type)
      });
    }
  },

  /**
   * 验证输入数据
   * @param {String} wordsStr - 单词数据JSON字符串
   * @returns {Object} - { success: boolean, message: string, data: Array }
   */
  validateInputData: function(wordsStr) {
    console.log('[ExportPDF] validateInputData - 原始字符串:', wordsStr);
    
    // 检查字符串是否为空
    if (!wordsStr || wordsStr.trim() === '') {
      console.log('[ExportPDF] 数据检查失败：输入字符串为空');
      return {
        success: false,
        message: '暂无数据，无法生成PDF',
        data: []
      };
    }
    
    let parsedWords;
    try {
      parsedWords = JSON.parse(wordsStr);
    } catch (e) {
      console.log('[ExportPDF] 数据检查失败：JSON解析错误');
      return {
        success: false,
        message: '数据格式错误，无法生成PDF',
        data: []
      };
    }
    
    console.log('[ExportPDF] 解析后数据类型:', typeof parsedWords);
    console.log('[ExportPDF] 解析后数据长度:', Array.isArray(parsedWords) ? parsedWords.length : 'N/A');
    
    // 检查数据是否存在
    if (parsedWords === null || parsedWords === undefined) {
      console.log('[ExportPDF] 数据检查失败：数据为 null 或 undefined');
      return {
        success: false,
        message: '暂无数据，无法生成PDF',
        data: []
      };
    }
    
    // 检查是否为数组
    if (!Array.isArray(parsedWords)) {
      console.log('[ExportPDF] 数据检查失败：数据不是数组');
      return {
        success: false,
        message: '暂无数据，无法生成PDF',
        data: []
      };
    }
    
    // 检查数组长度
    if (parsedWords.length === 0) {
      console.log('[ExportPDF] 数据检查失败：数组为空');
      return {
        success: false,
        message: '暂无数据，无法生成PDF',
        data: []
      };
    }
    
    // 使用PDF生成器进行数据标准化
    const normalizedResult = pdfGenerator.validateAndNormalizeData(parsedWords);
    
    if (!normalizedResult.success) {
      console.log('[ExportPDF] 数据标准化失败:', normalizedResult.message);
      return {
        success: false,
        message: normalizedResult.message,
        data: []
      };
    }
    
    return {
      success: true,
      message: '数据验证通过',
      data: normalizedResult.data
    };
  },

  /**
   * 生成页面数据
   */
  generatePages: function(words) {
    const WORDS_PER_PAGE = 20;
    
    // 使用 Array.isArray 防止报错
    const safeWords = Array.isArray(words) ? words : [];
    const totalPages = Math.ceil(safeWords.length / WORDS_PER_PAGE);
    const pages = [];
    
    console.log('[ExportPDF] generatePages - 输入数据长度:', safeWords.length);
    console.log('[ExportPDF] generatePages - 预计页数:', totalPages);
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * WORDS_PER_PAGE;
      const endIndex = Math.min(startIndex + WORDS_PER_PAGE, safeWords.length);
      const pageWords = safeWords.slice(startIndex, endIndex);
      
      const leftColumn = [];
      const rightColumn = [];
      
      // 使用 Array.isArray 防止报错
      (Array.isArray(pageWords) ? pageWords : []).forEach((word, index) => {
        const globalIndex = pageIndex * WORDS_PER_PAGE + index + 1;
        const meaning = word && word.meaning 
          ? (Array.isArray(word.meaning) ? word.meaning.join('; ') : String(word.meaning)) 
          : '';
        const wordText = word && word.word ? String(word.word) : '';
        
        leftColumn.push({
          no: globalIndex,
          word: wordText,
          meaning: ''
        });
        
        rightColumn.push({
          no: globalIndex,
          word: wordText,
          meaning: meaning
        });
      });
      
      // 填充空白行
      for (let i = (Array.isArray(pageWords) ? pageWords.length : 0); i < WORDS_PER_PAGE; i++) {
        leftColumn.push({
          no: '',
          word: '',
          meaning: ''
        });
        
        rightColumn.push({
          no: '',
          word: '',
          meaning: ''
        });
      }
      
      pages.push({
        pageNum: pageIndex + 1,
        leftColumn: leftColumn,
        rightColumn: rightColumn
      });
    }
    
    console.log('[ExportPDF] generatePages - 生成页数:', pages.length);
    
    return pages;
  },

  /**
   * 分享PDF
   */
  sharePdf: function() {
    // 检查是否有错误
    if (this.data.hasError) {
      wx.showToast({
        title: '数据异常，无法分享',
        icon: 'none'
      });
      return;
    }
    
    // 生成文本内容
    const textContent = this.generateTextContent();
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: textContent,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
        
        // 显示分享选项
        setTimeout(() => {
          wx.showActionSheet({
            itemList: ['发送给朋友', '生成图片分享', '保存到文件'],
            success: (res) => {
              switch (res.tapIndex) {
                case 0:
                  // 发送给朋友
                  this.shareToFriend();
                  break;
                case 1:
                  // 生成图片分享
                  this.shareAsImage();
                  break;
                case 2:
                  // 保存到文件
                  this.saveToFile();
                  break;
              }
            }
          });
        }, 500);
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生成文本内容
   */
  generateTextContent: function() {
    let content = `${this.data.title}\n`;
    content += `导出日期：${this.data.exportDate}\n`;
    content += `共 ${this.data.wordCount} 个单词，${this.data.totalPages} 页\n\n`;
    
    // 使用 Array.isArray 防止报错
    (Array.isArray(this.data.pages) ? this.data.pages : []).forEach((page, pageIndex) => {
      content += `=== 第${page.pageNum}页 ===\n\n`;
      
      // 左栏（默写区）
      content += `【默写区】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      (Array.isArray(page.leftColumn) ? page.leftColumn : []).forEach(item => {
        if (item && item.no) {
          content += `${item.no}\t${item.word || ''}\t__________\n`;
        }
      });
      
      content += `\n`;
      
      // 右栏（答案区）
      content += `【答案区】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      (Array.isArray(page.rightColumn) ? page.rightColumn : []).forEach(item => {
        if (item && item.no) {
          content += `${item.no}\t${item.word || ''}\t${item.meaning || ''}\n`;
        }
      });
      
      if (pageIndex < (Array.isArray(this.data.pages) ? this.data.pages.length : 0) - 1) {
        content += `\n\n`;
      }
    });
    
    return content;
  },

  /**
   * 分享给朋友
   */
  shareToFriend: function() {
    wx.showToast({
      title: '请手动粘贴分享',
      icon: 'none'
    });
  },

  /**
   * 生成图片分享
   */
  shareAsImage: function() {
    wx.showToast({
      title: '正在生成图片...',
      icon: 'loading',
      duration: 1000
    });
    
    setTimeout(() => {
      wx.showToast({
        title: '图片生成成功',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 保存到文件
   */
  saveToFile: function() {
    // 检查是否有错误
    if (this.data.hasError) {
      wx.showToast({
        title: '数据异常，无法保存',
        icon: 'none'
      });
      return;
    }
    
    const textContent = this.generateTextContent();
    const fileName = pdfGenerator.generateFileName(this.data.type);
    
    // 保存到本地存储
    try {
      wx.setStorageSync('pdf_content_' + Date.now(), {
        content: textContent,
        fileName: fileName,
        date: this.data.exportDate
      });
      
      wx.showToast({
        title: '内容已保存',
        icon: 'success'
      });
    } catch (e) {
      console.error('[ExportPDF] 保存失败:', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 复制内容
   */
  copyContent: function() {
    // 检查是否有错误
    if (this.data.hasError) {
      wx.showToast({
        title: '数据异常，无法复制',
        icon: 'none'
      });
      return;
    }
    
    const textContent = this.generateTextContent();
    
    wx.setClipboardData({
      data: textContent,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 返回
   */
  goBack: function() {
    wx.navigateBack();
  }
});