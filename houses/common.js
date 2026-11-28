/* Shared code for the participant page and the admin page. */
var HOUSES = (function(){
var ENDPOINT = 'https://script.google.com/macros/s/AKfycbw8qHkkc6XXm_ncsTaz6CpGQkqA_59-bqAk6_bjwdRCIbANYqJRlmG39RKd9v905KIonA/exec';
var MAX = 100, SIZE = 1000;

/* palette (from the user's colour board) */
var C = {bg:'#69706C', line:'#F2ECDD', page:'#E5E3DE', ink:'#131718', muted:'#595C4B'};
var HOME = {x:330,y:330,w:340,h:340};
var STREETS = {st_n:{x:0,y:200,w:1000,h:70}, st_s:{x:0,y:730,w:1000,h:70}, st_w:{x:200,y:0,w:70,h:1000}, st_e:{x:730,y:0,w:70,h:1000}};

var T = {
  en:{dir:'ltr',title:'What lives here?',dear:'Dear you,',from:'Where are you from?',me:'Me',
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
  ar:{dir:'rtl',title:'شو ساكن هون؟',dear:'عزيزي/عزيزتي،',from:'من وين إنت/ي؟',me:'أنا',
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

/* ---- brushes as geometry: each stroke becomes elements that can move from inside ---- */
var LIGHT={bg:'#E8E7E4',line:'#69706C',colors:{anger:'#5F1B1C',hidden:'#A1A19D',calm:'#3B6F74',fear:'#4E473A',disgust:'#8E9F86',contempt:'#2E455B'}};
function arcs(r){var a=[0];for(var i=1;i<r.length;i++)a.push(a[i-1]+Math.hypot(r[i][0]-r[i-1][0],r[i][1]-r[i-1][1]));return a}
function geom(k,pts,si){
  var g={k:k,si:si,els:[],L:0};
  if(!pts.length)return g;
  if(k==='anger'){var r=resample(pts,22);if(r.length<2)r=[pts[0],[pts[0][0]+1,pts[0][1]]];var a=arcs(r);g.L=a[a.length-1];
    g.els=r.map(function(p,i){var q=r[Math.min(i+1,r.length-1)],o=r[Math.max(i-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],L=Math.hypot(dx,dy)||1,s=(i===0||i===r.length-1)?0:(i%2?1:-1)*(18+10*rnd(si,i));return {x:p[0]-dy/L*s,y:p[1]+dx/L*s,a:a[i]}});g.type='poly';g.w=5;g.join='miter';}
  else if(k==='contempt'){var r2=resample(pts,70),last=pts[pts.length-1];if(!r2.length||r2[r2.length-1]!==last)r2.push(last);var a2=arcs(r2);g.L=a2[a2.length-1];g.els=r2.map(function(p,i){return {x:p[0],y:p[1],a:a2[i]}});g.type='poly';g.w=7;g.join='miter';g.cap='square';}
  else if(k==='fear'){var r3=resample(pts,8);if(r3.length<2)r3=pts.concat([[pts[0][0]+1,pts[0][1]]]);var a3=arcs(r3);g.L=a3[a3.length-1];g.type='lines';g.lines=[0,1,2].map(function(n){return r3.map(function(p,i){var e=(i===0||i===r3.length-1)?0:1;return {x:p[0]+(rnd(si*7+n,i)-.5)*10*e,y:p[1]+(rnd(si*7+n,i+999)-.5)*10*e,a:a3[i]}})});}
  else if(k==='disgust'){var r4=resample(pts,16);if(!r4.length)r4=pts;var a4=arcs(r4);g.L=a4[a4.length-1];g.type='dots';
    r4.forEach(function(p,i){for(var n=0;n<2;n++){var an=rnd(si+n,i)*6.283,d=8+rnd(si+n,i+500)*34;g.els.push({x:p[0]+Math.cos(an)*d,y:p[1]+Math.sin(an)*d,r:2.2+rnd(si+n,i+900)*2.4,a:a4[i]})}});}
  else if(k==='hidden'){var r5=resample(pts,12);if(!r5.length)r5=pts;var a5=arcs(r5);g.L=a5[a5.length-1];g.type='fog';g.els=r5.map(function(p,i){return {x:p[0],y:p[1],r:54+12*rnd(si,i),a:a5[i]}});}
  else if(k==='calm'){var r6=resample(pts,18);if(r6.length<2)r6=pts.concat([[pts[0][0]+1,pts[0][1]]]);var a6=arcs(r6);g.L=a6[a6.length-1];g.type='calm';g.els=r6.map(function(p,i){return {x:p[0],y:p[1],a:a6[i]}});}
  return g;
}
function geoms(m){return (m.s||[]).map(function(st,si){return geom(m.k,st,si+1)})}
/* motion inside a stroke: amplitude in screen px, ends stay fixed */
var MOTION={anger:{amp:10,sp:3.2},calm:{amp:2.5,sp:.35},disgust:{amp:9,sp:1.1},contempt:{amp:6,sp:.9,step:true},fear:{amp:4,sp:2.2},hidden:{amp:8,sp:.4}};
function wave(t,s){return Math.sin(t+s)*.6+Math.sin(t*1.7+s*2.3)*.4}
function drawGeom(ctx,g,t,o){
  o=o||{};var col=(o.colors||FC)[g.k],M=MOTION[g.k],E=o.endZone||25,amp=o.still||t==null?0:M.amp*(o.unit||2.5),T=M.step?Math.floor((t||0)/0.9)*1.3:(t||0)*M.sp,seed=(o.seed||0)+g.si*17;
  function mv(e,i,lane){if(!amp)return [e.x,e.y];var w=Math.max(0,Math.min(1,Math.min(e.a,g.L-e.a)/E));if(!w)return [e.x,e.y];
    var ph=i*.9+(lane||0)*2.1+seed;return [e.x+amp*w*wave(T,ph),e.y+amp*w*wave(T*.9,ph*1.37+5)]}
  ctx.save();
  if(g.type==='poly'){ctx.strokeStyle=col;ctx.lineWidth=g.w;ctx.lineJoin=g.join||'round';ctx.lineCap=g.cap||'butt';ctx.beginPath();g.els.forEach(function(e,i){var p=mv(e,i);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});ctx.stroke()}
  else if(g.type==='lines'){ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.lineCap='round';g.lines.forEach(function(ln,n){ctx.beginPath();ln.forEach(function(e,i){var p=mv(e,i,n);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});ctx.stroke()})}
  else if(g.type==='dots'){ctx.fillStyle=col;g.els.forEach(function(e,i){var p=mv(e,i);ctx.beginPath();ctx.arc(p[0],p[1],e.r,0,7);ctx.fill()})}
  else if(g.type==='fog'){var rgb=hexrgb(col);g.els.forEach(function(e,i){var p=mv(e,i);soft(ctx,p[0],p[1],e.r,rgb,o.fogA||0.13)})}
  else if(g.type==='calm'){var rgb2=hexrgb(col),ps=g.els.map(function(e,i){return mv(e,i)});ps.forEach(function(p){soft(ctx,p[0],p[1],30,rgb2,0.2)});ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ps.forEach(function(p,i){i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});ctx.stroke()}
  ctx.restore();
}
/* static stroke, used for swatches and the line being drawn */
var BRUSH={};['anger','hidden','calm','fear','disgust','contempt'].forEach(function(k){BRUSH[k]=function(ctx,pts,si,o){drawGeom(ctx,geom(k,pts,si||1),null,o)}});

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
function drawFeeling(ctx,m,o){geoms(m).forEach(function(g){drawGeom(ctx,g,null,o)})}

/* static render (no motion) */
function render(canvas,house,lang,opt){
  opt=opt||{};var th=opt.theme||{},ctx=canvas.getContext('2d'),px=canvas.width/SIZE;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=th.bg||C.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.setTransform(px,0,0,px,0,0);drawMap(ctx,house,lang,Object.assign({line:th.line},opt));
  (house.marks||[]).forEach(function(m){if(!opt.only||opt.only[m.k])drawFeeling(ctx,m,{colors:th.colors,fogA:th.fogA})});
}

/* ---- living render: strokes stay in place, their insides move ---- */
var lives=[],running=false,last=0,frame=0;
function Live(canvas,house,lang,opt){
  this.c=canvas;this.h=house;this.lang=lang;this.opt=opt||{};var id=String(house.id||'x');this.seed=0;for(var i=0;i<id.length;i++)this.seed+=id.charCodeAt(i)*(i+1);
  this.build();lives.push(this);loop();
}
Live.prototype.build=function(){
  var W=this.c.width,px=W/SIZE,self=this,th=this.opt.theme||{};
  this.map=document.createElement('canvas');this.map.width=this.map.height=W;var mc=this.map.getContext('2d');
  mc.fillStyle=th.bg||C.bg;mc.fillRect(0,0,W,W);mc.setTransform(px,0,0,px,0,0);
  (this.opt.maps||[this.h]).forEach(function(h){drawMap(mc,h,self.lang,Object.assign({line:th.line},self.opt))});
  this.gs=[];
  var marks=this.opt.marks||(this.h.marks||[]);
  marks.forEach(function(m,mi){if(self.opt.only&&!self.opt.only[m.k])return;geoms(m).forEach(function(g){g.seed=self.seed+(m._seed||mi*131);self.gs.push(g)})});
  this.draw(performance.now()/1000);
};
Live.prototype.draw=function(t){
  var ctx=this.c.getContext('2d'),W=this.c.width,px=W/SIZE,disp=this.c.getBoundingClientRect().width||W,unit=SIZE/disp,th=this.opt.theme||{},o=this.opt;
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.map,0,0);ctx.setTransform(px,0,0,px,0,0);
  if(o.layerAlpha!=null)ctx.globalAlpha=o.layerAlpha;
  this.gs.forEach(function(g){drawGeom(ctx,g,t,{colors:th.colors,fogA:th.fogA,still:o.still,unit:unit,endZone:10*unit,seed:g.seed})});
  ctx.globalAlpha=1;
  if(this.extra){ctx.setTransform(1,0,0,1,0,0);this.extra(ctx)}
};
Live.prototype.update=function(house,lang,opt){this.h=house;if(lang)this.lang=lang;if(opt)this.opt=opt;this.build()};
Live.prototype.stop=function(){var i=lives.indexOf(this);if(i>=0)lives.splice(i,1)};
function loop(){if(running)return;running=true;requestAnimationFrame(function tick(ts){
  if(ts-last>40){last=ts;frame++;var t=ts/1000,vh=window.innerHeight;
    lives=lives.filter(function(l){return l.c.isConnected});
    lives.forEach(function(l){if(l.opt.still)return;if(l.opt.every&&frame%l.opt.every)return;var r=l.c.getBoundingClientRect();if(r.bottom<0||r.top>vh||!r.width)return;l.draw(t)})}
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
function remove(key,ids){
  if(!ENDPOINT){var a=localAll().filter(function(h){return ids.indexOf(h.id)<0});localStorage.setItem(LOCAL,JSON.stringify(a));return Promise.resolve({ok:true,deleted:ids.length})}
  return fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'delete',key:key,ids:ids})}).then(function(r){return r.json()});
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

return {LIGHT:LIGHT,T:T,C:C,HOME:HOME,STREETS:STREETS,FEELINGS:FEELINGS,FC:FC,ROOMS:ROOMS,ROOM_SIZE:ROOM_SIZE,SIZE:SIZE,MAX:MAX,BRUSH:BRUSH,
  render:render,drawMap:drawMap,Live:Live,placeOf:placeOf,count:count,send:send,all:all,remove:remove,xlsx:xlsx,local:function(){return !ENDPOINT}};
})();
