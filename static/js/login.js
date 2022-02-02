var loginUsername = "";
var loginCode = "";

function changeUsername(id){
    loginUsername = document.getElementById(id).value;
}
function changeCode(id){
    loginCode = document.getElementById(id).value;
}

function join(){
    const _ = async () => {
        var res = await fetch(`/join?username=${loginUsername}&code=${loginCode}`);
        var rtn = await res.json();
        if(rtn.success){
            window.location.href = `/?username=${loginUsername}`
        }else{
            document.getElementById("message").innerHTML = `<div style="color: red">${rtn.msg}</div>`
        }
    }
    _();
}