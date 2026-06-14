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
   * 生成PDF内容（HTML格式，用于转换）
   * @param {Array} words - 单词数组
   * @param {String} title - 标题
   * @returns {String} - HTML内容
   */
  generateHtmlContent(words, title) {
    // 按字母顺序排序并去重
    const sortedWords = this.sortAndDeduplicate(words);
    
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
    
    return html;
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
    words.forEach((word, index) => {
      const globalIndex = (currentPage - 1) * this.WORDS_PER_PAGE + index + 1;
      html += `
            <div style="display: flex; margin-bottom: 3mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; color: #333;">${globalIndex}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_NORMAL}mm; color: #333; font-weight: 500;">${word.word}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; color: #999; border-bottom: 1px dashed #ccc; text-align: center;">&nbsp;</span>
            </div>`;
    });
    
    // 填充空白行
    for (let i = words.length; i < this.WORDS_PER_PAGE; i++) {
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
    words.forEach((word, index) => {
      const globalIndex = (currentPage - 1) * this.WORDS_PER_PAGE + index + 1;
      const meaning = Array.isArray(word.meaning) ? word.meaning.join('; ') : (word.meaning || '');
      html += `
            <div style="display: flex; margin-bottom: 3mm;">
              <span style="width: 15mm; font-size: ${this.FONT_SIZE_SMALL}mm; color: #333;">${globalIndex}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_NORMAL}mm; color: #333; font-weight: 500;">${word.word}</span>
              <span style="flex: 1; font-size: ${this.FONT_SIZE_SMALL}mm; color: #666; text-align: center;">${meaning}</span>
            </div>`;
    });
    
    // 填充空白行
    for (let i = words.length; i < this.WORDS_PER_PAGE; i++) {
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
      return [];
    }
    
    // 去重
    const uniqueWords = [];
    const seen = new Set();
    
    words.forEach(word => {
      const key = word.word.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueWords.push(word);
      }
    });
    
    // 按字母顺序排序
    uniqueWords.sort((a, b) => {
      return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
    });
    
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