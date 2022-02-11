import { createClient, segment } from "oicq";
import { stdin } from "process";
import * as https from "https";
import * as process from "child_process";
import { existsSync } from "fs"

let qq = 123456 // replace this to your bot qq id
let bot = createClient(qq)
let master = 123456 // replace this to your own qq id
let storePath = "/home/syize/Downloads/setu/" // replace this to your own image store path
// 不知道这个是干什么的
bot.on("system.login.slider", (data) => {
    stdin.once("data", (input) => {
        bot.sliderLogin(input.toString());
    })
})

bot.on("system.online", ()=>{
    console.log("Logged in!")
})

// 下载、发送图片的函数
// remember to change download path to your own path
function DownloadPicPublic(url: string, image_name, callback, user_id) {
    // if image already exists, pass download
    if (existsSync(storePath + image_name)) {
        console.log("[INFO] image exists")
        callback.sendGroupMsg(user_id, segment.image(storePath + image_name, true, 15))
        return
    }
    process.exec("proxychains4 -q wget " + url + " -P " + storePath, (error, stdout, stderr)=>{
        if (error !== null){
            callback.sendGroupMsg(user_id, '获取图片失败')
        }else{
            callback.sendGroupMsg(user_id, segment.image(storePath + image_name, true, 15))
        }
    })
}

// 群消息监听器
// 真的垃圾，完全跑不动
bot.on('message.group', (data)=>{
    if(/好康/.test(data.raw_message)){
        let chunk = []
        let url = ""
        // let url = 'https://api.lolicon.app/setu/v2?r18=1'
        let p = data.raw_message.match("好康的+(.+)")
        if (p) {
            url = 'https://api.lolicon.app/setu/v2?size=regular&keyword=' + p[1]
        }else{
            url = 'https://api.lolicon.app/setu/v2?size=regular'
        }
        // let url = 'http://127.0.0.1:40000/'
        try {
            https.get(url, (res) => {
                console.log('get')
                res.setTimeout(30, ()=>{
                    console.log('Timeout')
                })
                if (res.statusCode === 200) {
                    res.on('data', (json_data)=>{            
                        chunk.push(json_data)
                    })
                    res.on('end', ()=>{
                        let json_data = Buffer.concat(chunk).toString()
                        let parseData = JSON.parse(json_data)
                        // console.log('JSON:')
                        // console.log(parseData)
                        try {
                            if (parseData.error == '') {
                                let msg_text = ''
                                msg_text += "标题: " + parseData.data[0].title + "\n"
                                msg_text += "作者: " + parseData.data[0].author + "\n"
                                msg_text += "PID: " + parseData.data[0].pid
                                // must use proxy to get pic
                                // console.log(parseData.data[0].urls.regular)
                                bot.sendGroupMsg(data.group_id, msg_text)
                                DownloadPicPublic(
                                    parseData.data[0].urls.regular,
                                    parseData.data[0].pid + "_p0_master1200.jpg",
                                    bot, data.group_id
                                )
                            }else{
                                console.log('read response data error')
                            }
                        }catch(e){
                            console.error(e.message)
                        }
                    }
                )}else{
                    bot.sendGroupMsg(data.user_id, '获取图片失败')
                }
            }).on('error', (e)=>{
                bot.sendGroupMsg(data.user_id, e.message)
            })
        }catch(e){
            bot.sendGroupMsg(data.user_id, '获取图片失败')
        }
    }else{
        bot.sendGroupMsg(data.user_id, 'test')
    }
})

bot.on("request.group.invite", (data) => {
    bot.setGroupAddRequest(data.flag, true, "发送: 好康\n获取好康的", false)
    bot.sendPrivateMsg(master, "同意加群邀请: \n群: " + data.group_id + " " + data.group_name + "\n邀请人: " + data.nickname + " " + data.user_id)
})

bot.on("notice.group.decrease", (data) => {
    bot.sendPrivateMsg(master, "群减少: " + data.group_id)
})

bot.on("system.login.qrcode", function (e) {
    stdin.once("data", ()=>{
        this.login()
    })
}).login()