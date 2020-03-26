// 云函数入口文件
const cloud = require('wx-server-sdk')
var rp = require('request-promise');
cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  var options = {
    uri: "https://api.bilibili.com/x/player/pagelist",
    qs: {
      bvid: event.bvid
    }
  }
  return await rp(options)
    .then(res => {
      res = JSON.parse(res)
      let r = {"code":res.code,"cid":res.data[event.p].cid}
      return r
    })
    .catch(res => {
      res = JSON.parse(res)
      return res
    })

  
}