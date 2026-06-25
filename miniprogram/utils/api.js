const app = getApp()

const request = (method, path, data) => {
  return new Promise((resolve, reject) => {
    const baseUrl = app.globalData.baseUrl
    const token = wx.getStorageSync('token')

    wx.request({
      url: `${baseUrl}${path}`,
      method,
      data,
      timeout: 8000,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({ code: res.statusCode, msg: res.data?.detail || '请求失败' })
        }
      },
      fail: (err) => {
        reject({ code: -1, msg: '网络异常，请检查后端是否启动' })
      }
    })
  })
}

// ========== 用户 ==========
const login = (id, nickname) => request('POST', '/api/users/login', { id, nickname })
const wxLogin = (code) => request('POST', '/api/users/wx-login', { code })
const getMe = () => request('GET', '/api/users/me')
const updateMe = (data) => request('PUT', '/api/users/me', data)

// ========== 团队 ==========
const getTeams = (archived) => request('GET', '/api/teams', archived ? { archived: 'true' } : undefined)
const createTeam = (data) => request('POST', '/api/teams', data)
const joinTeam = (data) => request('POST', '/api/teams/join', data)
const getTeamDetails = (id) => request('GET', `/api/teams/${id}`)
const autoJoinTeam = (teamId) => request('POST', `/api/teams/${teamId}/auto-join`)
const updateTeam = (teamId, data) => request('PUT', `/api/teams/${teamId}`, data)
const archiveTeam = (teamId) => request('PUT', `/api/teams/${teamId}/archive`)
const restoreTeam = (teamId) => request('PUT', `/api/teams/${teamId}/restore`)
const leaveTeam = (teamId) => request('POST', `/api/teams/${teamId}/leave`)
const getTeamMembers = (id) => request('GET', `/api/teams/${id}/members`)
const getTeamActivities = (id, params) => request('GET', `/api/teams/${id}/activities`, params)
const createTeamActivity = (teamId, data) => request('POST', `/api/teams/${teamId}/activities`, data)
const getActivity = (activityId) => request('GET', `/api/teams/activities/${activityId}`)
const updateActivity = (activityId, data) => request('PUT', `/api/teams/activities/${activityId}`, data)
const signupActivity = (activityId) => request('POST', `/api/teams/activities/${activityId}/signup`)
const checkinActivity = (activityId) => request('POST', `/api/teams/activities/${activityId}/checkin`)
const cancelSignup = (activityId) => request('POST', `/api/teams/activities/${activityId}/cancel`)

// ========== 团队动态 Feed ==========
const getTeamFeed = (teamId, params) => request('GET', `/api/teams/${teamId}/feed`, params)
const getGlobalFeed = (params) => request('GET', '/api/teams/feed/all', params)

// ========== 活动评论 ==========
const getActivityComments = (teamId, activityId) => request('GET', `/api/teams/${teamId}/activities/${activityId}/comments`)
const addActivityComment = (teamId, activityId, data) => request('POST', `/api/teams/${teamId}/activities/${activityId}/comments`, data)
const deleteComment = (commentId) => request('DELETE', `/api/teams/activities/comments/${commentId}`)

// ========== 团队公告 ==========
const getTeamAnnouncements = (teamId) => request('GET', `/api/teams/${teamId}/announcements`)
const createAnnouncement = (teamId, data) => request('POST', `/api/teams/${teamId}/announcements`, data)
const deleteAnnouncement = (announcementId) => request('DELETE', `/api/teams/announcements/${announcementId}`)

// ========== 通知 ==========
const getNotifications = (params) => request('GET', '/api/notifications', params)
const getUnreadCount = () => request('GET', '/api/notifications/unread-count')
const markNotificationRead = (id) => request('PUT', `/api/notifications/${id}/read`)
const markAllRead = () => request('PUT', '/api/notifications/read-all')

// ========== 专项目标 ==========
const getEvents = (params) => request('GET', '/api/events', params)
const createEvent = (data) => request('POST', '/api/events', data)
const getEventDetail = (id) => request('GET', `/api/events/${id}`)
const logEventProgress = (id, data) => request('POST', `/api/events/${id}/log`, data)
const getEventLogs = (id) => request('GET', `/api/events/${id}/logs`)
const getEventRankings = (id) => request('GET', `/api/events/${id}/ranking`)
const getEventStats = (id) => request('GET', `/api/events/${id}/stats`)

// ========== 成就系统 ==========
const getAchievements = () => request('GET', '/api/stats/achievements')

// ========== 活动扩展: 任务 ==========
const getActivityTasks = (activityId) => request('GET', `/api/teams/activities/${activityId}/tasks`)
const getMyTasks = () => request('GET', '/api/teams/tasks/my')
const getMyTodos = () => request('GET', '/api/teams/tasks/my-todos')
const createTask = (activityId, data) => request('POST', `/api/teams/activities/${activityId}/tasks`, data)
const updateTask = (taskId, data) => request('PUT', `/api/teams/activities/tasks/${taskId}`, data)
const updateTaskStatus = (taskId, data) => request('PUT', `/api/teams/activities/tasks/${taskId}/status`, data)
const deleteTask = (taskId) => request('DELETE', `/api/teams/activities/tasks/${taskId}`)

// ========== 活动扩展: 物资 ==========
const getActivityResources = (activityId) => request('GET', `/api/teams/activities/${activityId}/resources`)
const createResource = (activityId, data) => request('POST', `/api/teams/activities/${activityId}/resources`, data)
const updateResource = (resourceId, data) => request('PUT', `/api/teams/activities/resources/${resourceId}`, data)
const deleteResource = (resourceId) => request('DELETE', `/api/teams/activities/resources/${resourceId}`)
const getAssignments = (resourceId) => request('GET', `/api/teams/activities/resources/${resourceId}/assignments`)
const createAssignment = (resourceId, data) => request('POST', `/api/teams/activities/resources/${resourceId}/assignments`, data)
const updateAssignment = (assignmentId, data) => request('PUT', `/api/teams/activities/resources/assignments/${assignmentId}`, data)

// ========== 活动扩展: 场地 ==========
const getVenue = (activityId) => request('GET', `/api/teams/activities/${activityId}/venue`)
const createVenue = (activityId, data) => request('POST', `/api/teams/activities/${activityId}/venue`, data)
const updateVenue = (venueId, data) => request('PUT', `/api/teams/activities/venue/${venueId}`, data)
const deleteVenue = (venueId) => request('DELETE', `/api/teams/activities/venue/${venueId}`)
const getSetupItems = (venueId) => request('GET', `/api/teams/activities/venue/${venueId}/items`)
const createSetupItem = (venueId, data) => request('POST', `/api/teams/activities/venue/${venueId}/items`, data)
const updateSetupItem = (itemId, data) => request('PUT', `/api/teams/activities/venue/items/${itemId}`, data)
const deleteSetupItem = (itemId) => request('DELETE', `/api/teams/activities/venue/items/${itemId}`)

// ========== 采购 ==========
const getProcurements = (activityId) => request('GET', `/api/teams/activities/${activityId}/procurements`)
const createProcurement = (activityId, data) => request('POST', `/api/teams/activities/${activityId}/procurements`, data)
const updateProcurement = (procurementId, data) => request('PUT', `/api/teams/activities/procurements/${procurementId}`, data)
const deleteProcurement = (procurementId) => request('DELETE', `/api/teams/activities/procurements/${procurementId}`)
const getProcurementClaims = (procurementId) => request('GET', `/api/teams/activities/procurements/${procurementId}/claims`)
const createProcurementClaim = (procurementId, data) => request('POST', `/api/teams/activities/procurements/${procurementId}/claims`, data)
const updateProcurementClaim = (claimId, data) => request('PUT', `/api/teams/activities/procurements/claims/${claimId}`, data)
const deleteProcurementClaim = (claimId) => request('DELETE', `/api/teams/activities/procurements/claims/${claimId}`)
const getProcurementStats = (activityId) => request('GET', `/api/teams/activities/${activityId}/procurement-stats`)

// ========== 活动聚合详情 ==========
const getActivityFullDetail = (activityId) => request('GET', `/api/teams/activities/${activityId}/full-detail`)

// ========== 成员留言 ==========
const getTeamMessages = (teamId, targetUserId) => request('GET', `/api/teams/${teamId}/members/${targetUserId}/messages`)
const addTeamMessage = (teamId, targetUserId, data) => request('POST', `/api/teams/${teamId}/members/${targetUserId}/messages`, data)
const deleteTeamMessage = (messageId) => request('DELETE', `/api/teams/members/messages/${messageId}`)

module.exports = {
  login, wxLogin, getMe, updateMe,
  getTeams, createTeam, joinTeam, getTeamDetails, autoJoinTeam, updateTeam, archiveTeam, restoreTeam, leaveTeam, getTeamMembers,
  getTeamActivities, createTeamActivity, getActivity, updateActivity,
  signupActivity, checkinActivity, cancelSignup,
  getTeamFeed, getGlobalFeed,
  getActivityComments, addActivityComment, deleteComment,
  getTeamAnnouncements, createAnnouncement, deleteAnnouncement,
  getNotifications, getUnreadCount, markNotificationRead, markAllRead,
  getEvents, createEvent, getEventDetail, logEventProgress,
  getEventLogs, getEventRankings, getEventStats,
  getAchievements,
  getActivityTasks, getMyTasks, getMyTodos, createTask, updateTask, updateTaskStatus, deleteTask,
  getActivityResources, createResource, updateResource, deleteResource,
  getAssignments, createAssignment, updateAssignment,
  getVenue, createVenue, updateVenue, deleteVenue,
  getSetupItems, createSetupItem, updateSetupItem, deleteSetupItem,
  getActivityFullDetail,
  getTeamMessages, addTeamMessage, deleteTeamMessage,
  getProcurements, createProcurement, updateProcurement, deleteProcurement,
  getProcurementClaims, createProcurementClaim, updateProcurementClaim, deleteProcurementClaim,
  getProcurementStats,
}
