// get url params
var rawParam = window.location.search.substring(1).split("&");
var param = {};
for(let row of rawParam){
    let arr = row.split("=");
    param[arr[0]] = arr[1];
}
var username = param["username"];

if( ! username){
    window.location.href = "/login.html"
}

async function get(url) {
    var res = await fetch(url);
    return await res.json();
}

var currentAdd = 0;

function clearCurrent(){
    currentAdd = 0;
    document.getElementById("current-add").value = currentAdd;
}

function add(bet){
    currentAdd += bet;
    document.getElementById("current-add").value = currentAdd;
}


var checkList = [];

function check(index, name){
    var checked = document.getElementById("player-" + index).checked;
    
    if(checked){
        var inList = false;
        for(let cname of checkList){
            if(cname === name){
                inList = true;
            }
        }
        if( ! inList){
            checkList.push(name);
        }
    }else{
        var newList = [];
        for(let cname of checkList){
            if(cname !== name){
                newList.push(cname);
            }
        }
        checkList = newList;
    }

    document.getElementById("selected-player").innerHTML = `<h5>已选中赢家：${checkList.toString()}</h5>`
}

async function confirmCurrent(){
    await get(`/add_bet?username=${username}&add=${currentAdd}`)
    currentAdd = 0;
    document.getElementById("current-add").value = currentAdd;
}

async function discard(){
    await get(`/discard?username=${username}`)
}

async function show(){
    await get(`/show?username=${username}`)
}

async function start(){
    await get(`/start`)
}

async function end(){
    checkList = [];
    document.getElementById("selected-player").innerHTML = `<h5>已选中赢家：${checkList.toString()}</h5>`
    await get(`/end?winner=${checkList.toString()}`);
}

async function next(){
    await get(`/next`);
}

async function reset(){
    await get("/reset")
}

async function remove(username){
    await get(`/remove?username=${username}`)
}