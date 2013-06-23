var assert = null;
try {
    assert = require("assert");
} catch(e){
    // in browser
}

to_i = function(s){ return parseInt(s);};
int = function(s){ return parseInt(s);};
to_f = function(s){ return parseFloat(s);};
tonumber = function(s){ return Number(s); };
to_s = function(n){ return n.toString(); };
tostring = to_s;

// logging
function argtoarray(a){ return [].slice.apply(a); }
p = function(a,b,c,d,e,f,g,h,i,j,k){
    var code = "console.log(";
    var ary = [];
    if(a || a == 0 ){ ary.push("a"); }
    if(b || b == 0 ){ ary.push("b"); }
    if(c || c == 0 ){ ary.push("c"); }
    if(d || d == 0 ){ ary.push("d"); }
    if(e || e == 0 ){ ary.push("e"); }
    if(f || f == 0 ){ ary.push("f"); }
    if(g || g == 0 ){ ary.push("g"); }
    if(h || h == 0 ){ ary.push("h"); }
    if(i || i == 0 ){ ary.push("i"); }
    if(j || j == 0 ){ ary.push("j"); }
    if(k || k == 0 ){ ary.push("k"); }
    code += ary.join(",") + ")";
    eval(code);
}
print = p;

rect = function(minx,miny,maxx,maxy) { // name from MOAI
    return { minx:minx, miny:miny, maxx:maxx, maxy:maxy}    
}

hit = function(rect1,rect2) {
    return ( rect1.minx <= rect2.maxx && rect1.miny <= rect2.maxy
             && rect1.maxx >= rect2.minx && rect1.maxy >= rect2.miny );
}
max = function(a,b){ return (a>=b) ? a : b; }
min = function(a,b){ return (a<=b) ? a : b; }

intersect = function(r1,r2) {
    if(!hit(r1,r2))return null;
    var iminx,imaxx;
    if(r1.minx<=r2.minx){
        iminx=r2.minx;
        imaxx=r1.maxx;
        if(r1.maxx>=r2.maxx){
            imaxx=r2.maxx;
        }
    } else {
        iminx=r1.minx;
        imaxx=r2.maxx;
        if(r1.maxx<=r2.maxx){
            imaxx=r1.maxx;
        }
    }
    var iminy, imaxy;
    if(r1.miny<=r2.miny){
        iminy=r2.miny;
        imaxy=r1.maxy;
        if(r1.maxy>=r2.maxy){
            imaxy=r2.maxy;
        }
    } else {
        iminy=r1.miny;
        imaxy=r2.maxy;
        if(r1.maxx<=r2.maxx){
            imaxy=r1.maxy;
        }
    }
    return rect(iminx,iminy,imaxx,imaxy);
}
area = function(r) {
    return (max(r.minx,r.maxx) - min(r.minx,r.maxx)) * (max(r.miny,r.maxy) - min(r.miny,r.maxy) );
}

// id
var _globalCounterGen = 0;
function generateNewId() {
    _globalCounterGen ++;
    return _globalCounterGen;
}

//
function len(x0,y0,x1,y1) {
    return Math.sqrt( (x0-x1)*(x0-x1) + (y0-y1)*(y0-y1) );
}
function range(a,b) {
    return a + (b-a)*Math.random();
}
function irange(a,b) {
    return int( range( a,b ) );
}

    
// timer
now = function() {
    var d = new Date();
    return d.getTime() / 1000.0;
}
nowi = function() {
    return to_i(now());
}
nowms = function() {
    var d = new Date();
    return d.getTime();
}


numsort = function(ary) {
    return ary.sort(function(a,b){ return a-b; });
}

// asserts
if(!assert){
    assert = function(cond,msg) {
        if(!cond) throw msg;
    }
}

muststring = function(s) {
    assert( typeof(s) == "string", "not a string: " + s );
}
mustnumber = function(n) {
    assert( typeof(n) == "number", "not a number: " + n );
}
mustobject = function(o) {
    assert( typeof(o) == "object", "not a object: " + o );
}
mustthrow = function(f){
    var ng = false;
    try {
        f();
        ng=true;
    } catch(e) {
        return;
    }
    throw "mustthrow: no exception catched";
}

    
function later(sec,f) {
    setTimeout(f,sec*1000);
}
function every(sec,f) {
    setInterval(f,sec*1000);
}

function choose(ary) {
    var i = irange(0, ary.length );
    return ary[i];
}
