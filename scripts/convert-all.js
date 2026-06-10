const fs = require('fs');
const path = require('path');

// 转换函数
function convertJsonToJs(jsonPath, jsPath, startId) {
  console.log('正在转换:', jsonPath);
  
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const words = JSON.parse(jsonContent);
  
  console.log('原始单词数:', words.length);
  
  const converted = words.map((item, index) => {
    const translation = item.translations?.[0]?.translation || '';
    const partOfSpeech = item.translations?.[0]?.type || '';
    
    return {
      word: item.word,
      id: startId + index + 1,
      english: item.word,
      meaning: translation,
      partOfSpeech: partOfSpeech,
      collocation: (item.phrases || []).map(p => p.phrase).join('; ') || '',
      chinese: translation
    };
  });
  
  const jsContent = `const words = ${JSON.stringify(converted)};\nmodule.exports = words;`;
  fs.writeFileSync(jsPath, jsContent, 'utf-8');
  
  console.log('转换完成:', jsPath, '-', converted.length, '个单词');
  return converted.length;
}

// 转换CET6
const cet6Count = convertJsonToJs(
  path.join(__dirname, '../data/4-CET6-顺序.json'),
  path.join(__dirname, '../data/cet6.js'),
  20000
);

// 转换考研
const kaoyanCount = convertJsonToJs(
  path.join(__dirname, '../data/5-考研-顺序.json'),
  path.join(__dirname, '../data/kaoyan.js'),
  30000
);

console.log('\n=== 转换结果 ===');
console.log('CET6 total words:', cet6Count);
console.log('Kaoyan total words:', kaoyanCount);
