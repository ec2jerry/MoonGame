/** 仙劍翻牌遊戲
 * Date: 2013-02-24
 * Author: fdipzone
 * Ver 1.0
 */
window.onload = function() {
    var gameimg = [
        'images/start.png',
        'images/success.png',
        'images/fail.png',
        'images/clear.png',
        'images/cardbg.jpg',
        'images/sword.png'
    ];

    for (var i = 1; i <= card.get_total(); i++) {
        gameimg.push('images/card' + i + '.jpg');
    }

    var callback = function() {
        card.init();
    }

    img_preload(gameimg, callback);
}


/** card class */
var card = (function(total, cardnum) {

    var gametime = [0, 99999]; // 每關的遊戲時間
    var turntime = 8; // 觀看牌時間
    var level = 1; // 當前關卡
    var carddata = []; // 記錄牌的數據
    var leveldata = []; // 當前關卡牌數據
    var is_lock = 0; // 是否鎖定
    var is_over = 0; // 遊戲結束
    var first = -1; // 第一次翻開的卡
    var matchnum = 0; // 配對成功次數


    // 初始化
    init = function() {
        tips('show');
        $('startgame').onclick = function() {
            tips('hide');
            start();
        }
    }


    // 開始遊戲
    start = function() {
        reset();
        create(cardnum);
        show();

        var curtime = turntime;

        setHtml('livetime', curtime);

        var et = setInterval(function() {
            if (curtime == 0) {
                clearInterval(et);
                turnall();
                set_event();
                message('start', process);
                return;
            }

            if (curtime == turntime) {
                turnall();
            }

            curtime--;
            setHtml('livetime', curtime);
        }, 1000)
    }


    // 隨機抽取N張牌
    create = function(n) {
        carddata = [];
        leveldata = [];

        // 創建所有牌
        for (var i = 1; i <= total; i++) {
            carddata.push(i);
        }

        // 抽取牌
        for (var i = 0; i < n; i++) {
            var curcard = carddata.splice(Math.random() * carddata.length, 1).pop();
            leveldata.push({ 'cardno': curcard, 'turn': 0 }, { 'cardno': curcard, 'turn': 0 });
        }

        // 生成隨機順序遊戲牌
        leveldata = shuffle(leveldata);
    }


    // 生成牌
    show = function() {
        var cardhtml = '';
        for (var i = 0; i < leveldata.length; i++) {
            cardhtml += '<div class="cardplane">';
            cardhtml += '<div class="card viewport-flip" id="card' + i + '">';
            cardhtml += '<div class="list flip out"><img src="images/card' + leveldata[i]['cardno'] + '.jpg"></div>';
            cardhtml += '<div class="list flip"><img src="images/cardbg.jpg"></div>';
            cardhtml += '</div>';
            cardhtml += '</div>';

        }
        setHtml('gameplane', cardhtml);
    }


    // 全部翻轉
    turnall = function() {
        for (var i = 0; i < leveldata.length; i++) {
            turn_animate(i);
        }
    }


    // 翻轉動畫
    turn_animate = function(key) {
        var obj = $_tag('div', 'card' + key);
        var cardfont, cardback;

        if (getClass(obj[0]).indexOf('out') != -1) {
            cardfont = obj[0];
            cardback = obj[1];
        } else {
            cardfont = obj[1];
            cardback = obj[0];
        }

        setClass(cardback, 'list flip out');
        var et = setTimeout(function() {
            setClass(cardfont, 'list flip in');
        }, 225);
    }


    // 設置點擊事件
    set_event = function() {
        var o = $_tag('div', 'gameplane');
        for (var i = 0, count = o.length; i < count; i++) {
            if (getClass(o[i]) == 'card viewport-flip') {
                o[i].onclick = function() {
                    turn(this.id);
                }
            }
        }
    }


    // 計時開始
    process = function() {

            is_lock = 0;

            var curtime = gametime[level];
            setHtml('livetime', curtime);

            var et = setInterval(function() {
                if (matchnum == cardnum) {
                    clearInterval(et);
                    return;
                }
                var f = curtime - 1;
                curtime = f;

                setHtml('livetime', 99999 - f);

                if (curtime == 0) {
                    clearInterval(et);
                    is_over = 1;
                    message('fail', start);
                }

            }, 1000);
        }
        // 遊戲訊息動畫
    message = function(type, callback) {

        is_lock = 1;

        var message = $('message');
        var processed = 0;
        var opacity = 0;
        var soundtime = {
            'start': 1500,
            'success': 4000,
            'fail': 6000,
            'clear': 4000
        };

        disp('message', 'show');
        setClass(message, 'message_' + type);
        setOpacity(message, opacity);
        setPosition(message, 'left', 0);
        setPosition(message, 'top', 390);

        if (type == 'start') {
            bgsound(type, true);
        } else {
            bgsound(type);
        }

        var et = setInterval(function() {
            var message_left = getPosition(message, 'left');
            processed = processed + 25;

            if (processed >= 500 && processed <= 750) {
                opacity = opacity + 10;
                setPosition(message, 'left', message_left + 30);
                setOpacity(message, opacity);
            } else if (processed >= soundtime[type] && processed <= soundtime[type] + 250) {
                opacity = opacity - 10;
                setPosition(message, 'left', message_left + 35);
                setOpacity(message, opacity);
            } else if (processed > soundtime[type] + 250) {
                disp('message', 'hide');
                clearInterval(et);
                if (typeof(callback) != 'undefined') {
                    callback();
                }
            }

        }, 25);
    }


    // 翻牌
    turn = function(id) {
        if (is_lock == 1) {
            return;
        }

        var key = parseInt(id.replace('card', ''));

        if (leveldata[key]['turn'] == 0) { // 未翻開
            if (first == -1) { // 第一次翻
                turn_animate(key);
                first = key;
                leveldata[key]['turn'] = 1;
            } else { // 第二次翻
                turn_animate(key);
                leveldata[key]['turn'] = 1;
                check_turn(key);
            }
        }

    }


    // 檢查是否翻牌成功
    check_turn = function(key) {
        is_lock = 1;

        if (leveldata[first]['cardno'] == leveldata[key]['cardno']) { // 配對成功
            matchnum++;

            if (matchnum == cardnum) {
                var et = setTimeout(function() {
                    message('success', levelup);
                }, 225);
            }

            first = -1;
            is_lock = 0;

        } else { // 配對失敗,將翻開的牌翻轉

            var et = setTimeout(function() {
                turn_animate(first);
                leveldata[first]['turn'] = 0;
                turn_animate(key);
                leveldata[key]['turn'] = 0;

                first = -1;

                if (is_over == 0) {
                    is_lock = 0;
                }

            }, 300);
        }
    }


    // 過關
    levelup = function() {
        if (level < gametime.length - 1) {
            level++;
            setHtml('level', level);
            start();
        } else {
            clear();
        }
    }


    // 全部通關
    clear = function() {
        document.location.href = "./finish.html";
        level = 1;
        disp('levelplane', 'hide');
        disp('process', 'hide');
        setHtml('gameplane', '');
        message('clear', init);

    }


    // 音樂播放
    bgsound = function(file, loop) {
        var id = 'audioplayer';

        // if(typeof(file)!='undefined'){
        // if(typeof(loop)=='undefined'){
        // loop = false;
        // }

        // var audiofile = [];
        // audiofile['mp3'] = 'music/' + file + '.mp3';
        // audiofile['ogg'] = 'music/' + file + '.ogg';
        // audioplayer(id, audiofile, loop);
        // }else{
        // audioplayer(id);
        // }
    }


    // 遊戲玩法
    tips = function(type) {
        disp('tips', type);
    }


    // 獲取牌總數
    get_total = function() {
        return total;
    }


    // 重置參數
    reset = function() {
        disp('levelplane', 'show');
        setHtml('level', level);
        disp('process', 'show');
        setHtml('livetime', '');
        setHtml('gameplane', '');
        is_lock = 1;
        is_over = 0;
        first = -1;
        matchnum = 0;
    }

    return this;

})(9, 9);