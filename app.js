"use strict";
exports.__esModule = true;
var oicq_1 = require("oicq");
var process_1 = require("process");
var https = require("https");
var process = require("child_process");
var fs_1 = require("fs");
var qq = 123456; // replace this to your bot qq id
var bot = (0, oicq_1.createClient)(qq);
var master = 123456; // replace this to your own qq id
var storePath = "/home/syize/Downloads/setu"; // replace this to your own image store path
// 不知道这个是干什么的
bot.on("system.login.slider", function (data) {
    process_1.stdin.once("data", function (input) {
        bot.sliderLogin(input.toString());
    });
});
bot.on("system.online", function () {
    console.log("Logged in!");
});
// 下载、发送图片的函数
// remember to change download path to your own path
function DownloadPicPublic(url, image_name, callback, user_id) {
    // if image already exists, pass download
    if ((0, fs_1.existsSync)(storePath + image_name)) {
        console.log("[INFO] image exists");
        callback.sendGroupMsg(user_id, oicq_1.segment.image(storePath + image_name, true, 15));
        return;
    }
    process.exec("proxychains4 -q wget " + url + " -P " + storePath, function (error, stdout, stderr) {
        if (error !== null) {
            callback.sendGroupMsg(user_id, '获取图片失败');
        }
        else {
            callback.sendGroupMsg(user_id, oicq_1.segment.image(storePath + image_name, true, 15));
        }
    });
}
// 群消息监听器
// 真的垃圾，完全跑不动
bot.on('message.group', function (data) {
    if (/好康/.test(data.raw_message)) {
        var chunk_1 = [];
        var url = "";
        // let url = 'https://api.lolicon.app/setu/v2?r18=1'
        var p = data.raw_message.match("好康的+(.+)");
        if (p) {
            url = 'https://api.lolicon.app/setu/v2?size=regular&keyword=' + p[1];
        }
        else {
            url = 'https://api.lolicon.app/setu/v2?size=regular';
        }
        // let url = 'http://127.0.0.1:40000/'
        try {
            https.get(url, function (res) {
                console.log('get');
                res.setTimeout(30, function () {
                    console.log('Timeout');
                });
                if (res.statusCode === 200) {
                    res.on('data', function (json_data) {
                        chunk_1.push(json_data);
                    });
                    res.on('end', function () {
                        var json_data = Buffer.concat(chunk_1).toString();
                        var parseData = JSON.parse(json_data);
                        console.log('JSON:');
                        console.log(parseData);
                        try {
                            if (parseData.error == '') {
                                var msg_text = '';
                                msg_text += "标题: " + parseData.data[0].title + "\n";
                                msg_text += "作者: " + parseData.data[0].author + "\n";
                                msg_text += "PID: " + parseData.data[0].pid;
                                // must use proxy to get pic
                                console.log(parseData.data[0].urls.regular);
                                bot.sendGroupMsg(data.group_id, msg_text);
                                DownloadPicPublic(parseData.data[0].urls.regular, parseData.data[0].pid + "_p0_master1200.jpg", bot, data.group_id);
                            }
                            else {
                                console.log('read response data error');
                            }
                        }
                        catch (e) {
                            console.error(e.message);
                        }
                    });
                }
                else {
                    bot.sendGroupMsg(data.user_id, '获取图片失败');
                }
            }).on('error', function (e) {
                bot.sendGroupMsg(data.user_id, e.message);
            });
        }
        catch (e) {
            bot.sendGroupMsg(data.user_id, '获取图片失败');
        }
    }
    else {
        bot.sendGroupMsg(data.user_id, 'test');
    }
});
bot.on("request.group.invite", function (data) {
    bot.setGroupAddRequest(data.flag, true, "发送: 好康\n获取好康的", false);
    bot.sendPrivateMsg(master, "同意加群邀请: \n群: " + data.group_id + " " + data.group_name + "\n邀请人: " + data.nickname + " " + data.user_id);
});
bot.on("notice.group.decrease", function (data) {
    bot.sendPrivateMsg(master, "群减少: " + data.group_id);
});
bot.on("system.login.qrcode", function (e) {
    var _this = this;
    process_1.stdin.once("data", function () {
        _this.login();
    });
}).login();
