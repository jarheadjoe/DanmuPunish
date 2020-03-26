// pages/log/log.js
let constConfig = require('../../config/constConfig.js')
let apiConfig = require('../../config/apiConfig.js')
let imgConfig = require('../../config/imgConfig.js')
const userCollection = wx.cloud.database().collection("user")
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    noticeImgSrc: imgConfig.NOTICE_DEACTIVATE,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.from == constConfig.FOLLOW_OPTION){
      app.globalData.isFollowed = true
    }
  },

  logGetUserHandler: function () {
    var that = this;
    var openId = wx.getStorageSync('openId') || null
    wx.showLoading({
      title: '登陆中',
    })
    if (openId==null){
      that.getOpenCode()
      .then(()=>{
        wx.cloud.callFunction({
          name: apiConfig.OPENID_URL
        })
        .then((res) => {
          let openid = res.result.openId
          return that.wxLogIn(openid)
        })
        .then((userInfoWithOpen) => {
          return that.logIn(userInfoWithOpen)
        })
        .then(() => {
          wx.hideLoading()
          wx.navigateTo({
            url: '../input/input',
          })
        })
        .catch(err => {
          wx.hideLoading()
          console.log(err)
        })
      })
      .catch(err => {
        wx.hideLoading()
        console.log(err)
      })
      
    }
    else{
      app.globalData.openId = openId
      wx.hideLoading()
      wx.navigateTo({
        url: '../input/input',
      })
    }
    
    
      
  },
  getOpenCode(){
    return new Promise((resolve,reject)=>{
      // 登录
      wx.login({
        success: res => {
            resolve(res.code)
        },
        fail:res=>{
          return reject("log error")
        }
      })
    })
  },
  wxLogIn(openid){
    return new Promise((resolve,reject)=>{
      //获取用户信息
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: res => {
                var userInfo = res.userInfo
                userInfo['openid']=openid
                app.globalData.openId = openid
                wx.setStorageSync('openId', openid)
                resolve(userInfo)
              },
              fail: res => {
                //todo:授权失败，请稍后再试
                reject("log error")
              }
            })
          }
        }
      })
    })
  },
  getOpenId(){
    
    new Promise((resolve,reject)=>{
      wx.cloud.callFunction({
        name: 'getopenid'})
      .then(res=>{
        let openid = res.result.openId
        
        resolve(openid)
      })
    })
  },
  logIn(userInfoWithCode){

    new Promise((resolve,reject)=>{
      userCollection.where({ openid:userInfoWithCode.openid})
      .get()
      .then((res)=>{
        if(res.data.length==0){
          userCollection.add({
            data: userInfoWithCode,
            success: res => { return resolve() },
            fail: res => { return reject("error") }
          })
        }
        else{
          return resolve()
        }
        
      })
      
    })
    
  },
  noticeHandler:function(){
    wx.navigateTo({
      url: '../notice/notice',
    })
  }
})