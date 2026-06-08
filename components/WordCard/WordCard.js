// WordCard 组件
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    word: {
      type: Object,
      value: {},
      observer: 'onWordChange'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    collocationList: []
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onWordChange(word) {
      if (word && word.collocation) {
        // 将分号分隔的搭配字符串转换为数组
        const collocations = word.collocation.split(';').map(item => item.trim()).filter(item => item);
        this.setData({
          collocationList: collocations
        });
      } else {
        this.setData({
          collocationList: []
        });
      }
    }
  },

  /**
   * 组件挂载时
   */
  attached() {
    this.onWordChange(this.properties.word);
  }
});