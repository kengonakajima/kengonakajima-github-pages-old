enchant();
function rand(num){ return Math.random() * num };
function range(a,b) { return a + rand(b-a); }
function irange(a,b) { return Math.floor(a + rand(b-a) ); }

var scrw = 640;
var scrh = 480;

var game;

// イベントキュー
function Queue() { this.__a = new Array();}
Queue.prototype.enqueue = function(o) { this.__a.push(o); }
Queue.prototype.dequeue = function() {
	if( this.__a.length > 0 ) { 	return this.__a.shift(); }
	return null;
}
Queue.prototype.peek = function(ind) { return this.__a[ind]; }
Queue.prototype.size = function() { 	return this.__a.length; } 


var queue = new Queue();

var pc_speed = 200;

function DelayedEvent( name, fire_at ) {
    var e = {}
    e.name = name;
    e.fire_at = fire_at;
    return e;
}

function checkGetCrystal( x, y, is_local ) {
    for(var i=0;i<game.mobs.length;i++){
        var c = game.mobs[i];
        if( c && c.x >= x - c.hitsize && c.x <= x + 8 + c.hitsize &&
            c.y >= y - c.hitsize && c.y <= y + 16 + c.hitsize ) {
            
            if( c.bonus > 0 ) {
                game.score += c.bonus;
                c.playBonusSound();
                game.mobs[i] = null;
                c.parentNode.removeChild(c);
            } else {
                var hit_bomb = false;
                if( is_local ) hit_bomb = true; else if( game.remote_bomb_hit ) hit_bomb = true;
                if( hit_bomb ) {
                    game.assets['explode.wav'].play();                
                    game.score = 0;
                    game.mobs[i] = null;
                    c.parentNode.removeChild(c);
                }
             }
            $("#score").text("SCORE: " + game.score );            
            break;
        }
    }
}



window.onload = function() {
    game = new Game(scrw, scrh);

    game.preload('chara1.png', 'map0.png', "deck.png");
    game.preload("get1.wav", "get2.wav", "explode.wav" );

    game.mobs = new Array(200);
    
    game.setFPS = function(fps) {
        game.fps = fps;
        game.dt = 1.0 / fps; // TODO: 実測せよ
    }
    game.setMinDelay = function(d) {        game.delay_min = d;  }
    game.setMinDelay(0);
    game.setSpikeDelay = function(d) {        game.delay_spike = d; }
    game.setSpikeDelay(0);
    game.setGhost = function(flg) {  game.show_ghost = flg; }
    game.setGhost(true);
    game.setShowPC = function(flg) {  game.show_pc = flg; }
    game.setShowPC(true);    
    game.setLocalHit = function(flg) { game.local_hit = flg; }
    game.setLocalHit(false);
    game.setRemoteBombHit = function(flg) { game.remote_bomb_hit = flg; }
    game.setRemoteBombHit(true);
    game.setAutoSync = function(flg) { game.auto_sync = flg; }
    game.setAutoSync(true);
    game.setFPS(60);

    game.gravity = 50;
    game.accum_time = 0;
    game.rootScene.backgroundColor = '#888';

    game.score = 0;

    game.spike_at = 0;
    
    var Bear = enchant.Class.create(enchant.Sprite, {
        initialize: function(x, y) {
            enchant.Sprite.call(this, 32, 32);
            this.x = x;
            this.y = y;
            this.image = game.assets['chara1.png'];
            this.frame = 5;
            game.rootScene.addChild(this);
        }
    });
    var Arrow = enchant.Class.create( enchant.Sprite, {
        initialize: function(x,y,is_right) {
            enchant.Sprite.call(this,16,16);
            this.x = x;
            this.y = y;
            this.scale(4,4);
            this.image = game.assets["deck.png"];
            if( is_right ) this.frame = 71; else this.frame = 72;
            game.rootScene.addChild(this);
        }
    });


    var PC = enchant.Class.create( Bear, {
        initialize: function(x,y) {
            Bear.call(this,x,y);
            this.goalX = null;
            this.vx = 0;
            this.setVX = function(vx) { this.vx = vx; }
            this.setGoalX = function(x) { this.goalX = x; }
            this.addEventListener('enterframe', function() {
                var prevx = this.x;
                this.x += this.vx * game.dt;
                if( this.x < 0 ) this.x = 0;
                if( this.x > scrw-32 ) this.x = scrw-32;
                if( this.goalX != null ) {
                    if( (prevx < this.goalX && this.x >= this.goalX ) ||
                        (prevx > this.goalX && this.x <= this.goalX ) ) {
                        this.vx = 0;
                        this.x = this.goalX;
                        this.goalX = null;
                    } else if( this.x < this.goalX ) {
                        this.vx = pc_speed;
                    } else if( this.x > this.goalX ) {
                        this.vx = -pc_speed;
                    }
                }
            });
        }
    });

    var Ghost = enchant.Class.create( PC, {
        initialize: function(x,y) {
            PC.call(this,x,y);
            this.opacity = 0.2;

            this.addEventListener('enterframe', function() {
                checkGetCrystal( this.x, this.y, false );
            });
        }
    });
    
    

    var Crystal  = enchant.Class.create( enchant.Sprite, {
        initialize: function() {
            enchant.Sprite.call(this,16,16);            
            this.vy = range(-100,-5);
            this.y = rand(scrh/2,scrh);
            this.vx = range(40,200);                            
            if( (irange(0,100) % 2) == 0 ) { // right
                this.x = scrw;
                this.vx *= -1;
            } else { // left
                this.x = 0;
            }

            this.image = game.assets["deck.png"];
            this.frame = irange(64,66+1);

            
            this.bonus = 1;
            this.hitsize = 16;
            if( irange(0,100)%5==0) {
                this.scale(2,2);
                this.bonus *= 20;
                this.hitsize = 32;
            } else if( irange(0,100)%3 == 0  ) { // 爆弾 bomb
                this.scale(2,2);
                this.hitsize = 16; // 小さめ
                this.bonus = -1;
                this.frame = 16+9;
            }
            this.playBonusSound = function() {
                if( this.bonus == 1 ) {
                    game.assets['get1.wav'].play();
                } else {
                    game.assets['get2.wav'].play();
                }
            }
            this.addEventListener( 'enterframe', function() {
                this.x += this.vx * game.dt;
                this.y += this.vy * game.dt;
                this.vy += game.gravity * game.dt;
                if( this.y > scrh ) {
                    for(var i=0;i<game.mobs.length;i++){
                        if( game.mobs[i] == this ) {
                            game.mobs[i] = null;
                            break;
                        }
                    }
                    this.parentNode.removeChild(this);
                }
            });
            for(var i=0;i< game.mobs.length; i++ ) {
                if( game.mobs[i] == null ){
                    game.mobs[i] = this;
                    break;
                }
            }
            game.rootScene.addChild(this);            
        }
        
    });



    game.clickAt = function(x) {
        var e = DelayedEvent( "goal", game.accum_time + game.nextDelay() );
        e.x = x;
        queue.enqueue(e);
        game.pc.setGoalX(x-16);
    }

    game.nextDelay = function() {
        var d = game.delay_min;
        if( game.accum_time > game.spike_at ) {
            d += game.delay_spike;
            game.spike_at = game.accum_time + range(0.5,3);
        }
        return d * 2; // Round Tripなので2倍
    }
    
    game.onload = function() {
        game.pc = new PC( scrw/2, scrh-64 );
        game.ghost = new Ghost( scrw/2, scrh-64 );
        game.last_crystal = 0;

        // pad..
        var left_arrow = new Arrow( 0,scrh-64, false );
        left_arrow.opacity = 0;
        var right_arrow = new Arrow( 0,scrh-64, true );
        right_arrow.opacity = 0;        
        
        //
        game.rootScene.addEventListener('enterframe', function() {
            game.accum_time += game.dt;
            
            var k = game.input.up;
            if(game.accum_time > game.last_crystal + 0.15 ){
                game.last_crystal = game.accum_time;
                new Crystal();
            }

            
            var delay = game.nextDelay();

            if( game.input.right ) {
                queue.enqueue( DelayedEvent( "right", game.accum_time + delay ) );
                game.pc.setVX(pc_speed);
            } else if( game.input.left) {
                queue.enqueue( DelayedEvent( "left", game.accum_time + delay ) );
                game.pc.setVX(-pc_speed);                
            } else {
                if( game.pc.vx != 0 && game.pc.goalX == null ) {
                    queue.enqueue( DelayedEvent( "stop", game.accum_time + delay ) );
                    game.pc.setVX(0);
                }
            }
            if( game.input.right ) right_arrow.opacity = 1; else right_arrow.opacity = 0;
            if( game.input.left ) left_arrow.opacity = 1; else left_arrow.opacity = 0;
            var maxcharx = game.pc.x;
            if( game.ghost.x > maxcharx ) maxcharx = game.ghost.x;
            var mincharx = game.pc.x;
            if( game.ghost.x < mincharx ) mincharx = game.ghost.x;
            right_arrow.x = maxcharx + 150;
            left_arrow.x = mincharx - 150;



            // イベント消化
            var top = queue.peek(0);
            if( top != null && game.accum_time >= top.fire_at ) {
                queue.dequeue();
                if(top.name == "right") {
                    game.ghost.setVX(pc_speed);                    
                } else if( top.name == "left" ) {
                    game.ghost.setVX(-pc_speed);
                } else if( top.name == "stop" ) {
                    game.ghost.setVX(0);
                } else if( top.name == "goal" ) {
                    console.log("recv goal x:", top.x );
                    game.ghost.setGoalX( top.x - 16 );
                } else if( top.name == "direct" ) {
                    game.ghost.x = top.x;
                }
            }

            if( game.show_ghost ) {
                game.ghost.opacity = 0.2;
            } else {
                game.ghost.opacity = 0;
            }
            if( game.show_pc ) {
                game.pc.opacity = 1;
            } else {
                game.pc.opacity = 0;
            }

            // ローカルヒット
            if( game.local_hit ) {
                checkGetCrystal( game.pc.x, game.pc.y, true );
            }

            if( game.auto_sync ) {
                if( game.last_auto_sync_at == null ||
                    game.last_auto_sync_at < game.accum_time - 1 ) {
                    game.last_auto_sync_at = game.accum_time;
                    var e = DelayedEvent( "direct", game.accum_time + game.nextDelay() );
                    e.x = game.pc.x;
                    queue.enqueue(e);
                }
            }
        });
    };

    game.start();
};


