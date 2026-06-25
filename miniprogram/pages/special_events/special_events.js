const api = require('../../utils/api')

Page({
  data: {
    events: [],
    typeIndex: 0,
    typeFilterMap: ['', 'running', 'cycling', 'reading', 'fitness', 'other'],
    eventTypes: { running: '🏃 跑步', cycling: '🚴 骑行', reading: '📖 读书', fitness: '💪 减肥', other: '🎯 其他' },
    showCreate: false,
    submitting: false,
    createForm: {
      title: '', description: '', event_type: 'running',
      goal_value: '100', unit: '公里', deadline: '',
      is_team_event: false
    }
  },

  onLoad() {
    this.loadEvents()
  },

  onShow() {
    this.loadEvents()
  },

  async loadEvents() {
    try {
      const typeFilter = this.data.typeFilterMap[this.data.typeIndex]
      const params = typeFilter ? { event_type: typeFilter } : {}
      const events = await api.getEvents(params)
      const typeMap = this.data.eventTypes
      this.setData({ events: (events || []).map(e => ({ ...e, typeTag: typeMap[e.event_type] || e.event_type })) })
    } catch (err) {
      console.error(err)
    }
  },

  switchType(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ typeIndex: idx })
    this.loadEvents()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/special_event_detail/special_event_detail?id=${id}` })
  },

  // 创建
  showCreateDialog() {
    this.setData({
      showCreate: true,
      createForm: {
        title: '', description: '', event_type: 'running',
        goal_value: '100', unit: '公里', deadline: '',
        is_team_event: false
      }
    })
  },

  closeCreate() {
    this.setData({ showCreate: false })
  },

  onCreateInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['createForm.' + field]: e.detail.value })
  },

  selectType(e) {
    const t = e.currentTarget.dataset.type
    const unitMap = { running: '公里', cycling: '公里', reading: '本', fitness: '公斤', other: '次' }
    this.setData({
      'createForm.event_type': t,
      'createForm.unit': unitMap[t] || '次'
    })
  },

  onDeadlineChange(e) {
    this.setData({ 'createForm.deadline': e.detail.value })
  },

  onTeamSwitch(e) {
    this.setData({ 'createForm.is_team_event': e.detail.value })
  },

  async submitCreate() {
    const f = this.data.createForm
    if (!f.title.trim()) {
      wx.showToast({ title: '请输入挑战名称', icon: 'none' })
      return
    }
    if (!f.goal_value || parseInt(f.goal_value) <= 0) {
      wx.showToast({ title: '请输入有效的目标值', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    try {
      const data = {
        title: f.title.trim(),
        description: f.description.trim(),
        event_type: f.event_type,
        goal_value: parseInt(f.goal_value),
        unit: f.unit || '次',
        is_team_event: f.is_team_event
      }
      if (f.deadline) {
        data.deadline = f.deadline + 'T23:59:59+08:00'
      }
      await api.createEvent(data)
      wx.showToast({ title: '发起成功 🏆' })
      this.setData({ showCreate: false })
      this.loadEvents()
    } catch (err) {
      wx.showToast({ title: err.msg || '发起失败', icon: 'none' })
    }
    this.setData({ submitting: false })
  }
})
