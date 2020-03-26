// pages/input/input.js
let imgConfig = require('../../config/imgConfig.js')
let constConfig = require('../../config/constConfig.js')
let apiConfig = require('../../config/apiConfig.js')
let hackApi = require('../../utils/hackCRC_uglify.js')
const danmuCollection = wx.cloud.database().collection("danmu")
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    //const 变量
    oneButton: [{ text: '好滴><', extClass: 'dialog-pink-button' }],//提示狂
    buttons: [{ text: '取消~', extClass: 'dialog-grey-button' }, { text: '选好了><', extClass: 'dialog-pink-button' }],
    //关键变量
    addressValue:"",//input avid or bvid
    danmuValue:"",//input
    isAv:"",//判断address是avid还是bvid
    cid:"",//tmp commnet id
    vName:"",//视频名字
    canvasImgPath: "",//canvas存储临时路径
    ziNum: 1,
    vAddress:"",
    vP:0,//如果有多个视频
    //显示变量
    inputButtonDisable:false,
    radioItems: [],
    danmuConfirmDialog:false,
    radioChooseValue:"",
    danmuUidDict: {},
    addressNoticeColor:constConfig.GREY_COLOR,
    addressNoticeImgSrc:imgConfig.NOTICE_DEACTIVATE,
    addressNoticeDialog:false,
    danmuNoticeColor: constConfig.GREY_COLOR,
    danmuNoticeImgSrc:imgConfig.NOTICE_DEACTIVATE,
    danmuNoticeDialog:false,
    forceNoticeColor: constConfig.GREY_COLOR,
    forceNoticeImgSrc: imgConfig.NOTICE_DEACTIVATE,
    forceNoticeDialog:false,
    forceChecked:false,
    bugNoticeDialog:false,
    
    errorMsg:"",
    successMsg:"",
    inputCoverSrc: imgConfig.DANMU_DEACTIVATE,
    //canvasData
    imageVisible: false,
    viewWidth: "",
    viewHeight: "",
    canvasWidth: "",
    canvasHeight: "",
    ratio: ""
  },

  //页面初始化，canvas确定大小
  onLoad: function (options) {
    showLoading("初始化")
    .then(()=>{return canvasInit(this)})
    .then(()=>{wx.hideLoading()})
    .catch(err=>{console.log("init error")})
  },
  //输入框操作响应
  addressInputHandler:function(e){this.data.addressValue = e.detail.value;},
  danmuInputHandler: function (e) {this.data.danmuValue = e.detail.value;},
  addressFocusHandler:function(e){this.setData({addressValue:""})},
  danmuFocusHandler: function (e) {this.setData({danmuValue: "",inputCoverSrc: imgConfig.DANMU_ACTIVATE })},
  addressBlurHandler:function(e){
    //失焦后剥离出avid bvid
    if(this.data.addressValue!=""){
      var regAv =  /(av[0-9]{1,12})/g
      var regBv = /(BV[0-9,A-Z,a-z]{10})/g
      var regP1= new RegExp("\\?p=[0-9]{1,3}","g")
      var regP2 = new RegExp("\/p[0-9]{1,3}","g")
      var addressListAv = this.data.addressValue.match(regAv);
      var addressListBv = this.data.addressValue.match(regBv); 
      var lenAv = addressListAv == null ? 0 : addressListAv.length;
      var lenBv = addressListBv == null ? 0 : addressListBv.length;
      if ((lenAv == 1 && lenBv == 0) || (lenAv == 0 && lenBv == 1)){
        let address_list = lenAv==1?addressListAv:addressListBv
        var address_str = address_list[0];
        var p = 1;
        var p1List = this.data.addressValue.match(regP1)
        var p2List = this.data.addressValue.match(regP2)
        var p1Len = p1List == null ? 0 : p1List.length;
        var p2Len = p2List == null ? 0 : p2List.length;
        if (p1Len==1 && p2Len==0){
          p = parseInt(p1List[0].slice(3))
        }
        if (p2Len == 1 && p2Len == 1) {
          p = parseInt(p2List[0].slice(2))
        }
        this.setData({
          successMsg: "真棒！地址格式正确，已经转换！",
          addressValue: address_str+",p"+p,
          vAddress: address_str,
          vP:p,
          isAv: lenAv == 1 ? true : false
        })
        noticeAddressController(this, false);
      }
      else {
        errorInputs(this, "链接输入错误，可查看提示哦~", true, false)
      }
    }
  },
  danmuBlurHandler:function(){this.setData({ inputCoverSrc: imgConfig.DANMU_DEACTIVATE })},
  //对话框操作响应
  addressNoticeHandler:function(){this.setData({addressNoticeDialog:true,})},
  bugNoticeHandler: function () { this.setData({ bugNoticeDialog: true, }) },
  danmuNoticeHandler:function(){this.setData({ danmuNoticeDialog: true })},
  forceNoticeHandler: function () {this.setData({forceNoticeDialog: true})},
  noticeCloseHandler: function () {this.setData({ 
      addressNoticeDialog: false ,
      danmuNoticeDialog: false,
      forceNoticeDialog:false,
      bugNoticeDialog:false
    })
    noticeAddressController(this, false);//关闭提示后，问号提示按钮恢复常态
    noticeDanmuController(this,false);
  },
  radioChange:function(e){this.setData({radioChooseValue:e.detail.value})},
  forceChange:function(e){
    let isChecked= e.detail.value
    let isFollowed = app.globalData.isFollowed;
    if(isChecked==true && isFollowed==false){
      this.setData({
        errorMsg:"请从公众号“大胃水手”中进入小程序",
        forceNoticeDialog:true
      })
      isChecked = false
    }
    this.setData({
      forceChecked:isChecked
    })
  },
  //canvas换一换响应
  imageChangeHandler: function () {
    var that = this
    const ctx = wx.createCanvasContext("share", this)
    const ziNum = generateRandom(1, constConfig.ZI_TOTAL_NUM,true,this.data.ziNum)
    this.setData({ziNum:ziNum})
    const ziUrl = imgConfig.ZI_ALL + ziNum.toString()+ ".png"
    const ziBackUrl = imgConfig.ZI_BACK
    ctx.drawImage(ziBackUrl, 183, 459, 400, 200);
    ctx.drawImage(ziUrl, 183, 459, 400, 200);
    ctx.draw(true, function () {
      saveCanvasTmp(that);
      console.log("change canvas success")
    });
  },
  //保存canvas响应
  canvasSaveHandler: function () {
    var that = this;
    if (that.data.canvasImgPath) {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.writePhotosAlbum']) {
            saveImage(that);
          } else {
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success(res) {
                saveImage(that);
              },
              fail(){
                wx.showModal({
                  title: '提示',
                  content: '你需要授权才能保存图片到相册',
                  success: function (res) {
                    if (res.confirm) {
                      wx.openSetting({
                        success: function (res) {
                          if (res.authSetting['scope.writePhotosAlbum']) {
                            saveImage(that);
                          };
                        },
                        fail: function () {
                          console.log("button_sava: fail");
                        }
                      })
                    }
                  }
                })
              }
            })
          };
        },
        fail() {
          that.setData({errorMsg:"保存失败，请开启权限后再试"})
        }
      })
    }
  },
  //canvas关闭响应
  canvasCloseHandler:function(){
    this.setData({imageVisible:false})
    const ctx = wx.createCanvasContext("share", this)
    let ratio = 1/this.data.ratio
    ctx.scale(ratio, ratio)
    ctx.draw(false)
  },
  recordRequest:function(aid,aname,cid,danmu,uidraw){
    let param = { openid: app.globalData.openId,aid, aid, aname: aname, cid: cid, danmu: danmu, uidraw: uidraw }
    return new Promise((resolve,reject)=>{
      danmuCollection.add({
        data: param,
        success: res => { return resolve() },
        fail: res => { return reject("error") }
      })
    })
    
  },
  //主逻辑操作
  //2检验视频存在，获得cid
  checkVedio:function(address,p){
    var that = this;
    var param = {p:p}, cloudFunction=""
    if(that.data.isAv){
      param.aid=address.slice(2)
      cloudFunction = apiConfig.PAGELIST_AV_URL
    }
    else{
      param.bvid=address
      cloudFunction = apiConfig.PAGELIST_BV_URL
    }
    return new Promise((resolve,reject)=>{
      wx.cloud.callFunction({
        name:cloudFunction,
        data:param
      })
      .then((res)=>{
        if (res.result.code == 0) {
          var cid = res.result.cid;
          that.setData({ cid: cid })
          return resolve(cid);
        }
        else {
          errorInputs(that, "搜索的视频不存在了哦~", true);
          return reject('error2-1');
        }
      })
      .catch((err)=>{
        errorInputs(that, "服务器严重错误，稍后重试或进行问题反馈", true, true);
        return reject('error2-2');
      })
    })
  },
  //3检验弹幕,返回弹幕列表
  checkComment:function(cid,danmu){
    var that = this;
    return new Promise((resolve,reject)=>{
      wx.request({
        url: `${apiConfig.COMMENT_URL}${cid}.xml`,
        success(res) {
          var xml_sting = res.data;
          // var reg = new RegExp('(?<=<d p="[^"]*">)[^<]*' + danmu + '[^<]*(?=<\/d>)', 'g');
          var reg = new RegExp('[^>]*' + danmu + '[^<]*', 'g');
          var danmu_list = xml_sting.match(reg);
          var danmu_list_set = Array.from(new Set(danmu_list))
          var len_set = danmu_list_set.length
          if (len_set == 0) {
            errorInputs(that, "关键词匹配到的弹幕不存在哦！修改下吧",false,true)
            noticeDanmuController(that,true);
            return reject('error3-1')
          }
          if (len_set>20){
            errorInputs(that, "关键词匹配到的弹幕太多啦>20！修改下吧", false, true)
            noticeDanmuController(that, true);
            return reject('error3-2')
          }
          var danmu_id_dict={};
          var reg_uid = new RegExp('<d p="([^,]*,){6}[^,]*,[^"]*">[^<]*' + danmu + '[^<]*', 'g');
          var temp_l = xml_sting.match(reg_uid);
          var danmu_set = new Set(danmu_list_set)
          for (let i = 0; i < temp_l.length;i++){
            let name = temp_l[i].split('">')[1];
            if (danmu_set.has(name)){
              let uid = temp_l[i].split(',')[6];
              danmu_id_dict[danmu_list_set[i]] = uid;
              danmu_set.delete(name);
            }
          }
          resolve(danmu_id_dict)
        },
        fail(res) {
          errorInputs(that, "服务器严重错误，稍后重试或进行问题反馈");
          return reject('error3-3');
        }
      })
    })
  },
  //4弹出弹幕选择框
  chooseDanmu(danmu_dict){
    var radio_l = [];
    for (let key in danmu_dict){
      radio_l.push({'name':key,'value':key})
    }
    radio_l[0]['checked']=true;
    var first_v = radio_l[0]['name'];
    this.setData({ 
      radioChooseValue:first_v,
      radioItems: radio_l,
      successMsg: "官方搜索成功，请确认弹幕~" ,
      danmuConfirmDialog:true,
      danmuUidDict:danmu_dict
    })
    noticeDanmuController(this, false);
  },
  //4-2获得视频名
  getVideoName(addressValue,cid){
    var param = {'cid':cid}, url = ""
    if (this.data.isAv) {
      param.aid = addressValue.slice(2)
      url = apiConfig.AVNAME_URL
    }
    else {
      param.bvid = addressValue
      url = apiConfig.BVNAME_URL
    }
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name:url,
        data:param
      })
      .then((res)=>{
        if (res.result.code == 0) {
          var name = res.result.title;
          return resolve(name);
        }
        else {
          errorInputs(that, "搜索的视频名字丢了", true);
          return reject('error4-3');
        }
      })
      .catch(res=>{
        errorInputs(that, "服务器严重错误，稍后重试或进行问题反馈", true, true);
        return reject('error4-4');
      })
    })
  },
  //5搜索用户id
  findUid: function (uid) {
    var that = this;
    return new Promise((resolve,reject)=>{
      var id = hackApi.get_possible_id(constConfig.MIN_UID,constConfig.MAX_UID,uid);
      if (id.length == 0) {
        errorInputs(this, "未能找到该弹幕的用户，抱歉~");
        return reject('error5');
      }
      else {
        //console.log(id[0]);
        resolve(id[0]); 
      }
    })
    
  },
  //6获得用户信息
  getUserInfoById:function(id){
    var that = this;
    return new Promise((resolve,reject)=>{
      wx.cloud.callFunction({
        name: apiConfig.INFO_URL,
        data: {
          'id': id
        }
      })
      .then((res)=>{
        if (res.result.code == "0") {
          var name = res.result.name;
          var faceImgUrl = res.result.face;
          return resolve([name, faceImgUrl]);
        }
        else {
          errorInputs(that, "服务器严重错误，稍后重试或进行问题反馈");
          return reject('error7-1');
        }
      })
      .catch(res=>{
        errorInputs(that, "服务器严重错误，稍后重试或进行问题反馈");
        return reject('error7-2');
      })
    })
  },
  //7绘图
  draw: function (uName, danmu, vId, vName, faceObj) {
    let ziNum = generateRandom(1, constConfig.ZI_TOTAL_NUM)
    const ziUrl = imgConfig.ZI_ALL + ziNum + ".png"
    this.setData({ ziNum: ziNum })
    var that = this;
    return new Promise((resolve,reject)=>{
      const ctx = wx.createCanvasContext('share', that)
      const ratio = that.data.ratio
      const canvasWidth = that.data.canvasWidth
      const canvasHeight = that.data.canvasHeight
      ctx.scale(ratio, ratio)
      ctx.drawImage(imgConfig.CANVAS_BACK, 0, 0, canvasWidth, canvasHeight);
      if(faceObj!=null){
        ctx.save();
        ctx.beginPath();
        const circleX = 375, circleY = 123, circleRadius = 68
        ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(faceObj.path, circleX - circleRadius, circleY - circleRadius, circleRadius * 2, circleRadius * 2);
        ctx.restore();
      }
      ctx.setTextAlign('center')
      setContextTextStyle(ctx, 'bold 20px 微软雅黑', '#ffffff', 30)
      ctx.fillText('To:   ' + uName, 375, 262)
      setContextTextStyle(ctx, 'italic normal 30px 微软雅黑', 'black', 30)
      ctx.fillText(cutText(danmu, constConfig.MAX_UNAME), 292.5, 710)
      setContextTextStyle(ctx, 'normal bold 30px 微软雅黑', 'grey', 30)
      ctx.fillText(vId + ':' + cutText(vName, constConfig.MAX_VNAME), 375, 790)
      let longText = '还记得你在视频<' + cutText(vName, constConfig.MAX_TEXT) + '>中发的弹幕“' + cutText(danmu, constConfig.MAX_TEXT) + '”吗?'
      let multiLen = parseInt(longText.length / 3);
      let multitext = [longText.slice(0, multiLen), longText.slice(multiLen, multiLen * 2), longText.slice(multiLen * 2)]
      setContextTextStyle(ctx, 'normal normal 30px 微软雅黑', 'grey', 30)
      ctx.fillText(multitext[0], 375, 875)
      ctx.fillText(multitext[1], 375, 905)
      ctx.fillText(multitext[2], 375, 935)
      ctx.drawImage(ziUrl, 183, 459, 400, 200);
      ctx.draw(false, function () {
        saveCanvasTmp(that);
        resolve("success")
      });
        
    })
    
  },
  inputButtonSubmitHandler:function(){
    //点击生成按钮后后
    //1 校验输入完整
    //2 校验视频存在
    //3 校验弹幕，弹出选择框
    //
    //4 弹幕列表选择确认
    //4-2 获得视频名
    //5 若开启增强，则检索弹幕用户，
    //6 若开启增强，获得用户信息
    //7 进行新页canvas生成报表
    var address = this.data.vAddress;
    var danmu = this.data.danmuValue;
    var that = this;
    //1
    if (address == "" || danmu == "") {
      errorInputs(that, "链接和弹幕都得输入哦",false,false)
    }
    else {
      this.setData({ inputButtonDisable:true})
      showLoading("搜索中")
      .then(()=>{
        return that.checkVedio(address,that.data.vP-1)
      })
      .then((cid)=>{
        return that.checkComment(cid,danmu)
      })
      .then((danmu_uid_dict)=>{
        return that.chooseDanmu(danmu_uid_dict)
      })
      .then(() => {
        wx.hideLoading()
        that.setData({ inputButtonDisable: false })
      })
      .catch((err)=>{
        that.setData({ inputButtonDisable: false })
        console.log(err)
        wx.hideLoading()
      })
    }
  },
  danmuConfirmHandler:function(e){
    //判断点击的按钮
    this.setData({ danmuConfirmDialog: false })
    if(e.detail.index==1){
      let damuValue = this.data.radioChooseValue;
      let addressValue = this.data.vAddress
      let cid = this.data.cid;
      let danmu_dict = this.data.danmuUidDict;
      let uid = danmu_dict[damuValue];
      this.noticeCloseHandler();
      var that  = this;
      this.setData({ inputButtonDisable: true })
      showLoading("破解中")
      .then(()=>{
        return that.getVideoName(addressValue,cid)
      })
      .then((name)=>{
        that.recordRequest(addressValue,name, cid, damuValue, uid)
        that.setData({avName:name});
      })
      .then(()=>{
        //判断增强
        if (this.data.forceChecked) {
          
          that.findUid(uid)
          .then((id) => {
            return that.getUserInfoById(id)
          })
          .then(([uName, faceImgUrl]) => {
            getImageInfo(faceImgUrl)
            .then((faceObj)=>{
              that.setData({ imageVisible:true})
              return that.draw(uName, damuValue, addressValue, that.data.avName, faceObj)
            })
          })
          .then(()=>{
            that.setData({ inputButtonDisable: false })
            wx.hideLoading()
          })
          .catch((err) => {
            that.setData({ imageVisible: false, inputButtonDisable: false })
            wx.hideLoading()
          })
        }
        else {
          that.setData({ imageVisible: true })
          that.draw(constConfig.UNAME_DEAFAULT, damuValue, addressValue, that.data.avName, null)
          .then(() => {
            that.setData({ inputButtonDisable: false })
            wx.hideLoading()
          })
        }
      })
      .catch(err=>{
        that.setData({ imageVisible: false, inputButtonDisable: false })
        console.log(err)
        wx.hideLoading()
      })
    }
    else{
      //取消弹幕选择
      errorInputs(this,"那就不选了吧~",false,false)
    }
    
  }
})
function errorInputs(that,msg,address_clear=true,danmu_clear=true) {
  that.setData({errorMsg: msg});
  if (address_clear) { that.setData({ addressValue: "" }); noticeAddressController(that,true)}
  if (danmu_clear) { that.setData({ danmuValue: "" }); noticeDanmuController(that,true)}
}
//flag == true 时打开提醒
function noticeAddressController(that,flag){
  var imgSrc = (flag == false) ? imgConfig.NOTICE_DEACTIVATE : imgConfig.NOTICE_ACTIVATE;
  var color = (flag == false) ? constConfig.GREY_COLOR:constConfig.THEME_COLOR;
  that.setData({
    addressNoticeColor: color,
    addressNoticeImgSrc: imgSrc,
  })
}
function noticeDanmuController(that, flag) {
  var imgSrc = (flag == false) ? imgConfig.NOTICE_DEACTIVATE : imgConfig.NOTICE_ACTIVATE;
  var color = (flag == false) ? constConfig.GREY_COLOR : constConfig.THEME_COLOR;
  that.setData({
    danmuNoticeColor: color,
    danmuNoticeImgSrc: imgSrc,
  })
}
//canvas
function getImageInfo(url) {
  url = "https"+url.slice(4)
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: url,
      success: resolve,
      fail: reject,
    })
  })
}
function cutText(text, maxLen) {
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text
}

function getSysInfo() {
  return new Promise((resolve, reject) => {
    wx.getSystemInfo({
      success(res) {
        resolve([res.windowWidth, res.windowHeight])
      }

    })
  })

}
function setContextTextStyle(ctx, style, color, fontSize) {
  ctx.font = style
  ctx.setFontSize(fontSize)
  ctx.setFillStyle(color)
}
function canvasInit(that){
  return new Promise((resolve,reject)=>{
    getSysInfo()
      .then(([sysWidth, sysHeight]) => {
        let minCanvasWidth = sysWidth * 0.9
        let minCanvasHeight = sysHeight * 0.8
        var viewWidth, viewHeight
        if (minCanvasWidth / minCanvasHeight > 0.6) {
          viewWidth = minCanvasHeight * 0.6
          viewHeight = minCanvasHeight
        }
        else {
          viewWidth = minCanvasWidth
          viewHeight = minCanvasWidth / 0.6
        }
        var canvasWidth = 750;
        var canvasHeight = 1250;
        var ratio = viewWidth / canvasWidth;
        that.setData({
          viewWidth: viewWidth,
          viewHeight: viewHeight,
          canvasWidth: canvasWidth,
          canvasHeight: canvasHeight,
          ratio: ratio
        })
        resolve()
      })
  })
  
}
function saveCanvasTmp(that) {
  wx.canvasToTempFilePath({
    //保存时不要指定x y否则会有bug
    canvasId: 'share',
    success: function (res) {
      that.setData({
        "canvasImgPath": res.tempFilePath,
      });
      console.log("draw_image: success")
    },
    fail: function () {
      wx.showToast({
        title: '网络错误',
        image: '/image/error.png',
        mask: true,
      })
      console.log("draw_image: fail");
    }
  }, this)
}
function generateRandom(min,max,except=false,exceptNum = 0){
  var randomNum = parseInt(Math.random() * (max - min + 1) + min, 10)
  if(except==true){
    while(randomNum==exceptNum){
      randomNum = parseInt(Math.random() * (max - min + 1) + min, 10)
    }
  }
  return randomNum
}
function saveImage (that) {
  wx.saveImageToPhotosAlbum({
    filePath: that.data.canvasImgPath,
    success: function () {
      wx.showToast({
        title: '保存成功',
        duration: 2000,
      })
      console.log("saveImage: success");
    },
  })
}
function showLoading(msg){
  return new Promise((resolve,reject)=>{
    wx.showLoading({
      title: msg,
    })
    resolve()
  })
}