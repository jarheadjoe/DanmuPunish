//app.js
let apiConfig = require('/config/apiConfig.js')
let constConfig = require('/config/constConfig.js')
App({
  onLaunch: function () {
    wx.cloud.init({
      "env":"xxx",
      traceUser:true
    })
  },
  
  globalData: {
    openId:'',
    isFollowed:false,
  }
})