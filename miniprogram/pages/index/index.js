const api = require('../../utils/api')

Page({
  data: {
    loading: true,
    todayStr: '',
    initial: 'T',
    userInfo: {},
    greeting: '你好',
    teams: [],
    upcomingActivities: [],
    myTasks: [],
    myTodos: [],
    todoTasks: [],
    todoProcs: [],
    todoAssigns: [],
    todoSetups: [],
    showTodoDialog: false,
    todoDialogType: '',
    todoDialogList: [],
    feed: [],
    unreadCount: 0
  },

  onLoad() {
    this.setTodayInfo()
  },

  onShow() {
    this.loadData()
  },

  setTodayInfo() {
    const now = new Date()
    const h = now.getHours()
    let greeting = '下午好'
    if (h < 6) greeting = '夜深了'
    else if (h < 9) greeting = '早上好'
    else if (h < 12) greeting = '上午好'
    else if (h < 14) greeting = '中午好'
    else if (h < 18) greeting = '下午好'
    else greeting = '晚上好'

    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const str = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`

    this.setData({ greeting, todayStr: str })
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      // 每次启动同步用户身份
      try {
        const loginData = await wx.login()
        const result = await api.wxLogin(loginData.code)
        wx.setStorageSync('token', result.token)
        wx.setStorageSync('userInfo', result.user)
        wx.setStorageSync('user_id', result.user.id)
        // 显示当前登录用户
        const nick = result.user.nickname || result.user.id
        wx.showToast({ title: '👋 ' + nick, icon: 'none', duration: 1500 })
      } catch(e) {
        const info = wx.getStorageSync('userInfo')
        const nick = (info && info.nickname) || wx.getStorageSync('user_id') || '用户'
        wx.showToast({ title: '👋 ' + nick, icon: 'none', duration: 1500 })
      }
      let userInfo = wx.getStorageSync('userInfo') || { id: 'dev_user_001', nickname: 'Tribo 用户' }

      const [teams, unreadRes, myTodos] = await Promise.all([
        api.getTeams().catch(() => []),
        api.getUnreadCount().catch(() => ({ count: 0 })),
        api.getMyTodos().catch(() => []),
      ])
      // Group todos by type
      const todoTasks = (myTodos || []).filter(t => t.type === 'task')
      const todoProcs = (myTodos || []).filter(t => t.type === 'procurement')
      const todoAssigns = (myTodos || []).filter(t => t.type === 'assign')
      const todoSetups = (myTodos || []).filter(t => t.type === 'setup')

      // 加载每个团队的未来活动（近期预告）
      const now = new Date()
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      let upcomingActs = []
      for (const team of (teams || []).slice(0, 5)) {
        const acts = await api.getTeamActivities(team.id).catch(() => [])
        upcomingActs = upcomingActs.concat(
          (acts || [])
            .filter(a => a.activity_date && new Date(a.activity_date) >= now)
            .map(a => ({ ...a, _displayDate: (a.activity_date || '').replace('T', ' ').slice(0, 16), team_name: team.name }))
        )
      }
      upcomingActs.sort((a, b) => new Date(a.activity_date) - new Date(b.activity_date))
      upcomingActs = upcomingActs.slice(0, 8)

      const initial = (userInfo.nickname || 'T')[0].toUpperCase()
      const unreadCount = unreadRes.count || 0

      if (unreadCount > 0) {
        wx.setTabBarBadge({ index: 3, text: String(unreadCount) })
      } else {
        wx.removeTabBarBadge({ index: 3 })
      }

      this.setData({
        loading: false,
        userInfo,
        initial,
        teams: (teams || []).map(t => ({ ...t, initial: (t.name || 'T')[0].toUpperCase() })),
        upcomingActivities: upcomingActs,
        todoTasks,
        todoProcs,
        todoAssigns,
        todoSetups,
        myTodos: myTodos || [],
        unreadCount,
      })
    } catch (err) {
      console.error('load error:', err)
      this.setData({ loading: false })
    }
  },

  goTeams() { wx.switchTab({ url: '/pages/teams/teams' }) },
  goNotifications() { wx.navigateTo({ url: '/pages/notifications/notifications' }) },
  goCreateTeam() {
    wx.setStorageSync('show_create', '1')
    wx.switchTab({ url: '/pages/teams/teams' })
  },
  goGoals() { wx.switchTab({ url: '/pages/special_events/special_events' }) },
  goAchievements() { wx.navigateTo({ url: '/pages/achievements/achievements' }) },
  goProfile() { wx.switchTab({ url: '/pages/profile/profile' }) },
  goActivityDetail(e) {
    const id = e.currentTarget.dataset.id
    const teamId = e.currentTarget.dataset.teamId
    wx.navigateTo({ url: `/pages/activity_detail/activity_detail?id=${id}&team_id=${teamId}` })
  },

  // === 待办弹窗 ===

  showTodoDialog(e) {
    const type = e.currentTarget.dataset.type
    const map = { task: 'todoTasks', procurement: 'todoProcs', assign: 'todoAssigns', setup: 'todoSetups' }
    const list = this.data[map[type]] || []
    this.setData({ showTodoDialog: true, todoDialogType: type, todoDialogList: list })
  },

  closeTodoDialog() {
    this.setData({ showTodoDialog: false })
  },

  async completeTodoItem(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    try {
      if (item.type === 'task') {
        await api.updateTaskStatus(item.id, { status: 2 })
      } else if (item.type === 'procurement') {
        await api.updateProcurementClaim(item.id, { status: 1 })
      } else if (item.type === 'assign') {
        await api.updateAssignment(item.id, { status: 1 })
      } else if (item.type === 'setup') {
        await api.updateSetupItem(item.id, { status: 1 })
      }
      wx.showToast({ title: '已完成' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
    }
  },

  goTaskDetail(e) {
    const activityId = e.currentTarget.dataset.id
    const teamId = e.currentTarget.dataset.teamId
    const type = e.currentTarget.dataset.type
    const tabMap = { task: 3, procurement: 4, assign: 1, setup: 2 }
    const tab = tabMap[type] || 0
    wx.navigateTo({ url: `/pages/activity_detail/activity_detail?id=${activityId}&team_id=${teamId}&tab=${tab}` })
  },

  goTeamDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/team_detail/team_detail?id=${id}` })
  }
})
