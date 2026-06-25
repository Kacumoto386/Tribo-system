const api = require('../../utils/api')

Page({
  data: {
    achievements: [],
    filteredAchievements: [],
    catIndex: 0,
    earnedCount: 0,
    totalCount: 0,
    progressPercent: 0
  },

  onLoad() {
    this.loadAchievements()
  },

  onShow() {
    this.loadAchievements()
  },

  async loadAchievements() {
    try {
      const achievements = await api.getAchievements()
      const totalCount = achievements.length
      const earnedCount = achievements.filter(a => a.earned).length
      const progressPercent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0
      this.setData({ achievements, totalCount, earnedCount, progressPercent })
      this.filterAchievements()
    } catch (err) {
      console.error(err)
    }
  },

  switchCat(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ catIndex: idx })
    this.filterAchievements()
  },

  filterAchievements() {
    const catMap = ['', 'workout', 'habit', 'event']
    const cat = this.data.catIndex === 0 ? '' : catMap[this.data.catIndex]
    const filtered = cat
      ? this.data.achievements.filter(a => a.category === cat)
      : this.data.achievements
    this.setData({ filteredAchievements: filtered })
  }
})
