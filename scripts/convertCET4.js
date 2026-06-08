/**
 * CET-4 词库数据转换脚本
 *
 * 功能：将 data/3-CET4-顺序.json 转换为当前项目可直接使用的词库格式
 * 输出：data/cet4_converted.js
 */

const fs = require('fs');
const path = require('path');

// 文件路径配置
const INPUT_FILE = path.join(__dirname, '../data/3-CET4-顺序.json');
const OUTPUT_FILE = path.join(__dirname, '../data/cet4_converted.js');

/**
 * 转换单个单词数据
 * @param {Object} item - 原始单词数据
 * @param {number} index - 索引
 * @returns {Object} 转换后的单词对象
 */
function convertWordItem(item, index) {
  const translation = item.translations?.[0] || {};

  // 处理短语搭配
  let collocation = '';
  if (item.phrases && Array.isArray(item.phrases) && item.phrases.length > 0) {
    collocation = item.phrases.map(p => p.phrase).join('; ');
  }

  return {
    id: index + 1,
    word: item.word,
    english: item.word,
    phonetic: '',
    partOfSpeech: translation.type || '',
    meaning: translation.translation || '',
    chinese: translation.translation || '',
    example: '',
    translation: '',
    collocation: collocation,
    root: '',
    audio: ''
  };
}

/**
 * 主转换函数
 */
function convertCET4() {
  console.log('========================================');
  console.log('CET-4 词库数据转换脚本');
  console.log('========================================\n');

  // 1. 读取原始数据
  console.log('📖 正在读取原始数据...');
  let rawData;
  try {
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf8');
    rawData = JSON.parse(fileContent);
    console.log(`✅ 原始数据读取成功`);
  } catch (error) {
    console.error(`❌ 读取原始数据失败: ${error.message}`);
    process.exit(1);
  }

  // 2. 统计原始数据
  const originalCount = rawData.length;
  console.log(`📊 原始单词总数: ${originalCount}\n`);

  // 3. 转换数据
  console.log('🔄 正在转换数据...');
  const convertedData = rawData.map((item, index) => convertWordItem(item, index));
  console.log(`✅ 数据转换完成\n`);

  // 4. 生成输出内容
  const outputContent = `// CET-4 词汇库 - 转换自 3-CET4-顺序.json
// 单词总数: ${convertedData.length}
// 转换时间: ${new Date().toLocaleString('zh-CN')}

module.exports = ${JSON.stringify(convertedData, null, 2)};`;

  // 5. 写入输出文件
  console.log('💾 正在写入输出文件...');
  try {
    fs.writeFileSync(OUTPUT_FILE, outputContent, 'utf8');
    console.log(`✅ 输出文件写入成功\n`);
  } catch (error) {
    console.error(`❌ 写入输出文件失败: ${error.message}`);
    process.exit(1);
  }

  // 6. 输出统计信息
  console.log('========================================');
  console.log('转换完成统计');
  console.log('========================================');
  console.log(`📊 原始单词总数: ${originalCount}`);
  console.log(`📊 转换后单词总数: ${convertedData.length}`);
  console.log(`📁 输出文件路径: ${OUTPUT_FILE}`);
  console.log('========================================\n');

  // 7. 数据质量检查
  console.log('🔍 数据质量检查:');
  let validCount = 0;
  let missingTranslationCount = 0;
  let hasPhrasesCount = 0;

  convertedData.forEach(word => {
    if (word.word && word.chinese) {
      validCount++;
    }
    if (!word.chinese) {
      missingTranslationCount++;
    }
    if (word.collocation) {
      hasPhrasesCount++;
    }
  });

  console.log(`   ✅ 有效单词: ${validCount}/${convertedData.length}`);
  console.log(`   ⚠️  缺少翻译: ${missingTranslationCount}`);
  console.log(`   📝 包含短语: ${hasPhrasesCount}`);
  console.log();

  // 8. 使用说明
  console.log('========================================');
  console.log('使用说明');
  console.log('========================================');
  console.log('1. 检查生成的文件: data/cet4_converted.js');
  console.log('2. 修改 utils/wordManager.js 中的引用:');
  console.log('   将 const cet4Data = require("../data/cet4.js");');
  console.log('   改为 const cet4Data = require("../data/cet4_converted.js");');
  console.log('3. 重启小程序以加载新词库');
  console.log('========================================\n');
}

// 执行转换
convertCET4();