/* Shared code for the participant page and the admin page. */
var HOUSES = (function(){
var ENDPOINT = 'https://script.google.com/macros/s/AKfycbw8qHkkc6XXm_ncsTaz6CpGQkqA_59-bqAk6_bjwdRCIbANYqJRlmG39RKd9v905KIonA/exec';
var MAX = 100, SIZE = 1000;

/* palette (from the user's colour board) */
var C = {bg:'#69706C', line:'#F2ECDD', page:'#E5E3DE', ink:'#131718', muted:'#595C4B'};
var HOME = {x:330,y:330,w:340,h:340};
var STREETS = {st_n:{x:0,y:200,w:1000,h:70}, st_s:{x:0,y:730,w:1000,h:70}, st_w:{x:200,y:0,w:70,h:1000}, st_e:{x:730,y:0,w:70,h:1000}};

var T = {
  en:{dir:'ltr',title:'Where do we feel something hidden?',
    intro:'Draw your home from above and mark three places, inside it or around it, where you feel three different feelings. It is anonymous, and each person sends one house.',
    town:'Which town or city is this house in?',townPh:'Town or city',next:'Next',back:'Back',
    s1:'1 · Your house',s2:'2 · Around your house (optional)',s2h:'The square in the middle is your home, and around it is the neighbourhood. You can add the streets around it, and rooms inside. Drag a room to move it, drag its corner to resize.',
    streets:'Streets around',inside:'Inside the home',
    s3:'3 · Pick 3 different feelings',s3h:'Choose exactly three.',s4:'4 · Draw',s4h:'Draw each feeling where you feel it: inside the home, in the street or in the neighbourhood.',
    undo:'Undo',clear:'Clear',del:'Remove room',send:'Send my house',sending:'Sending…',
    needTown:'Write the town first.',need3:'Pick three feelings.',needDraw:'Draw all three feelings first.',
    thanks:'Your house is in. Thank you.',thanksH:'The map keeps growing for three days. This page is now closed for you.',
    closedFull:'All 100 houses have been drawn. Thank you for coming.',already:'You already sent a house from this phone. Thank you.',
    err:'Could not send. Check the connection and try again.',lang:'العربية',
    home:'Home',street:'Street',hood:'Neighbourhood',
    feelings:{anger:'Anger',hidden:'Something hidden',calm:'Calm',fear:'Fear',disgust:'Disgust',contempt:'Contempt'},
    rooms:{kitchen:'Kitchen',living:'Living room',bedroom:'Bedroom',bath:'Bathroom',door:'Front door',stairs:'Stairs',yard:'Yard',
      hood_n:'Neighbourhood',hood_e:'Neighbourhood',hood_s:'Neighbourhood',hood_w:'Neighbourhood',roof:'Roof'},
    places:{home:'Home (inside)',street:'Street',hood:'Neighbourhood',outside:'Outside / unmarked'}},
  ar:{dir:'rtl',title:'وين بنحس إنه في إشي مخبّى؟',
    intro:'ارسم/ي بيتك من فوق، وعلّم/ي ٣ أماكن، جوّا البيت أو حواليه، بتحس/ي فيها ٣ مشاعر مختلفة. بدون أسماء، وكل شخص ببعت بيت واحد.',
    town:'بأي بلد أو مدينة هاد البيت؟',townPh:'البلد أو المدينة',next:'التالي',back:'رجوع',
    s1:'١ · بيتك',s2:'٢ · حوالين البيت (اختياري)',s2h:'المربع بالنص هو بيتك، وحواليه الحارة. بتقدر/ي تضيف/ي الشوارع اللي حواليه، وغرف جوّا البيت. اسحب/ي الغرفة لتحرّكها، واسحب/ي زاويتها لتكبّرها.',
    streets:'الشوارع حوالين',inside:'جوّا البيت',
    s3:'٣ · اختار/ي ٣ مشاعر مختلفة',s3h:'بالزبط تلاتة.',s4:'٤ · ارسم/ي',s4h:'ارسم/ي كل شعور بالمكان اللي بتحس/ي فيه: جوّا البيت، بالشارع، أو بالحارة.',
    undo:'تراجع',clear:'امحي',del:'شيل الغرفة',send:'ابعت/ي البيت',sending:'عم ببعت…',
    needTown:'اكتب/ي البلد أول.',need3:'اختار/ي ٣ مشاعر.',needDraw:'ارسم/ي الـ٣ مشاعر أول.',
    thanks:'بيتك انضاف. شكراً.',thanksH:'الخريطة بتكبر على مدى ٣ أيام. هاي الصفحة صارت مسكّرة إلك.',
    closedFull:'انرسموا كل الـ١٠٠ بيت. شكراً إنك إجيت.',already:'بعتت/ي بيت من هاد التلفون. شكراً.',
    err:'ما انبعت. تأكد/ي من الإنترنت وجرّب/ي كمان مرة.',lang:'English',
    home:'بيت',street:'شارع',hood:'الحارة',
    feelings:{anger:'غضب',hidden:'إشي مخبّى',calm:'هدوء',fear:'خوف',disgust:'اشمئزاز',contempt:'احتقار'},
    rooms:{kitchen:'مطبخ',living:'صالون',bedroom:'غرفة نوم',bath:'حمّام',door:'باب البيت',stairs:'درج',yard:'حوش',
      hood_n:'الحارة',hood_e:'الحارة',hood_s:'الحارة',hood_w:'الحارة',roof:'سطح'},
    places:{home:'البيت (جوّا)',street:'الشارع',hood:'الحارة',outside:'برّا / بدون مكان'}}
};
var FEELINGS=[
  {k:'anger',color:'#5F1B1C'},{k:'hidden',color:'#E5E3DE'},{k:'calm',color:'#C9D3D1'},
  {k:'fear',color:'#4E473A'},{k:'disgust',color:'#9CAA7E'},{k:'contempt',color:'#2E455B'}];
var FC={};FEELINGS.forEach(function(f){FC[f.k]=f.color});
var ROOMS=['kitchen','living','bedroom','bath','door','stairs','yard'];
var ROOM_SIZE={kitchen:[140,110],living:[170,130],bedroom:[130,110],bath:[80,70],door:[70,22],stairs:[60,90],yard:[160,90]};
/* motion per feeling: amplitude range in screen px, speed, style */
var MOTION={anger:{lo:12,hi:30,sp:5.5},calm:{lo:1,hi:4,sp:.25},disgust:{lo:6,hi:14,sp:1.2},contempt:{lo:4,hi:10,sp:.9,step:true},fear:{lo:2,hi:6,sp:1.6,pulse:true},hidden:{lo:8,hi:18,sp:.35}};

function rnd(i,j){var x=Math.sin(i*12.9898+j*78.233)*43758.5453;return x-Math.floor(x)}
function hexrgb(h){h=h.replace('#','');return parseInt(h.substr(0,2),16)+','+parseInt(h.substr(2,2),16)+','+parseInt(h.substr(4,2),16)}
function resample(pts,step){
  if(pts.length<2)return pts.slice();var out=[pts[0]],acc=0;
  for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!d)continue;
    var t=step-acc;while(t<=d){out.push([a[0]+(b[0]-a[0])*t/d,a[1]+(b[1]-a[1])*t/d]);t+=step}acc=(acc+d)%step}
  return out;
}
function poly(ctx,pts){ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])})}
function soft(ctx,x,y,r,rgb,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}

var BRUSH={
  anger:function(ctx,pts,si){var r=resample(pts,10);if(r.length<2){ctx.fillStyle=FC.anger;ctx.fillRect(pts[0][0]-5,pts[0][1]-5,10,10);return}
    var z=r.map(function(p,i){var q=r[Math.min(i+1,r.length-1)],o=r[Math.max(i-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],L=Math.hypot(dx,dy)||1,s=(i%2?1:-1)*(10+7*rnd(si,i));return [p[0]-dy/L*s,p[1]+dx/L*s]});
    ctx.strokeStyle=FC.anger;ctx.lineWidth=5;ctx.lineJoin='miter';ctx.lineCap='butt';poly(ctx,z);ctx.stroke()},
  hidden:function(ctx,pts,si){var r=resample(pts,10);if(!r.length)r=pts;r.forEach(function(p,i){soft(ctx,p[0],p[1],54+12*rnd(si,i),hexrgb(FC.hidden),0.13)})},
  calm:function(ctx,pts,si){var r=resample(pts,18);if(!r.length)r=pts;r.forEach(function(p){soft(ctx,p[0],p[1],30,hexrgb(FC.calm),0.2)});
    ctx.strokeStyle=FC.calm;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';poly(ctx,r.length>1?r:pts);ctx.stroke()},
  fear:function(ctx,pts,si){var r=resample(pts,6);if(r.length<2)r=pts;ctx.strokeStyle=FC.fear;ctx.lineWidth=1.8;ctx.lineCap='round';
    for(var k=0;k<3;k++){poly(ctx,r.map(function(p,i){return [p[0]+(rnd(si*7+k,i)-.5)*10,p[1]+(rnd(si*7+k,i+999)-.5)*10]}));ctx.stroke()}},
  disgust:function(ctx,pts,si){var r=resample(pts,7);if(!r.length)r=pts;ctx.fillStyle=FC.disgust;
    r.forEach(function(p,i){for(var k=0;k<3;k++){var a=rnd(si+k,i)*6.283,d=rnd(si+k,i+500)*16,s=1.8+rnd(si+k,i+900)*2.6;ctx.beginPath();ctx.arc(p[0]+Math.cos(a)*d,p[1]+Math.sin(a)*d,s,0,7);ctx.fill()}})},
  contempt:function(ctx,pts,si){var r=resample(pts,70);var last=pts[pts.length-1];if(!r.length||r[r.length-1]!==last)r.push(last);
    ctx.strokeStyle=FC.contempt;ctx.lineWidth=7;ctx.lineJoin='miter';ctx.lineCap='square';poly(ctx,r);ctx.stroke()}
};

function isV2(h){return h&&h.v===2}
/* map layer: neighbourhood, streets, the home square, rooms */
function drawMap(ctx,house,lang,opt){
  opt=opt||{};var L=T[lang]||T.en,a=opt.alpha==null?1:opt.alpha,ln=opt.line||C.line;
  ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=ln;ctx.fillStyle=ln;ctx.textBaseline='middle';
  var lbl=opt.labels!==false;
  if(isV2(house)){
    if(lbl){ctx.font='500 28px Heebo, system-ui, sans-serif';ctx.textAlign='left';ctx.globalAlpha=a*.7;ctx.fillText(L.hood,24,30);ctx.globalAlpha=a}
    (house.streets||[]).forEach(function(k){var s=STREETS[k];if(!s)return;ctx.lineWidth=2;
      ctx.beginPath();if(s.w>s.h){ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+s.w,s.y);ctx.moveTo(s.x,s.y+s.h);ctx.lineTo(s.x+s.w,s.y+s.h)}else{ctx.moveTo(s.x,s.y);ctx.lineTo(s.x,s.y+s.h);ctx.moveTo(s.x+s.w,s.y);ctx.lineTo(s.x+s.w,s.y+s.h)}ctx.stroke();
      if(lbl){ctx.save();ctx.font='400 24px Heebo, system-ui, sans-serif';ctx.globalAlpha=a*.75;ctx.textAlign='center';
        if(s.w>s.h)ctx.fillText(L.street,s.x+90,s.y+s.h/2);else{ctx.translate(s.x+s.w/2,s.y+90);ctx.rotate(-Math.PI/2);ctx.fillText(L.street,0,0)}ctx.restore()}});
    ctx.lineWidth=5;ctx.strokeRect(HOME.x,HOME.y,HOME.w,HOME.h);
    if(lbl){ctx.font='700 32px Heebo, system-ui, sans-serif';ctx.textAlign='left';ctx.fillText(L.home,HOME.x,HOME.y-22)}
  }
  ctx.font='400 24px Heebo, system-ui, sans-serif';ctx.textAlign='center';
  (house.rooms||[]).forEach(function(r){
    var hood=r.t.indexOf('hood')===0;ctx.lineWidth=hood?2:1.6;ctx.setLineDash(hood?[10,8]:[]);
    ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.setLineDash([]);
    if(lbl){ctx.globalAlpha=a*.85;ctx.fillText(L.rooms[r.t]||r.t,r.x+r.w/2,r.y+r.h/2);ctx.globalAlpha=a}
    if(opt.selected===r){ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#E8B04A';ctx.strokeRect(r.x-5,r.y-5,r.w+10,r.h+10);ctx.fillStyle='#E8B04A';ctx.fillRect(r.x+r.w-12,r.y+r.h-12,24,24);ctx.restore()}
  });
  ctx.restore();
}
function drawFeeling(ctx,m){var b=BRUSH[m.k];if(!b)return;(m.s||[]).forEach(function(st,si){if(st.length)b(ctx,st,si+1)})}
function centroid(m){var n=0,x=0,y=0;(m.s||[]).forEach(function(st){st.forEach(function(p){n++;x+=p[0];y+=p[1]})});return n?[x/n,y/n]:[500,500]}

/* static render (no motion) */
function render(canvas,house,lang,opt){
  opt=opt||{};var ctx=canvas.getContext('2d'),px=canvas.width/SIZE;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=opt.bg||C.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.setTransform(px,0,0,px,0,0);drawMap(ctx,house,lang,opt);
  (house.marks||[]).forEach(function(m){if(!opt.only||opt.only[m.k])drawFeeling(ctx,m)});
}

/* ---- living render: each feeling layer moves on its own ---- */
var lives=[],running=false,last=0;
function wave(t,s){return Math.sin(t+s)*.6+Math.sin(t*1.7+s*2.3)*.4}
function offset(k,t,seed){var M=MOTION[k]||MOTION.disgust,amp=M.lo+(M.hi-M.lo)*rnd(seed,1),tt=t*M.sp;
  if(M.step){tt=Math.floor(t/0.9)*1.3}
  if(k==='anger'){return [amp*wave(tt,seed)+(rnd(seed,Math.floor(t*12))-.5)*4,amp*wave(tt*1.1,seed+5)+(rnd(seed+1,Math.floor(t*12))-.5)*4]}
  return [amp*wave(tt,seed),amp*wave(tt*.9,seed+5)]}
function pulse(t){var p=Math.max(0,Math.sin(t*2*Math.PI*1.1));return Math.pow(p,10)}
function Live(canvas,house,lang,opt){
  this.c=canvas;this.h=house;this.lang=lang;this.opt=opt||{};this.layers=[];this.seed=Math.floor(rnd(String(house.id||'x').length+String(house.id||'').charCodeAt(1||0),7)*1000);this.build();lives.push(this);loop();
}
Live.prototype.build=function(){
  var W=this.c.width,px=W/SIZE,self=this;
  this.map=document.createElement('canvas');this.map.width=this.map.height=W;var mc=this.map.getContext('2d');
  mc.fillStyle=this.opt.bg||C.bg;mc.fillRect(0,0,W,W);mc.setTransform(px,0,0,px,0,0);
  (this.opt.maps||[this.h]).forEach(function(h){drawMap(mc,h,self.lang,self.opt)});
  this.layers=[];
  var groups=this.opt.group?this.opt.group:(this.h.marks||[]).map(function(m){return [m]});
  groups.forEach(function(g,gi){if(!g.length)return;var k=g[0].k;if(self.opt.only&&!self.opt.only[k])return;
    var oc=document.createElement('canvas');oc.width=oc.height=W;var x=oc.getContext('2d');x.setTransform(px,0,0,px,0,0);
    if(self.opt.layerAlpha!=null)x.globalAlpha=self.opt.layerAlpha;
    g.forEach(function(m){drawFeeling(x,m)});
    var cs=g.map(centroid),cx=cs.reduce(function(s,c){return s+c[0]},0)/cs.length,cy=cs.reduce(function(s,c){return s+c[1]},0)/cs.length;
    self.layers.push({k:k,c:oc,seed:self.seed+gi*31+k.length,cx:cx*px,cy:cy*px})});
  this.draw(performance.now()/1000);
};
Live.prototype.draw=function(t){
  var ctx=this.c.getContext('2d'),W=this.c.width,disp=this.c.getBoundingClientRect().width||W,k=W/disp,still=this.opt.still;
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.map,0,0);
  this.layers.forEach(function(l){var o=still?[0,0]:offset(l.k,t,l.seed);var dx=o[0]*k,dy=o[1]*k;
    if(l.k==='fear'&&!still){var p=pulse(t+l.seed%3),s=1+.07*p;ctx.globalAlpha=.75+.25*p;ctx.drawImage(l.c,l.cx-l.cx*s+dx,l.cy-l.cy*s+dy,W*s,W*s);ctx.globalAlpha=1}
    else ctx.drawImage(l.c,dx,dy)});
  if(this.extra)this.extra(ctx);
};
Live.prototype.update=function(house,lang,opt){this.h=house;if(lang)this.lang=lang;if(opt)this.opt=opt;this.build()};
Live.prototype.stop=function(){var i=lives.indexOf(this);if(i>=0)lives.splice(i,1)};
function loop(){if(running)return;running=true;requestAnimationFrame(function tick(ts){
  if(ts-last>33){last=ts;var t=ts/1000,vh=window.innerHeight;
    lives=lives.filter(function(l){return l.c.isConnected});
    lives.forEach(function(l){var r=l.c.getBoundingClientRect();if(r.bottom<0||r.top>vh||!r.width)return;l.draw(t)})}
  requestAnimationFrame(tick)})}

/* ---- where a feeling was drawn ---- */
function placeOfPoint(house,p){
  var best=null,area=1e12;
  (house.rooms||[]).forEach(function(r){if(r.t.indexOf('hood')===0)return;if(p[0]>=r.x&&p[0]<=r.x+r.w&&p[1]>=r.y&&p[1]<=r.y+r.h&&r.w*r.h<area){area=r.w*r.h;best=r.t}});
  if(isV2(house)){
    var inHome=p[0]>=HOME.x&&p[0]<=HOME.x+HOME.w&&p[1]>=HOME.y&&p[1]<=HOME.y+HOME.h;
    if(inHome)return {zone:'home',room:best||''};
    var st=(house.streets||[]).some(function(k){var s=STREETS[k];return s&&p[0]>=s.x&&p[0]<=s.x+s.w&&p[1]>=s.y&&p[1]<=s.y+s.h});
    return {zone:st?'street':'hood',room:best||''};
  }
  var hood=(house.rooms||[]).some(function(r){return r.t.indexOf('hood')===0&&p[0]>=r.x&&p[0]<=r.x+r.w&&p[1]>=r.y&&p[1]<=r.y+r.h});
  return {zone:best?'home':hood?'hood':'outside',room:best||''};
}
function placeOf(house,k){
  var m=(house.marks||[]).filter(function(x){return x.k===k})[0];if(!m)return {zone:'',room:''};
  var z={},pts=[];(m.s||[]).forEach(function(st){st.forEach(function(p){var q=placeOfPoint(house,p);pts.push(q);z[q.zone]=(z[q.zone]||0)+1})});
  function top(o){var b='',c=-1;for(var key in o)if(o[key]>c){c=o[key];b=key}return b}
  var zone=top(z),rr={};pts.forEach(function(q){if(q.zone===zone&&q.room)rr[q.room]=(rr[q.room]||0)+1});
  return {zone:zone,room:top(rr)};
}

/* ---- storage ---- */
var LOCAL='houses.local.v1';
function localAll(){try{return JSON.parse(localStorage.getItem(LOCAL)||'[]')}catch(e){return []}}
function count(){if(!ENDPOINT)return Promise.resolve({count:localAll().length,max:MAX});return fetch(ENDPOINT+'?count=1').then(function(r){return r.json()})}
function send(house){
  if(!ENDPOINT){var a=localAll();if(a.length>=MAX)return Promise.resolve({ok:false,full:true});a.push(Object.assign({ts:new Date().toISOString()},house));localStorage.setItem(LOCAL,JSON.stringify(a));return Promise.resolve({ok:true})}
  return fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(house)}).then(function(r){return r.json()});
}
function all(key){if(!ENDPOINT)return Promise.resolve({rows:localAll(),max:MAX,local:true});return fetch(ENDPOINT+'?key='+encodeURIComponent(key||'')).then(function(r){return r.json()})}

/* ---- tiny xlsx writer ---- */
var CRC=(function(){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){var c=0xFFFFFFFF;for(var i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zip(files){var enc=new TextEncoder(),parts=[],cen=[],off=0;
  files.forEach(function(f){var name=enc.encode(f.name),data=enc.encode(f.data),crc=crc32(data);
    var h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    var c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    cen.push(new Uint8Array(c.buffer),name);off+=30+name.length+data.length});
  var cs=cen.reduce(function(s,u){return s+u.length},0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  var all=parts.concat(cen,[new Uint8Array(e.buffer)]),len=all.reduce(function(s,u){return s+u.length},0),out=new Uint8Array(len),p=0;all.forEach(function(u){out.set(u,p);p+=u.length});return out}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function col(i){var s='';i++;while(i){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
function xlsx(sheets){
  function sx(rows){return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+rows.map(function(r,ri){return '<row r="'+(ri+1)+'">'+r.map(function(v,ci){var ref=col(ci)+(ri+1);return typeof v==='number'?'<c r="'+ref+'"><v>'+v+'</v></c>':'<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+esc(v==null?'':v)+'</t></is></c>'}).join('')+'</row>'}).join('')+'</sheetData></worksheet>'}
  var f=[{name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map(function(s,i){return '<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'}).join('')+'</Types>'},
    {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map(function(s,i){return '<sheet name="'+esc(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>'}).join('')+'</sheets></workbook>'},
    {name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map(function(s,i){return '<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'}).join('')+'</Relationships>'}];
  sheets.forEach(function(s,i){f.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:sx(s.rows)})});return zip(f)}

return {T:T,C:C,HOME:HOME,STREETS:STREETS,FEELINGS:FEELINGS,FC:FC,ROOMS:ROOMS,ROOM_SIZE:ROOM_SIZE,SIZE:SIZE,MAX:MAX,BRUSH:BRUSH,
  render:render,drawMap:drawMap,Live:Live,placeOf:placeOf,count:count,send:send,all:all,xlsx:xlsx,local:function(){return !ENDPOINT}};
})();
