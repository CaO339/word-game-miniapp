// 词库转换脚本
const fs = require('fs');
const path = require('path');

// 数据目录
const dataDir = path.join(__dirname, '../data');

// 转换函数
function convertJsonToJs(inputFile, outputFile, prefixId) {
  try {
    const jsonContent = fs.readFileSync(inputFile, 'utf-8');
    const words = JSON.parse(jsonContent);
    
    // 转换格式
    const converted = words.map((item, index) => {
      const translation = item.translations?.[0]?.translation || '';
      const partOfSpeech = item.translations?.[0]?.type || '';
      
      return {
        word: item.word,
        id: prefixId + index + 1,
        english: item.word,
        meaning: translation,
        partOfSpeech: partOfSpeech,
        collocation: (item.phrases || []).map(p => p.phrase).join('; ') || '',
        chinese: translation
      };
    });
    
    // 写入JS文件
    const jsContent = `// ${path.basename(inputFile)} - 转换后的词库\n// 单词总数: ${converted.length}\n\nmodule.exports = ${JSON.stringify(converted)};`;
    fs.writeFileSync(outputFile, jsContent, 'utf-8');
    
    console.log(`转换成功: ${inputFile} -> ${outputFile} (${converted.length}个单词)`);
    return converted.length;
  } catch (error) {
    console.error(`转换失败: ${inputFile}`, error.message);
    return 0;
  }
}

// 转换CET6
const cet6Count = convertJsonToJs(
  path.join(dataDir, '4-CET6-顺序.json'),
  path.join(dataDir, 'cet6_full.js'),
  20000
);

// 转换考研
const kaoyanCount = convertJsonToJs(
  path.join(dataDir, '5-考研-顺序.json'),
  path.join(dataDir, 'kaoyan_full.js'),
  30000
);

console.log(`\n转换完成:`);
console.log(`CET6词库: ${cet6Count}个单词`);
console.log(`考研词库: ${kaoyanCount}个单词`);
