var colorList = ["#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff"];
let colorIndex = 0;
setInterval(() => {
    colorIndex = (colorIndex + 1) % colorList.length;
    document.getElementById("title").innerHTML = `<h1 style="color: ${colorList[colorIndex]};">惠东德克萨斯扑克王者争霸赛</h1>`
}, 500);

async function get(url) {
    var res = await fetch(url);
    var rtn = await res.json();
    console.log(url, rtn);
    if( ! rtn.success){
        document.getElementById("message").innerHTML = `<div>提示消息：<span style="color: red">${rtn.msg}</span></div>`;
    }
    return rtn;
}

var lastCards = [];
var playerCache = [];
var myCardCache = [];

let cw = 60;
let ch = 80;

const ts = (p) => {
    var s = "";
    for (let player of p) {
        s += player.card + player.name + player.credit + player.balance + player.current_bet + player.is_discard;
    }
    return s;
}

const isCardEqual = (c, d) => {
    var s1 = "";
    for (let card of c) {
        s1 += card;
    }
    var s2 = "";
    for (let card of d) {
        s2 += card;
    }
    console.log(s1, s2);
    return s1 === s2;
}

const isEqual = (p1, p2) => {
    return ts(p1) === ts(p2);
}

// refresh
setInterval(async () => {
    try {
        document.getElementById("status-info").innerHTML = `<h3>网络状态：<span style="color: green;">正常连接</span></h3>`;

        // cards
        var cards = (await get("/showing_card")).card;
        if ( ! isCardEqual(cards, lastCards)) {
            lastCards = cards;
            var cardHtml = "";
            let cnt = 0;
            for (let card of cards) {
                cnt += 1;
                cardHtml += `<div style="margin: 20px;"><img src="/static/img/${card}.jpg" style="width: ${cw}px; height: ${ch}px"/></div>`
            }
            for (; cnt < 5; ++cnt) {
                cardHtml += `<div style="width: ${cw}px; height: ${ch}px; background-color: black; margin: 20px;"></div>`;
            }
            document.getElementById("showing-card").innerHTML = `<div style="display:flex; flex-direction: row;">${cardHtml}</div>`
        }

        // player
        var players = (await get("/player_info")).players;
        console.log(playerCache.toString());
        if (!isEqual(players, playerCache)) {
            playerCache = players;

            var playerHtml = "<table><tr><th>用户名</th><th>总积分</th><th>当轮剩余筹码</th><th>手牌</th><th>当前下注</th><th>状态</th><th>操作</th><th>踢出</th></tr>";
            let index = 0;
            for (let player of players) {

                playerCardHtml = `<div style="display: flex; flex-direction: row; width: ${cw * 2 + 10}px; height: ${86}px;">`;
                if (player.card.length !== 0) {
                    for (let card of player.card) {
                        playerCardHtml += `<div style="margin:2px;"><img src="/static/img/${card}.jpg" style="width: ${cw}px; height: ${ch}px;" /></div>`;
                    }
                } else {
                    playerCardHtml += `<div style="width: ${cw}px; height: ${ch}px; background-color: black; margin:2px;"></div><div style="width: ${cw}px; height: ${ch}px; background-color: black; margin:2px;"></div>`;
                }


                playerHtml += `<tr><td>${player.name}</td><td>${player.credit}</td><td>${player.balance}</td>
                <td>${playerCardHtml}</td>
                <td>${player.current_bet}</td><td>${player.is_discard ? '<span style="color: red">弃牌</span>' : ''}</td><td> <input id="player-${index}" type="checkbox" onclick="check(${index}, '${player.name}')"/></td><td><button onclick="remove('${player.name}')">踢出</button></td></tr>`

                index++;
            }
            playerHtml += "</table>";
            document.getElementById("player-info").innerHTML = `<div>${playerHtml}</div>`;
        }

        // my card
        var myCard = (await get(`/my_card?username=${username}`)).card;
        if (myCardCache.toString() !== myCard.toString()) {
            myCardCache = myCard;
            var myCardHtml = `<div style="display: flex; flex-direction: row;">`;
            for (let card of myCard) {
                myCardHtml += `<div style="margin:10px;"><img src="/static/img/${card}.jpg" style="width: ${cw}px; height: ${ch}px;" /></div>`;
            }
            document.getElementById("my-card").innerHTML = myCardHtml + "</div>";
        }


    } catch (e) {
        console.log(e)
        document.getElementById("status-info").innerHTML = `<h3 style="color: red;">您的网络连接出现异常</h3>`;
    }

    var ping = await get(`/ping?username=${username}`);
    if (!ping.success) {
        window.location.href = "/login";
    }

    var gameState = await get('/game_state');
    document.getElementById("game-state").innerHTML = `<h3>游戏状态：${gameState.state}</h3>`


    

}, 2000);