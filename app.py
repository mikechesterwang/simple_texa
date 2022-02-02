import random
from flask import request, redirect, Flask, render_template
import time
app = Flask(__name__)
         
card_group = ["spade", "plum", "square", "heart"]
card_number = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "K", "Q"]
cards = []
for g in card_group:
    for n in card_number:
        cards.append(g + "_" + n)
        
def new_card():
    rtn = []
    for card in cards:
        rtn.append(card)
    return rtn

class Player:
    def __init__(self, name):
        self.name = name
        self.card = []
        self.credit = 0
        self.balance = 2720
        self.current_bet = 0
        self.is_discard = False
        self.show_card = False
        self.last_ping = time.time()
        
    def win(self, money):
        self.balance += (self.current_bet + money)
        self.current_bet = 0
    
    def lose(self):
        self.current_bet = 0
    
    def add_bet(self, addition):
        self.current_bet += addition
        self.balance -= addition
        
    def show_now(self):
        self.show_card = True
        
    def reset_state(self):
        self.is_discard = False
        self.show_card = False
    
    def discard(self):
        self.is_discard = True
    
    def reset(self):
        self.credit += (self.balance - 2720)
        self.balance = 2720

START = "进行中"
END = "结束"

class Game:
    def __init__(self):
        self.players = []
        self.showing_cards = []
        self.state = END
        self.code = "hdnb"
        self.card_pool = []
        self.hash = time.time()

    def join(self, name, code):
        print(self.hash)
        if self.state == START:
            return {"success": False, "msg": "当前正在进行中，请稍后加入"}
        if self.code != code:
            return {"success": False, "msg": "邀请码错误"}
        for player in self.players:
            if player.name == name:
                return {"success": True, "msg": "欢迎回来"} 
        self.players.append(Player(name))
        return {"success": True, "msg": "欢迎加入"}
    
    def remove_player(self, name):
        new_list = []
        for player in self.players:
            if player.name != name:
                new_list.append(player)
        self.players = new_list

    def ping(self, name):
        now = time.time()
        in_list = False
        for player in self.players:
            # if now - player.last_ping > 10:
            #     self.remove_player(player.name)
            if player.name == name:
                in_list = True
                player.last_ping = now
        if not in_list:
            return {"success": False}
        return {"success": True}
                
    def get_player(self, name):
        for player in self.players:
            if player.name == name:
                return player
        return None

    def add_bet(self, name, addition):
        addition = int(addition)
        p = self.get_player(name)
        if p.balance < addition:
            return {"success": False, "msg": "当前筹码不足"}
        p.add_bet(addition)
        return {"success": True, "msg": "加注成功"}
    
    def _pop_card(self):
        n = random.randint(0, len(self.card_pool) - 1)
        card = self.card_pool[n]
        self.card_pool.remove(card)
        return card
    
    def start(self):
        self.card_pool = new_card()
        self.state = START
        for p in self.players:
            p.reset_state()
            c1 = self._pop_card()
            c2 = self._pop_card()
            p.card = [c1, c2]
        self.showing_cards = []
        
    def next_card(self):
        if len(self.showing_cards) == 0:
            c1 = self._pop_card()
            c2 = self._pop_card()
            c3 = self._pop_card()
            self.showing_cards = [c1, c2, c3]
        elif len(self.showing_cards) < 5:
            self.showing_cards.append(self._pop_card())
            
    def reset(self):
        for p in self.players:
            p.reset()

class ChatRoom:
    def __init__(self):
        self.last_message = ""
        self.message_cache = []
        self.cnt = 0
    
    def _add_message(self, content):
        self.cnt += 1
    
    def send(self, content):
        pass
        
    
game = Game()

@app.route('/')
def index():
    name = request.args.get("username")
    if name is None:
        return redirect("/login")
    return render_template('index.html')

@app.route("/login")
def login():
    print("?")
    return render_template('login.html')

@app.route("/showing_card")
def showing_card():
    return {"success": True, "card": game.showing_cards}

@app.route("/my_card")
def my_card():
    name = request.args.get("username")
    p = game.get_player(name)
    if p is None:
        return {"success": False}
    return {"success": True, "card": p.card}

@app.route("/player_info")
def player_info():
    rtn = []
    for player in game.players:
        rtn.append({
            "card": player.card if player.show_card else [],
            "name": player.name,
            "credit": player.credit,
            "current_bet": player.current_bet,
            "balance": player.balance,
            "is_discard": player.is_discard
        })
    return {"success": True, "players": rtn}

@app.route("/join")
def join():
    username = request.args.get("username")
    code = request.args.get("code")
    return game.join(username, code)

@app.route("/ping")
def ping():
    username = request.args.get("username")
    return game.ping(username)

@app.route("/discard")
def discard():
    username = request.args.get("username")
    game.get_player(username).discard()
    return {"success": True}

@app.route("/show")
def show():
    username = request.args.get("username")
    game.get_player(username).show_now()
    return {"success": True}

@app.route("/add_bet")
def add_bet():
    username = request.args.get("username")
    add = request.args.get("add")
    return game.add_bet(username, add)

@app.route("/start")
def start():
    game.start()
    return {"success": True}

@app.route("/next")
def next():
    game.next_card()
    return {"success": True}

@app.route("/end")
def end():
    winnerRaw = request.args.get("winner")
    ps = winnerRaw.split(",")
    if len(ps) == 0 or winnerRaw == '':
        return {"success": False, "msg": "必须选择至少一个赢家"}
    
    pool_balance = 0
    for p in game.players:
        is_winner = False
        for name in ps:
            if p.name == name:
                is_winner = True
                break
        if not is_winner:
            pool_balance += p.current_bet
            p.lose()

    for name in ps:
        p = game.get_player(name)
        p.win(pool_balance / len(ps))
    game.state = END
    print(game.hash)
    return {"success": True}

@app.route("/reset")
def reset():
    game.reset()
    return {"success": True}

@app.route("/game_state")
def game_state():
    return {"success": True, "state": game.state}