// PDF生成工具类
// 使用 jsPDF 库生成 PDF

class PdfGenerator {
  constructor() {
    // A4纸尺寸（单位：mm）
    this.A4_WIDTH = 210;
    this.A4_HEIGHT = 297;
    
    // 页面边距
    this.MARGIN = 15;
    
    // 每页单词数
    this.WORDS_PER_PAGE = 20;
    
    // 左右栏配置
    this.COLUMN_WIDTH = (210 - 30) / 2; // (A4宽度 - 左右边距) / 2
    this.LEFT_COLUMN_X = 15;
    this.RIGHT_COLUMN_X = 120;
    
    // 字体大小
    this.FONT_SIZE_SMALL = 10;
    this.FONT_SIZE_NORMAL = 12;
    this.FONT_SIZE_TITLE = 18;
    this.FONT_SIZE_SUBTITLE = 10;
    
    // 行间距
    this.LINE_HEIGHT = 12;
    
    // 页眉高度
    this.HEADER_HEIGHT = 35;
    
    // 页脚高度
    this.FOOTER_HEIGHT = 20;
  }

  /**
   * 数据安全检查
   * @param {Array} words - 单词数组
   * @returns {Object} - { success: boolean, message: string, data: Array }
   */
  validateAndNormalizeData(words) {
    // 输出调试日志
    console.log('[PdfGenerator] 原始数据:', JSON.stringify(words));
    console.log('[PdfGenerator] 原始数据类型:', typeof words);
    console.log('[PdfGenerator] 原始数据长度:', Array.isArray(words) ? words.length : 'N/A');
    
    // 检查数据是否存在
    if (words === null || words === undefined) {
      console.log('[PdfGenerator] 数据检查失败：数据为 null 或 undefined');
      return {
        success: false,
        message: '暂无数据，无法生成PDF',
        data: []
      };
    }
    
    // 检查是否为数组
    if (!Array.isArray(words)) {
      console.log('[PdfGenerator] 数据检查失败：数据不是数组');
      return {
        success: false,
        message: '暂无数据，无法生成PDF',
        data: []
      };
    }
    
    // 检查数组长度
    if (words.length === 0) {
      console.log('[PdfGenerator] 数据检查失败：数组为空');
      return {
        success: false,
        message: '暂无数据，无法生成PDF',
        data: []
      };
    }
    
    // 数据标准化处理
    const normalizedData = this.normalizeWordData(words);
    
    console.log('[PdfGenerator] 清洗后数据长度:', normalizedData.length);
    console.log('[PdfGenerator] 前5个数据结构:', JSON.stringify(normalizedData.slice(0, 5)));
    
    // 检查标准化后的数据
    if (normalizedData.length === 0) {
      console.log('[PdfGenerator] 数据检查失败：标准化后数据为空');
      return {
        success: false,
        message: '暂无有效数据，无法生成PDF',
        data: []
      };
    }
    
    return {
      success: true,
      message: '数据验证通过',
      data: normalizedData
    };
  }

  /**
   * 标准化单词数据
   * @param {Array} words - 原始单词数组
   * @returns {Array} - 标准化后的数组
   */
  normalizeWordData(words) {
    // 使用 Array.isArray 防止报错
    return (Array.isArray(words) ? words : []).map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      
      // 提取 word 字段（支持多种字段名）
      let word = '';
      if (item.word) word = String(item.word).trim();
      else if (item.english) word = String(item.english).trim();
      else if (item.Word) word = String(item.Word).trim();
      else if (item.WORD) word = String(item.WORD).trim();
      
      // 提取 meaning 字段（支持多种字段名）
      let meaning = '';
      if (item.meaning) {
        meaning = Array.isArray(item.meaning) ? item.meaning.join('; ') : String(item.meaning).trim();
      } else if (item.chinese) {
        meaning = Array.isArray(item.chinese) ? item.chinese.join('; ') : String(item.chinese).trim();
      } else if (item.cn) {
        meaning = Array.isArray(item.cn) ? item.cn.join('; ') : String(item.cn).trim();
      } else if (item.definition) {
        meaning = Array.isArray(item.definition) ? item.definition.join('; ') : String(item.definition).trim();
      } else if (item.translation) {
        meaning = Array.isArray(item.translation) ? item.translation.join('; ') : String(item.translation).trim();
      }
      
      // 验证单词和释义是否有效
      if (!word || word.length === 0) {
        return null;
      }
      
      return {
        word: word,
        meaning: meaning || ''
      };
    }).filter(item => item !== null); // 过滤无效数据
  }

  /**
   * 生成PDF内容（HTML格式，用于转换）
   * @param {Array} words - 单词数组
   * @param {String} title - 标题
   * @returns {Object} - { success: boolean, message: string, content: string, pageCount: number }
   */
  generateHtmlContent(words, title) {
    // 数据验证
    const validationResult = this.validateAndNormalizeData(words);
    
    if (!validationResult.success) {
      return {
        success: false,
        message: validationResult.message,
        content: '',
        pageCount: 0
      };
    }
    
    // 按字母顺序排序并去重
    const sortedWords = this.sortAndDeduplicate(validationResult.data);
    
    const totalPages = Math.ceil(sortedWords.length / this.WORDS_PER_PAGE);
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let html = '';
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * this.WORDS_PER_PAGE;
      const endIndex = Math.min(startIndex + this.WORDS_PER_PAGE, sortedWords.length);
      const pageWords = sortedWords.slice(startIndex, endIndex);
      
      html += this.generatePageHtml(pageWords, title, dateStr, pageIndex + 1, totalPages);
    }
    
    console.log('[PdfGenerator] HTML内容生成成功，共', totalPages, '页');
    
    return {
      success: true,
      message: 'PDF内容生成成功',
      content: html,
      pageCount: totalPages,
      wordCount: sortedWords.length
    };
  }

  /**
   * 生成单页HTML
   */
  generatePageHtml(words, title, dateStr, currentPage, totalPages) {
    let html = `
      <div style="page-break-after: always; width: ${this.A4_WIDTH}mm; height: ${this.A4_HEIGHT}mm; padding: ${this.MARGIN}mm; box-sizing: border-box; font-family: 'SimSun', 'Microsoft YaHei', sans-serif;">
        <!-- 页眉 -->
        <div style="text-align: center; margin-bottom: 15mm;">
          <h1 style="font-size: ${this.FONT_SIZE_TITLE}mm; margin: 0; color: #333;">${title}</h1>
          <p style="font-size: ${this.FONT_SIZE_SUBTITLE}mm; margin: 2mm 0 0 0; color: #666;">导出日期：${dateStr}</p>
        </div>
        
        <!-- 内容区域 -->
        <div style="display: flex; justify-content: space-between; height: calc(100% - ${this.HEADER_HEIGHT}mm - ${this.FOOTER_HEIGHT}mm);">
          <!-- 左栏（默写区） -->
          <div style="width: ${this.COLUMN_WIDTH}mm;">
            <div style="display: flex; border-bottom: 1px solid #ccc; margin-bottom: 5mm; padding-bottom: 2mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; font-weight: bold; color: #333;">NO.</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; font-weight: bold; color: #333; text-align: center;">Vocabulary</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; font-weight: bold; color: #333; text-align: center;">Meaning</span>
            </div>`;
    
    // 左栏单词列表（默写区）
    (Array.isArray(words) ? words : []).forEach((word, index) => {
      const globalIndex = (currentPage - 1) * this.WORDS_PER_PAGE + index + 1;
      html += `
            <div style="display: flex; margin-bottom: 3mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; color: #333;">${globalIndex}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_NORMAL}mm; color: #333; font-weight: 500;">${word.word}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; color: #999; border-bottom: 1px dashed #ccc; text-align: center;">&nbsp;</span>
            </div>`;
    });
    
    // 填充空白行
    const emptyRows = Math.max(0, this.WORDS_PER_PAGE - (Array.isArray(words) ? words.length : 0));
    for (let i = 0; i < emptyRows; i++) {
      html += `
            <div style="display: flex; margin-bottom: 3mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; color: #333;">&nbsp;</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_NORMAL}mm;">&nbsp;</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm;">&nbsp;</span>
            </div>`;
    }
    
    html += `
          </div>
          
          <!-- 右栏（答案区） -->
          <div style="width: ${this.COLUMN_WIDTH}mm;">
            <div style="display: flex; border-bottom: 1px solid #ccc; margin-bottom: 5mm; padding-bottom: 2mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; font-weight: bold; color: #333;">NO.</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; font-weight: bold; color: #333; text-align: center;">Vocabulary</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; font-weight: bold; color: #333; text-align: center;">Meaning</span>
            </div>`;
    
    // 右栏单词列表（答案区）
    (Array.isArray(words) ? words : []).forEach((word, index) => {
      const globalIndex = (currentPage - 1) * this.WORDS_PER_PAGE + index + 1;
      html += `
            <div style="display: flex; margin-bottom: 3mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; color: #333;">${globalIndex}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_NORMAL}mm; color: #333; font-weight: 500;">${word.word}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; color: #666; text-align: center;">${word.meaning}</span>
            </div>`;
    });
    
    // 填充空白行
    for (let i = 0; i < emptyRows; i++) {
      html += `
            <div style="display: flex; margin-bottom: 3mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; color: #333;">&nbsp;</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_NORMAL}mm;">&nbsp;</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm;">&nbsp;</span>
            </div>`;
    }
    
    html += `
          </div>
        </div>
        
        <!-- 页脚 -->
        <div style="text-align: center; margin-top: 10mm;">
          <span style="font-size: ${this.FONT_SIZE_SMALL}mm; color: #666;">第${currentPage}页 / 共${totalPages}页</span>
        </div>
      </div>`;
    
    return html;
  }

  /**
   * 按字母顺序排序并去重
   * @param {Array} words - 单词数组
   * @returns {Array} - 排序去重后的数组
   */
  sortAndDeduplicate(words) {
    if (!words || !Array.isArray(words)) {
      console.log('[PdfGenerator] sortAndDeduplicate: 输入数据无效');
      return [];
    }
    
    console.log('[PdfGenerator] sortAndDeduplicate - 输入长度:', words.length);
    
    // 去重
    const uniqueWords = [];
    const seen = new Set();
    
    (Array.isArray(words) ? words : []).forEach(word => {
      if (word && word.word) {
        const key = word.word.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueWords.push(word);
        }
      }
    });
    
    console.log('[PdfGenerator] sortAndDeduplicate - 去重后长度:', uniqueWords.length);
    
    // 按字母顺序排序
    uniqueWords.sort((a, b) => {
      if (!a.word || !b.word) return 0;
      return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
    });
    
    console.log('[PdfGenerator] sortAndDeduplicate - 排序完成');
    
    return uniqueWords;
  }

  /**
   * 生成PDF文件名
   * @param {String} type - 类型（favorite/wrong）
   * @returns {String} - 文件名
   */
  generateFileName(type) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (type === 'favorite') {
      return `收藏单词_${dateStr}.pdf`;
    } else if (type === 'wrong') {
      return `错题单词_${dateStr}.pdf`;
    }
    
    return `单词_${dateStr}.pdf`;
  }

  /**
   * 获取标题
   * @param {String} type - 类型（favorite/wrong）
   * @returns {String} - 标题
   */
  getTitle(type) {
    if (type === 'favorite') {
      return '收藏单词默写本';
    } else if (type === 'wrong') {
      return '错题单词默写本';
    }
    return '单词默写本';
  }
}

// 导出单例
let instance = null;

function getPdfGenerator() {
  if (!instance) {
    instance = new PdfGenerator();
  }
  return instance;
}

module.exports = {
  PdfGenerator,
  getPdfGenerator
};