const recipes = [
  {
    name: '番茄鸡蛋面',
    category: '早餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '准备食材，番茄洗净切块，鸡蛋打散备用',
        ingredients: [
          { ingredient_name: '面条（生）', amount: 200 },
          { ingredient_name: '西红柿', amount: 150 },
          { ingredient_name: '鸡蛋', amount: 100 },
          { ingredient_name: '小葱', amount: 10 }
        ]
      },
      {
        step_order: 2,
        description: '热锅倒油，倒入蛋液炒散盛出',
        ingredients: [
          { ingredient_name: '花生油', amount: 15 }
        ]
      },
      {
        step_order: 3,
        description: '锅中加油，放入番茄炒出汤汁，加入盐、生抽调味',
        ingredients: [
          { ingredient_name: '盐', amount: 3 },
          { ingredient_name: '生抽', amount: 10 }
        ]
      },
      {
        step_order: 4,
        description: '加入炒好的鸡蛋，翻炒均匀后盛出作为卤',
        ingredients: []
      },
      {
        step_order: 5,
        description: '另起锅烧水，水开后下面条煮熟，捞出浇上番茄鸡蛋卤，撒上葱花即可',
        ingredients: []
      }
    ]
  },
  {
    name: '小米粥配肉包',
    category: '早餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '小米淘洗干净，加水浸泡30分钟',
        ingredients: [
          { ingredient_name: '小米', amount: 80 }
        ]
      },
      {
        step_order: 2,
        description: '锅中加水烧开，放入小米，大火煮开后转小火熬煮30分钟至粘稠',
        ingredients: []
      },
      {
        step_order: 3,
        description: '猪肉剁碎，加入葱姜末、生抽、盐搅拌成馅',
        ingredients: [
          { ingredient_name: '猪肉（瘦）', amount: 150 },
          { ingredient_name: '大葱', amount: 30 },
          { ingredient_name: '生姜', amount: 10 },
          { ingredient_name: '生抽', amount: 10 },
          { ingredient_name: '盐', amount: 2 }
        ]
      },
      {
        step_order: 4,
        description: '面粉加水揉成光滑面团，醒发30分钟',
        ingredients: [
          { ingredient_name: '面粉', amount: 200 }
        ]
      },
      {
        step_order: 5,
        description: '面团分成小剂子，包入肉馅，捏成包子形状，上屉蒸20分钟',
        ingredients: []
      }
    ]
  },
  {
    name: '燕麦水果碗',
    category: '早餐',
    servings: 1,
    steps: [
      {
        step_order: 1,
        description: '燕麦片用热牛奶冲泡，静置5分钟',
        ingredients: [
          { ingredient_name: '燕麦', amount: 50 },
          { ingredient_name: '牛奶', amount: 200 }
        ]
      },
      {
        step_order: 2,
        description: '香蕉切片，蓝莓洗净，草莓切块',
        ingredients: [
          { ingredient_name: '香蕉', amount: 50 },
          { ingredient_name: '蓝莓', amount: 30 },
          { ingredient_name: '草莓', amount: 50 }
        ]
      },
      {
        step_order: 3,
        description: '将水果铺在燕麦上，淋上蜂蜜，撒上核桃碎即可',
        ingredients: [
          { ingredient_name: '蜂蜜', amount: 10 },
          { ingredient_name: '核桃', amount: 15 }
        ]
      }
    ]
  },
  {
    name: '葱花鸡蛋饼',
    category: '早餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '面粉中打入鸡蛋，加入葱花、盐、水搅拌成面糊',
        ingredients: [
          { ingredient_name: '面粉', amount: 150 },
          { ingredient_name: '鸡蛋', amount: 100 },
          { ingredient_name: '小葱', amount: 20 },
          { ingredient_name: '盐', amount: 2 }
        ]
      },
      {
        step_order: 2,
        description: '平底锅刷油，倒入面糊，摊成薄饼',
        ingredients: [
          { ingredient_name: '花生油', amount: 10 }
        ]
      },
      {
        step_order: 3,
        description: '小火煎至两面金黄，取出切块即可',
        ingredients: []
      }
    ]
  },
  {
    name: '红薯山药粥',
    category: '早餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '红薯、山药去皮切小块，大米淘洗干净',
        ingredients: [
          { ingredient_name: '红薯', amount: 100 },
          { ingredient_name: '山药', amount: 100 },
          { ingredient_name: '大米', amount: 60 }
        ]
      },
      {
        step_order: 2,
        description: '锅中加水，放入所有食材，大火烧开转小火熬煮40分钟',
        ingredients: []
      },
      {
        step_order: 3,
        description: '煮至粘稠即可，可根据口味加少许白糖',
        ingredients: [
          { ingredient_name: '白糖', amount: 10 }
        ]
      }
    ]
  },
  {
    name: '红烧肉',
    category: '午餐',
    servings: 4,
    steps: [
      {
        step_order: 1,
        description: '五花肉切3厘米见方的块，冷水下锅焯水去血沫',
        ingredients: [
          { ingredient_name: '五花肉', amount: 500 },
          { ingredient_name: '料酒', amount: 20 }
        ]
      },
      {
        step_order: 2,
        description: '锅中放少许油，加白糖小火炒出糖色',
        ingredients: [
          { ingredient_name: '花生油', amount: 10 },
          { ingredient_name: '白糖', amount: 30 }
        ]
      },
      {
        step_order: 3,
        description: '放入五花肉翻炒上色，加入葱姜、八角、桂皮、花椒爆香',
        ingredients: [
          { ingredient_name: '大葱', amount: 20 },
          { ingredient_name: '生姜', amount: 10 },
          { ingredient_name: '八角', amount: 5 },
          { ingredient_name: '桂皮', amount: 3 },
          { ingredient_name: '花椒', amount: 3 }
        ]
      },
      {
        step_order: 4,
        description: '加生抽、老抽、料酒，加水没过肉块，大火烧开转小火炖1小时',
        ingredients: [
          { ingredient_name: '生抽', amount: 20 },
          { ingredient_name: '老抽', amount: 10 },
          { ingredient_name: '料酒', amount: 15 }
        ]
      },
      {
        step_order: 5,
        description: '加盐调味，大火收汁即可',
        ingredients: [
          { ingredient_name: '盐', amount: 4 }
        ]
      }
    ]
  },
  {
    name: '清蒸鲈鱼',
    category: '午餐',
    servings: 3,
    steps: [
      {
        step_order: 1,
        description: '鲈鱼处理干净，两面切花刀，用盐、料酒腌制15分钟',
        ingredients: [
          { ingredient_name: '鲈鱼', amount: 600 },
          { ingredient_name: '盐', amount: 3 },
          { ingredient_name: '料酒', amount: 15 }
        ]
      },
      {
        step_order: 2,
        description: '鱼肚中放入葱姜，鱼身铺上葱姜丝',
        ingredients: [
          { ingredient_name: '大葱', amount: 30 },
          { ingredient_name: '生姜', amount: 20 }
        ]
      },
      {
        step_order: 3,
        description: '水开后上屉蒸8分钟，取出倒掉盘中汤汁',
        ingredients: []
      },
      {
        step_order: 4,
        description: '淋上蒸鱼豉油，放上新鲜葱姜丝，浇上热油即可',
        ingredients: [
          { ingredient_name: '生抽', amount: 20 },
          { ingredient_name: '花生油', amount: 15 }
        ]
      }
    ]
  },
  {
    name: '宫保鸡丁',
    category: '午餐',
    servings: 3,
    steps: [
      {
        step_order: 1,
        description: '鸡胸肉切丁，用盐、料酒、淀粉腌制15分钟',
        ingredients: [
          { ingredient_name: '鸡胸肉', amount: 300 },
          { ingredient_name: '盐', amount: 2 },
          { ingredient_name: '料酒', amount: 10 },
          { ingredient_name: '淀粉', amount: 10 }
        ]
      },
      {
        step_order: 2,
        description: '花生米炸香备用，干辣椒切段，葱姜蒜切末',
        ingredients: [
          { ingredient_name: '花生', amount: 50 },
          { ingredient_name: '辣椒（红）', amount: 20 },
          { ingredient_name: '大葱', amount: 15 },
          { ingredient_name: '大蒜', amount: 10 },
          { ingredient_name: '生姜', amount: 10 }
        ]
      },
      {
        step_order: 3,
        description: '调制料汁：生抽、醋、白糖、淀粉、清水调匀',
        ingredients: [
          { ingredient_name: '生抽', amount: 15 },
          { ingredient_name: '醋', amount: 10 },
          { ingredient_name: '白糖', amount: 15 },
          { ingredient_name: '淀粉', amount: 5 }
        ]
      },
      {
        step_order: 4,
        description: '热锅倒油，放入鸡丁滑炒至变色盛出',
        ingredients: [
          { ingredient_name: '花生油', amount: 30 }
        ]
      },
      {
        step_order: 5,
        description: '锅中留底油，爆香干辣椒、花椒、葱姜蒜，倒入鸡丁翻炒',
        ingredients: [
          { ingredient_name: '花椒', amount: 5 }
        ]
      },
      {
        step_order: 6,
        description: '倒入料汁翻炒均匀，最后加入花生米翻炒几下即可',
        ingredients: []
      }
    ]
  },
  {
    name: '酸辣土豆丝',
    category: '午餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '土豆去皮切丝，用清水浸泡去淀粉',
        ingredients: [
          { ingredient_name: '土豆', amount: 300 }
        ]
      },
      {
        step_order: 2,
        description: '干辣椒切段，葱姜蒜切末',
        ingredients: [
          { ingredient_name: '辣椒（红）', amount: 10 },
          { ingredient_name: '大葱', amount: 10 },
          { ingredient_name: '大蒜', amount: 10 },
          { ingredient_name: '生姜', amount: 5 }
        ]
      },
      {
        step_order: 3,
        description: '热锅倒油，爆香干辣椒、花椒、葱姜蒜',
        ingredients: [
          { ingredient_name: '花生油', amount: 15 },
          { ingredient_name: '花椒', amount: 3 }
        ]
      },
      {
        step_order: 4,
        description: '放入土豆丝大火快炒，加醋、盐、生抽调味',
        ingredients: [
          { ingredient_name: '醋', amount: 15 },
          { ingredient_name: '盐', amount: 3 },
          { ingredient_name: '生抽', amount: 5 }
        ]
      },
      {
        step_order: 5,
        description: '炒至土豆丝断生即可出锅',
        ingredients: []
      }
    ]
  },
  {
    name: '麻婆豆腐',
    category: '午餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '豆腐切小块，开水焯烫2分钟捞出',
        ingredients: [
          { ingredient_name: '豆腐', amount: 300 }
        ]
      },
      {
        step_order: 2,
        description: '猪肉剁碎，葱姜蒜切末',
        ingredients: [
          { ingredient_name: '猪肉（瘦）', amount: 100 },
          { ingredient_name: '大葱', amount: 10 },
          { ingredient_name: '大蒜', amount: 15 },
          { ingredient_name: '生姜', amount: 5 }
        ]
      },
      {
        step_order: 3,
        description: '热锅倒油，放入肉末炒散变色',
        ingredients: [
          { ingredient_name: '花生油', amount: 15 }
        ]
      },
      {
        step_order: 4,
        description: '加入豆瓣酱、辣椒粉炒出红油，加入葱姜蒜末爆香',
        ingredients: [
          { ingredient_name: '豆瓣酱', amount: 30 },
          { ingredient_name: '辣椒粉', amount: 5 }
        ]
      },
      {
        step_order: 5,
        description: '加生抽、少许水，放入豆腐轻轻推动，小火煮3分钟',
        ingredients: [
          { ingredient_name: '生抽', amount: 10 }
        ]
      },
      {
        step_order: 6,
        description: '水淀粉勾芡，撒上花椒粉、葱花即可',
        ingredients: [
          { ingredient_name: '淀粉', amount: 5 },
          { ingredient_name: '花椒', amount: 3 },
          { ingredient_name: '小葱', amount: 10 }
        ]
      }
    ]
  },
  {
    name: '糖醋里脊',
    category: '晚餐',
    servings: 3,
    steps: [
      {
        step_order: 1,
        description: '猪里脊切小块，用盐、料酒、淀粉腌制15分钟',
        ingredients: [
          { ingredient_name: '猪里脊', amount: 400 },
          { ingredient_name: '盐', amount: 2 },
          { ingredient_name: '料酒', amount: 15 },
          { ingredient_name: '淀粉', amount: 30 }
        ]
      },
      {
        step_order: 2,
        description: '调制糖醋汁：生抽、老抽、醋、白糖、料酒、清水调匀',
        ingredients: [
          { ingredient_name: '生抽', amount: 15 },
          { ingredient_name: '老抽', amount: 5 },
          { ingredient_name: '醋', amount: 30 },
          { ingredient_name: '白糖', amount: 40 },
          { ingredient_name: '料酒', amount: 10 }
        ]
      },
      {
        step_order: 3,
        description: '热锅倒油，放入里脊炸至金黄酥脆捞出',
        ingredients: [
          { ingredient_name: '花生油', amount: 500 }
        ]
      },
      {
        step_order: 4,
        description: '锅中留底油，放入葱姜爆香，倒入糖醋汁烧开',
        ingredients: [
          { ingredient_name: '大葱', amount: 15 },
          { ingredient_name: '生姜', amount: 10 }
        ]
      },
      {
        step_order: 5,
        description: '放入炸好的里脊翻炒均匀，大火收汁即可',
        ingredients: []
      }
    ]
  },
  {
    name: '西红柿炖牛腩',
    category: '晚餐',
    servings: 4,
    steps: [
      {
        step_order: 1,
        description: '牛腩切3厘米见方的块，冷水下锅焯水去血沫',
        ingredients: [
          { ingredient_name: '牛腩', amount: 500 },
          { ingredient_name: '料酒', amount: 20 }
        ]
      },
      {
        step_order: 2,
        description: '西红柿去皮切块，葱姜切片，准备好八角、桂皮',
        ingredients: [
          { ingredient_name: '西红柿', amount: 300 },
          { ingredient_name: '大葱', amount: 20 },
          { ingredient_name: '生姜', amount: 15 },
          { ingredient_name: '八角', amount: 5 },
          { ingredient_name: '桂皮', amount: 3 }
        ]
      },
      {
        step_order: 3,
        description: '热锅倒油，放入葱姜爆香，加入西红柿炒出汤汁',
        ingredients: [
          { ingredient_name: '花生油', amount: 20 }
        ]
      },
      {
        step_order: 4,
        description: '加入番茄酱、生抽、老抽翻炒，加入牛腩翻炒均匀',
        ingredients: [
          { ingredient_name: '番茄酱', amount: 30 },
          { ingredient_name: '生抽', amount: 20 },
          { ingredient_name: '老抽', amount: 10 }
        ]
      },
      {
        step_order: 5,
        description: '加入八角、桂皮，加水没过食材，大火烧开转小火炖1.5小时',
        ingredients: []
      },
      {
        step_order: 6,
        description: '加盐调味，大火收汁即可',
        ingredients: [
          { ingredient_name: '盐', amount: 5 }
        ]
      }
    ]
  },
  {
    name: '清炒时蔬',
    category: '晚餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '西兰花切小朵，胡萝卜切片，木耳泡发撕小朵',
        ingredients: [
          { ingredient_name: '圆白菜', amount: 200 },
          { ingredient_name: '胡萝卜', amount: 50 },
          { ingredient_name: '木耳（水发）', amount: 50 }
        ]
      },
      {
        step_order: 2,
        description: '烧开水，加少许盐和油，将食材焯水1分钟捞出',
        ingredients: [
          { ingredient_name: '盐', amount: 2 },
          { ingredient_name: '花生油', amount: 5 }
        ]
      },
      {
        step_order: 3,
        description: '热锅倒油，放入蒜末爆香',
        ingredients: [
          { ingredient_name: '花生油', amount: 10 },
          { ingredient_name: '大蒜', amount: 15 }
        ]
      },
      {
        step_order: 4,
        description: '放入所有食材大火快炒，加盐、生抽调味',
        ingredients: [
          { ingredient_name: '盐', amount: 2 },
          { ingredient_name: '生抽', amount: 5 }
        ]
      },
      {
        step_order: 5,
        description: '翻炒均匀即可出锅',
        ingredients: []
      }
    ]
  },
  {
    name: '红烧鸡翅',
    category: '晚餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '鸡翅两面划几刀，冷水下锅焯水去血沫',
        ingredients: [
          { ingredient_name: '鸡翅', amount: 300 },
          { ingredient_name: '料酒', amount: 10 }
        ]
      },
      {
        step_order: 2,
        description: '鸡翅用厨房纸吸干水分，葱姜切片',
        ingredients: [
          { ingredient_name: '大葱', amount: 15 },
          { ingredient_name: '生姜', amount: 10 }
        ]
      },
      {
        step_order: 3,
        description: '锅中放少许油，鸡翅煎至两面金黄',
        ingredients: [
          { ingredient_name: '花生油', amount: 10 }
        ]
      },
      {
        step_order: 4,
        description: '加入葱姜、生抽、老抽、料酒、白糖翻炒',
        ingredients: [
          { ingredient_name: '生抽', amount: 15 },
          { ingredient_name: '老抽', amount: 5 },
          { ingredient_name: '料酒', amount: 10 },
          { ingredient_name: '白糖', amount: 30 }
        ]
      },
      {
        step_order: 5,
        description: '加入啤酒没过鸡翅，大火烧开转小火炖20分钟',
        ingredients: [
          { ingredient_name: '啤酒', amount: 250 }
        ]
      },
      {
        step_order: 6,
        description: '加盐调味，大火收汁至浓稠即可',
        ingredients: [
          { ingredient_name: '盐', amount: 2 }
        ]
      }
    ]
  },
  {
    name: '蒜蓉蒸虾',
    category: '晚餐',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '鲜虾剪去虾须，开背去虾线，洗净摆盘',
        ingredients: [
          { ingredient_name: '基围虾', amount: 300 }
        ]
      },
      {
        step_order: 2,
        description: '大蒜剁成蒜蓉，加入生抽、盐、白糖、香油调匀',
        ingredients: [
          { ingredient_name: '大蒜', amount: 30 },
          { ingredient_name: '生抽', amount: 15 },
          { ingredient_name: '盐', amount: 2 },
          { ingredient_name: '白糖', amount: 5 },
          { ingredient_name: '香油', amount: 5 }
        ]
      },
      {
        step_order: 3,
        description: '将蒜蓉酱均匀铺在虾背上',
        ingredients: []
      },
      {
        step_order: 4,
        description: '水开后上屉蒸6分钟',
        ingredients: []
      },
      {
        step_order: 5,
        description: '取出撒上葱花，浇上热油即可',
        ingredients: [
          { ingredient_name: '小葱', amount: 10 },
          { ingredient_name: '花生油', amount: 10 }
        ]
      }
    ]
  },
  {
    name: '凉拌黄瓜',
    category: '小食',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '黄瓜洗净拍扁切段，大蒜切末',
        ingredients: [
          { ingredient_name: '黄瓜', amount: 250 },
          { ingredient_name: '大蒜', amount: 15 }
        ]
      },
      {
        step_order: 2,
        description: '黄瓜放入碗中，加入蒜末、盐腌10分钟，挤去多余水分',
        ingredients: [
          { ingredient_name: '盐', amount: 3 }
        ]
      },
      {
        step_order: 3,
        description: '加入生抽、醋、白糖、香油、辣椒油拌匀',
        ingredients: [
          { ingredient_name: '生抽', amount: 10 },
          { ingredient_name: '醋', amount: 15 },
          { ingredient_name: '白糖', amount: 5 },
          { ingredient_name: '香油', amount: 5 },
          { ingredient_name: '辣椒酱', amount: 10 }
        ]
      },
      {
        step_order: 4,
        description: '撒上花生碎即可',
        ingredients: [
          { ingredient_name: '花生', amount: 15 }
        ]
      }
    ]
  },
  {
    name: '奶香玉米汁',
    category: '小食',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '甜玉米剥粒，清洗干净',
        ingredients: [
          { ingredient_name: '玉米（鲜）', amount: 200 }
        ]
      },
      {
        step_order: 2,
        description: '将玉米粒放入豆浆机，加入牛奶和水',
        ingredients: [
          { ingredient_name: '牛奶', amount: 200 }
        ]
      },
      {
        step_order: 3,
        description: '选择米糊或玉米汁功能，打至细腻',
        ingredients: []
      },
      {
        step_order: 4,
        description: '倒出后加入白糖或蜂蜜调味即可',
        ingredients: [
          { ingredient_name: '白糖', amount: 20 }
        ]
      }
    ]
  },
  {
    name: '卤味拼盘',
    category: '小食',
    servings: 4,
    steps: [
      {
        step_order: 1,
        description: '鸡腿、鸡翅洗净，鸡蛋煮熟去壳',
        ingredients: [
          { ingredient_name: '鸡腿', amount: 200 },
          { ingredient_name: '鸡蛋', amount: 150 },
          { ingredient_name: '鸡翅', amount: 150 }
        ]
      },
      {
        step_order: 2,
        description: '调制卤汁：锅中加水，放入生抽、老抽、料酒、白糖、盐、八角、桂皮、花椒、葱姜',
        ingredients: [
          { ingredient_name: '生抽', amount: 30 },
          { ingredient_name: '老抽', amount: 15 },
          { ingredient_name: '料酒', amount: 20 },
          { ingredient_name: '白糖', amount: 30 },
          { ingredient_name: '盐', amount: 5 },
          { ingredient_name: '八角', amount: 5 },
          { ingredient_name: '桂皮', amount: 3 },
          { ingredient_name: '花椒', amount: 5 },
          { ingredient_name: '大葱', amount: 20 },
          { ingredient_name: '生姜', amount: 15 }
        ]
      },
      {
        step_order: 3,
        description: '卤汁烧开后放入所有食材，小火卤30分钟',
        ingredients: []
      },
      {
        step_order: 4,
        description: '关火后继续浸泡2小时更入味，捞出切段摆盘即可',
        ingredients: []
      }
    ]
  },
  {
    name: '水果沙拉',
    category: '小食',
    servings: 2,
    steps: [
      {
        step_order: 1,
        description: '苹果、香蕉、草莓、猕猴桃洗净去皮切小块',
        ingredients: [
          { ingredient_name: '苹果', amount: 100 },
          { ingredient_name: '香蕉', amount: 100 },
          { ingredient_name: '草莓', amount: 80 },
          { ingredient_name: '猕猴桃', amount: 80 }
        ]
      },
      {
        step_order: 2,
        description: '蓝莓、葡萄洗净备用',
        ingredients: [
          { ingredient_name: '蓝莓', amount: 30 },
          { ingredient_name: '葡萄', amount: 50 }
        ]
      },
      {
        step_order: 3,
        description: '所有水果放入大碗中，加入酸奶拌匀',
        ingredients: [
          { ingredient_name: '酸奶', amount: 150 }
        ]
      },
      {
        step_order: 4,
        description: '淋上蜂蜜，撒上燕麦片和杏仁碎即可',
        ingredients: [
          { ingredient_name: '蜂蜜', amount: 10 },
          { ingredient_name: '燕麦', amount: 20 },
          { ingredient_name: '杏仁', amount: 15 }
        ]
      }
    ]
  },
  {
    name: '茶叶蛋',
    category: '小食',
    servings: 6,
    steps: [
      {
        step_order: 1,
        description: '鸡蛋洗净，冷水下锅煮8分钟，捞出过凉水',
        ingredients: [
          { ingredient_name: '鸡蛋', amount: 300 }
        ]
      },
      {
        step_order: 2,
        description: '将鸡蛋壳轻轻敲裂，便于入味',
        ingredients: []
      },
      {
        step_order: 3,
        description: '锅中加水，放入茶叶、生抽、老抽、盐、白糖、八角、桂皮、花椒',
        ingredients: [
          { ingredient_name: '茶叶', amount: 10 },
          { ingredient_name: '生抽', amount: 20 },
          { ingredient_name: '老抽', amount: 10 },
          { ingredient_name: '盐', amount: 5 },
          { ingredient_name: '白糖', amount: 15 },
          { ingredient_name: '八角', amount: 5 },
          { ingredient_name: '桂皮', amount: 3 },
          { ingredient_name: '花椒', amount: 5 }
        ]
      },
      {
        step_order: 4,
        description: '放入鸡蛋，大火烧开转小火煮20分钟',
        ingredients: []
      },
      {
        step_order: 5,
        description: '关火后浸泡过夜，第二天食用更入味',
        ingredients: []
      }
    ]
  }
];

module.exports = recipes;
