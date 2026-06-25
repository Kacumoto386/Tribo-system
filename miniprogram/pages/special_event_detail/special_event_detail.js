const api = require('../../utils/api')

Page({
  data: {
    eventId: 0,
    event: { event_type: '' },
    eventTypes: { running: '🏃 跑步', cycling: '🚴 骑行', reading: '📖 读书', fitness: '💪 减肥', other: '🎯 其他' },
    logs: [],
    rankings: [],
    stats: {},
    currentTab: 0,
    showLog: false,
    submittingLog: false,
    logForm: { value: '', note: '' }
  },

  onLoad(options) {
    const id = parseInt(options.id)
    this.setData({ eventId: id })
    this.loadData()
  },

  onShow() {
    if (this.data.eventId) this.loadData()
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' })
    const id = this.data.eventId
    try {
      const [event, logs, rankings, stats] = await Promise.all([
        api.getEventDetail(id),
        api.getEventLogs(id).catch(() => []),
        api.getEventRankings(id).catch(() => []),
        api.getEventStats(id).catch(() => ({ total_logs: 0, total_value: 0, participants: 0 }))
      ])
      const et = this.data.eventTypes
      this.setData({
        event: { ...event, typeTag: et[event.event_type] || event.event_type },
        logs, rankings: (rankings || []).map(r => ({ ...r, initial: (r.user_id || '?')[0].toUpperCase() })), stats
      })

      // 画进度环
      setTimeout(() => this.drawRing(event.progress_percent || 0), 500)
    } catch (err) {
      console.error(err)
    }
    wx.hideLoading()
  },

  switchTab(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ currentTab: idx })
  },

  // 进度环 Canvas 绘制
  drawRing(percent) {
    const query = wx.createSelectorQuery()
    query.select('#progressRing')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getWindowInfo().pixelRatio
        const size = res[0].width
        canvas.width = size * dpr
        canvas.height = size * dpr
        ctx.scale(dpr, dpr)

        const cx = size / 2
        const cy = size / 2
        const r = size / 2 - 8
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + (percent / 100) * 2 * Math.PI

        ctx.clearRect(0, 0, size, size)

        // 背景圆环
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, 2 * Math.PI)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.lineWidth = 12
        ctx.stroke()

        // 进度圆环
        ctx.beginPath()
        ctx.arc(cx, cy, r, startAngle, endAngle)
        const grad = ctx.createLinearGradient(0, 0, size, size)
        grad.addColorStop(0, '#6c63ff')
        grad.addColorStop(1, '#ff6b9d')
        ctx.strokeStyle = grad
        ctx.lineWidth = 12
        ctx.lineCap = 'round'
        ctx.stroke()
      })
  },

  // 打卡
  logProgress() {
    this.setData({
      showLog: true,
      logForm: { value: '', note: '' }
    })
  },

  closeLog() {
    this.setData({ showLog: false })
  },

  onLogInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['logForm.' + field]: e.detail.value })
  },

  async submitLog() {
    const f = this.data.logForm
    if (!f.value || parseFloat(f.value) <= 0) {
      wx.showToast({ title: '请输入有效数值', icon: 'none' })
      return
    }

    this.setData({ submittingLog: true })
    try {
      await api.logEventProgress(this.data.eventId, {
        value: parseFloat(f.value),
        note: f.note.trim() || undefined
      })
      wx.showToast({ title: '打卡成功 🏃' })
      this.setData({ showLog: false })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '打卡失败', icon: 'none' })
    }
    this.setData({ submittingLog: false })
  }
})
