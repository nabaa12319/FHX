/* Shared code for the participant page and the admin page.
   Set ENDPOINT to the Google Apps Script web-app URL. Empty = local test mode (saves in this browser only). */
var HOUSES = (function(){
var ENDPOINT = '';
var MAX = 100;
var SIZE = 1000; /* drawings are stored in a 1000 x 1000 space */

var T = {
  en:{dir:'ltr',title:'Where do we feel something hidden?',
    intro:'Draw your home from above and mark three places, inside it or around it, where you feel three different feelings. It is anonymous, and each person sends one house.',
    town:'Which town or city is this house in?',townPh:'Town or city',next:'Next',back:'Back',skip:'Skip',
    s1:'1 · Your house',s2:'2 · Sketch your house (optional)',s2h:'Add only what helps you: rooms, the door, the neighbourhood around. Drag to move, drag the corner to resize.',
    s3:'3 · Pick 3 different feelings',s3h:'Choose exactly three.',s4:'4 · Draw',s4h:'Draw each feeling where you feel it: inside the house or around it.',
    undo:'Undo',clear:'Clear',del:'Remove',send:'Send my house',sending:'Sending…',
    needTown:'Write the town first.',need3:'Pick three feelings.',needDraw:'Draw all three feelings first.',
    thanks:'Your house is in. Thank you.',thanksH:'The map keeps growing for three days. This page is now closed for you.',
    closedFull:'All 100 houses have been drawn. Thank you for coming.',already:'You already sent a house from this phone. Thank you.',
    err:'Could not send. Check the connection and try again.',lang:'العربية',
    feelings:{anger:'Anger',hidden:'Something hidden',calm:'Calm',fear:'Fear',disgust:'Disgust',contempt:'Contempt'},
    rooms:{kitchen:'Kitchen',living:'Living room',bedroom:'Bedroom',bath:'Bathroom',door:'Front door',yard:'Yard',stairs:'Stairs',roof:'Roof',
      hood_n:'Neighbourhood',hood_e:'Neighbourhood',hood_s:'Neighbourhood',hood_w:'Neighbourhood'},
    addHood:'Neighbourhood sides',outside:'Outside / unmarked'},
  ar:{dir:'rtl',title:'وين بنحس إنه في إشي مخبّى؟',
    intro:'ارسم/ي بيتك من فوق، وعلّم/ي ٣ أماكن، جوّا البيت أو حواليه، بتحس/ي فيها ٣ مشاعر مختلفة. بدون أسماء، وكل شخص ببعت بيت واحد.',
    town:'بأي بلد أو مدينة هاد البيت؟',townPh:'البلد أو المدينة',next:'التالي',back:'رجوع',skip:'تخطّي',
    s1:'١ · بيتك',s2:'٢ · ارسم/ي مخطط البيت (اختياري)',s2h:'ضيف/ي بس اللي بيساعدك: غرف، الباب، الحارة حوالين. اسحب/ي لتحرّك، واسحب/ي الزاوية لتكبّر.',
    s3:'٣ · اختار/ي ٣ مشاعر مختلفة',s3h:'بالزبط تلاتة.',s4:'٤ · ارسم/ي',s4h:'ارسم/ي كل شعور بالمكان اللي بتحس/ي فيه: جوّا البيت أو حواليه.',
    undo:'تراجع',clear:'امحي',del:'شيل',send:'ابعت/ي البيت',sending:'عم ببعت…',
    needTown:'اكتب/ي البلد أول.',need3:'اختار/ي ٣ مشاعر.',needDraw:'ارسم/ي الـ٣ مشاعر أول.',
    thanks:'بيتك انضاف. شكراً.',thanksH:'الخريطة بتكبر على مدى ٣ أيام. هاي الصفحة صارت مسكّرة إلك.',
    closedFull:'انرسموا كل الـ١٠٠ بيت. شكراً إنك إجيت.',already:'بعتت/ي بيت من هاد التلفون. شكراً.',
    err:'ما انبعت. تأكد/ي من الإنترنت وجرّب/ي كمان مرة.',lang:'English',
    feelings:{anger:'غضب',hidden:'إشي مخبّى',calm:'هدوء',fear:'خوف',disgust:'اشمئزاز',contempt:'احتقار'},
    rooms:{kitchen:'مطبخ',living:'صالون',bedroom:'غرفة نوم',bath:'حمّام',door:'باب البيت',yard:'حوش',stairs:'درج',roof:'سطح',
      hood_n:'الحارة',hood_e:'الحارة',hood_s:'الحارة',hood_w:'الحارة'},
    addHood:'جهات الحارة',outside:'برّا / بدون مكان'}
};
var FEELINGS=[
  {k:'anger',color:'#B3261E'},{k:'hidden',color:'#6E7887'},{k:'calm',color:'#3A8F82'},
  {k:'fear',color:'#7655A5'},{k:'disgust',color:'#7D8040'},{k:'contempt',color:'#8A5A2E'}];
var FC={};FEELINGS.forEach(function(f){FC[f.k]=f.color});
var ROOMS=['kitchen','living','bedroom','bath','door','yard','stairs','roof'];
var ROOM_SIZE={kitchen:[240,180],living:[300,220],bedroom:[220,180],bath:[140,120],door:[120,40],yard:[300,160],stairs:[120,160],roof:[300,200]};
var HOOD={hood_n:[0,0,1000,90],hood_s:[0,910,1000,90],hood_w:[0,0,90,1000],hood_e:[910,0,90,1000]};
var INK='#1C2340';

function rnd(i,j){var x=Math.sin(i*12.9898+j*78.233)*43758.5453;return x-Math.floor(x)}
function resample(pts,step){
  if(pts.length<2)return pts.slice();var out=[pts[0]],acc=0;
  for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!d)continue;
    var t=step-acc;while(t<=d){out.push([a[0]+(b[0]-a[0])*t/d,a[1]+(b[1]-a[1])*t/d]);t+=step}acc=(acc+d)%step}
  return out;
}
function poly(ctx,pts){ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])});}
function soft(ctx,x,y,r,rgb,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}

/* each brush draws one stroke (array of [x,y] in 1000-space); si = stroke index for stable jitter */
var BRUSH={
  anger:function(ctx,pts,si){var r=resample(pts,10);if(r.length<2){ctx.fillStyle=FC.anger;ctx.fillRect(pts[0][0]-4,pts[0][1]-4,8,8);return}
    var z=r.map(function(p,i){var q=r[Math.min(i+1,r.length-1)],o=r[Math.max(i-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],L=Math.hypot(dx,dy)||1,s=(i%2?1:-1)*(9+6*rnd(si,i));return [p[0]-dy/L*s,p[1]+dx/L*s]});
    ctx.strokeStyle=FC.anger;ctx.lineWidth=4;ctx.lineJoin='miter';ctx.lineCap='butt';poly(ctx,z);ctx.stroke()},
  hidden:function(ctx,pts,si){var r=resample(pts,10);if(!r.length)r=pts;r.forEach(function(p,i){soft(ctx,p[0],p[1],52+10*rnd(si,i),'110,120,135',0.09)})},
  calm:function(ctx,pts,si){var r=resample(pts,18);if(!r.length)r=pts;r.forEach(function(p,i){soft(ctx,p[0],p[1],30,'58,143,130',0.16)});
    ctx.strokeStyle='rgba(58,143,130,.55)';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';poly(ctx,r.length>1?r:pts);ctx.stroke()},
  fear:function(ctx,pts,si){var r=resample(pts,6);if(r.length<2)r=pts;ctx.strokeStyle=FC.fear;ctx.lineWidth=1.3;ctx.lineCap='round';
    for(var k=0;k<3;k++){poly(ctx,r.map(function(p,i){return [p[0]+(rnd(si*7+k,i)-.5)*9,p[1]+(rnd(si*7+k,i+999)-.5)*9]}));ctx.stroke()}},
  disgust:function(ctx,pts,si){var r=resample(pts,7);if(!r.length)r=pts;ctx.fillStyle=FC.disgust;
    r.forEach(function(p,i){for(var k=0;k<3;k++){var a=rnd(si+k,i)*6.283,d=rnd(si+k,i+500)*16,s=1.5+rnd(si+k,i+900)*2.5;ctx.beginPath();ctx.arc(p[0]+Math.cos(a)*d,p[1]+Math.sin(a)*d,s,0,7);ctx.fill()}})},
  contempt:function(ctx,pts,si){var r=resample(pts,70);var last=pts[pts.length-1];if(!r.length||r[r.length-1]!==last)r.push(last);
    ctx.strokeStyle=FC.contempt;ctx.lineWidth=7;ctx.lineJoin='miter';ctx.lineCap='square';poly(ctx,r);ctx.stroke()}
};

function drawRooms(ctx,rooms,lang,opt){
  opt=opt||{};var L=T[lang]||T.en;
  ctx.save();ctx.strokeStyle=opt.ink||INK;ctx.fillStyle=opt.ink||INK;ctx.globalAlpha=opt.alpha==null?1:opt.alpha;
  ctx.font='600 26px Heebo, system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  (rooms||[]).forEach(function(r){
    var hood=r.t.indexOf('hood')===0;ctx.lineWidth=hood?2:3.5;ctx.setLineDash(hood?[10,8]:[]);
    ctx.strokeRect(r.x,r.y,r.w,r.h);ctx.setLineDash([]);
    if(opt.labels!==false){var label=L.rooms[r.t]||r.t;ctx.save();if(r.h>r.w*1.6&&hood){ctx.translate(r.x+r.w/2,r.y+r.h/2);ctx.rotate(-Math.PI/2);ctx.fillText(label,0,0)}else ctx.fillText(label,r.x+r.w/2,r.y+r.h/2);ctx.restore()}
    if(opt.selected===r){ctx.lineWidth=2;ctx.strokeStyle='#E07A1F';ctx.strokeRect(r.x-6,r.y-6,r.w+12,r.h+12);ctx.fillStyle='#E07A1F';ctx.fillRect(r.x+r.w-14,r.y+r.h-14,28,28);ctx.strokeStyle=opt.ink||INK;ctx.fillStyle=opt.ink||INK}
  });
  ctx.restore();
}
function drawMarks(ctx,marks,only,alpha){
  ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;
  (marks||[]).forEach(function(m){if(only&&!only[m.k])return;var b=BRUSH[m.k];if(!b)return;
    (m.s||[]).forEach(function(st,si){if(st.length)b(ctx,st,si+1)})});
  ctx.restore();
}
/* render a whole house into a canvas of any pixel size */
function render(canvas,house,lang,opt){
  opt=opt||{};var ctx=canvas.getContext('2d'),px=canvas.width/SIZE;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  if(opt.bg!==false){ctx.fillStyle=opt.bg||'#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height)}
  ctx.setTransform(px,0,0,px,0,0);
  drawRooms(ctx,house.rooms,lang,opt);
  drawMarks(ctx,house.marks,opt.only,opt.markAlpha);
}
/* which element a feeling was drawn in (by most points) */
function placeOf(house,k){
  var m=(house.marks||[]).filter(function(x){return x.k===k})[0];if(!m)return '';
  var tally={},n=0;
  (m.s||[]).forEach(function(st){st.forEach(function(p){n++;var best=null,area=1e12;
    (house.rooms||[]).forEach(function(r){if(p[0]>=r.x&&p[0]<=r.x+r.w&&p[1]>=r.y&&p[1]<=r.y+r.h&&r.w*r.h<area){area=r.w*r.h;best=r.t}});
    var key=best?(best.indexOf('hood')===0?'hood':best):'outside';tally[key]=(tally[key]||0)+1})});
  var top='',c=-1;for(var key in tally)if(tally[key]>c){c=tally[key];top=key}return top;
}

/* ---- storage: Google Apps Script, or local test mode ---- */
var LOCAL='houses.local.v1';
function localAll(){try{return JSON.parse(localStorage.getItem(LOCAL)||'[]')}catch(e){return []}}
function count(){
  if(!ENDPOINT)return Promise.resolve({count:localAll().length,max:MAX});
  return fetch(ENDPOINT+'?count=1').then(function(r){return r.json()});
}
function send(house){
  if(!ENDPOINT){var a=localAll();if(a.length>=MAX)return Promise.resolve({ok:false,full:true});a.push(Object.assign({ts:new Date().toISOString()},house));localStorage.setItem(LOCAL,JSON.stringify(a));return Promise.resolve({ok:true})}
  return fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(house)}).then(function(r){return r.json()});
}
function all(key){
  if(!ENDPOINT)return Promise.resolve({rows:localAll(),max:MAX,local:true});
  return fetch(ENDPOINT+'?key='+encodeURIComponent(key||'')).then(function(r){return r.json()});
}

/* ---- tiny xlsx writer (stored zip, inline strings) ---- */
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

return {T:T,FEELINGS:FEELINGS,FC:FC,ROOMS:ROOMS,ROOM_SIZE:ROOM_SIZE,HOOD:HOOD,SIZE:SIZE,MAX:MAX,BRUSH:BRUSH,
  render:render,drawRooms:drawRooms,drawMarks:drawMarks,placeOf:placeOf,count:count,send:send,all:all,xlsx:xlsx,local:function(){return !ENDPOINT}};
})();
