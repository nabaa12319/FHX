/* 3D product models + product recognition for ثلاجة بيتنا */
(function(){
const T=THREE;
const FONT='"IBM Plex Sans Arabic",Rubik,sans-serif';

/* ---------- recognition ---------- */
const norm=s=>' '+String(s||'').toLowerCase().replace(/[ً-ٰٟ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/["'׳״]/g,'').replace(/\s+/g,' ').trim()+' ';
const L=(keys,d)=>({keys:keys.split('|').map(k=>k.startsWith(' ')||k.endsWith(' ')?' '+norm(k).trim()+' ':norm(k).trim()),d});
const LEX=[
 L('بصل اخضر|بصل أخضر|בצל ירוק',{k:'bunch',c1:'#5aa548',c2:'#eef3df',z:'chiller',t:'ضمة بصل أخضر'}),
 L('بطاطا حلوه|بطاطا حلوة|בטטה',{k:'potato',c1:'#c0603a',c2:'#8f4528',z:'crisperR',t:'بطاطا حلوة'}),
 L('سلق|סלק עלים|سبانخ|תרד|ملوخيه|ملوخية|خبيزه',{k:'bunch',c1:'#2f6b2a',c2:'#b33a4a',z:'chiller',t:'ضمة خضرة ورقية',big:1}),
 L('جبنه صفرا|جبنة صفراء|גבינה צהובה|צהובה|عيمك|עמק|גאודה|غودا',{k:'block',c1:'#f2c84f',c2:'#2f7a47',z:'shelf1',t:'قالب جبنة صفراء'}),
 L('بلغاري|بلغارية|בולגרית|צפתית|فيتا|פטה|عكاوي|نابلسي|حلوم|חלומי',{k:'block',c1:'#ffffff',c2:'#3a8b5c',z:'shelf1',t:'قالب جبنة بيضاء'}),
 L('جبنه بيضا|جبنة بيضاء|גבינה לבנה|גבינת שמנת|לבנה 5',{k:'tub',c1:'#ffffff',c2:'#3a7fc4',co:'תנובה',z:'shelf1',t:'علبة جبنة بيضاء'}),
 L('لبنه|لبنة|labaneh',{k:'tubL',c1:'#ffffff',c2:'#2d6db5',z:'shelf1',t:'علبة لبنة'}),
 L('ميلكي|מילקי|بودينغ|פודינג|דני',{k:'yogurt',c1:'#6b3f22',c2:'#f4f0e8',co:'שטראוס',z:'shelf1',t:'كاسات ميلكي'}),
 L('يوغورت|يوغرت|زبادي|יוגורט|דנונה|دانونا|יופלה|מולר|אקטיביה|activia|danone',{k:'yogurt',c1:'#ffffff',c2:'#e05a7a',z:'shelf1',t:'كاسات يوغورت'}),
 L('كوتج|קוטג',{k:'tub',c1:'#ffffff',c2:'#1f5fa8',co:'תנובה',z:'shelf1',t:'علبة كوتج'}),
 L('شمنيت|قشطه|كريمه|שמנת',{k:'tubS',c1:'#ffffff',c2:'#4b8fd6',co:'תנובה',z:'shelf1',t:'علبة شمنيت'}),
 L('جبنه|גבינה',{k:'tubL',c1:'#fbf9f2',c2:'#3a8b5c',z:'shelf1',t:'علبة جبنة'}),
 L('حليب|חלב|milk',{k:'carton2',c1:'#ffffff',c2:'#2e64b0',co:'תנובה',z:'doorB',t:'كرتونة حليب'}),
 L('لبن|לבן|leben|אשל|ليبن|رايب',{k:'carton1',c1:'#ffffff',c2:'#3aa0d8',co:'תנובה',z:'doorB',t:'قنينة لبن'}),
 L('زبده|חמאה|lurpak|لورباك',{k:'block',c1:'#f6ecce',c2:'#c7333c',z:'shelf1',t:'قالب زبدة'}),
 L('مارجرين|מרגרינה|מחמאה|بلو باند|בלו בנד',{k:'tub',c1:'#f8e9a8',c2:'#e0a21a',z:'shelf1',t:'علبة مارجرين'}),
 L('حمص|חומוס|hummus',{k:'tub',c1:'#efe1c0',c2:'#c9493b',z:'shelf1',t:'علبة حمص'}),
 L('طحينه|טחינה',{k:'jar',c1:'#e3cfa8',c2:'#2c5c3a',z:'door2',t:'مرطبان طحينة'}),
 L('متبل|بابا غنوج|חצילים|سلطه|סלט|מטבוחה|مطبوخه|לבנה|حصلים|חצלים',{k:'tub',c1:'#e9e2d6',c2:'#6e4a86',z:'shelf1',t:'علبة سلطة'}),
 L('بيض|ביצים|ביצה|eggs',{k:'eggs',c1:'#f1e2c8',c2:'#cbbd9f',z:'door1',t:'كرتونة بيض'}),
 L('كماج|פיתה|פיתות|خبز عربي|طابون|לאפה|لافا|مرقوق',{k:'pita',c1:'#e8c690',c2:'#ffffff',z:'house',t:'كيس كماج'}),
 L('خبز|לחם|توست|טוסט|bread|جالي|חלה',{k:'loaf',c1:'#c98d4b',c2:'#f3e6cf',z:'house',t:'رغيف خبز'}),
 L('عصير|מיץ|פריגת|prigat|جوس|טפוזינה|تبوزينا|נקטר',{k:'carton2',c1:'#f39c2a',c2:'#2f8f3a',co:'פריגת',z:'doorB',t:'كرتونة عصير'}),
 L('كولا|קולה|cola|بيبسي|פפסי',{k:'bottle',c1:'#3b1f14',c2:'#d42a2a',z:'doorB',t:'قنينة كولا'}),
 L('سبرايت|ספרייט|sprite|سفن اب|7up|فانتا|פאנטה|زيرو',{k:'bottle',c1:'#cfe9c2',c2:'#1f8a3c',z:'doorB',t:'قنينة مشروب'}),
 L(' مي | مي|مياه|ميه|מים|נביעות|עין גדי|صودا|סודה|water',{k:'bottle',c1:'#e3f3fb',c2:'#3a8fd0',z:'doorB',t:'قنينة مي',clear:1}),
 L('زيتون|זיתים',{k:'jar',c1:'#5a6b2a',c2:'#2c3a1a',z:'door2',t:'مرطبان زيتون'}),
 L('زيت|שמן',{k:'bottle',c1:'#d9b23a',c2:'#3d6b2e',z:'house',t:'قنينة زيت'}),
 L('كاتشب|كتشب|קטשופ|ketchup',{k:'squeeze',c1:'#c8231f',c2:'#ffffff',co:'אסם',z:'door2',t:'قنينة كاتشب'}),
 L('مايونيز|מיונז|هلمانز|הלמנס',{k:'squeeze',c1:'#fbf8ee',c2:'#1f4d9c',co:'תלמה',z:'door2',t:'قنينة مايونيز'}),
 L('خردل|חרדל|mustard',{k:'squeeze',c1:'#f1c232',c2:'#c0392b',z:'door2',t:'قنينة خردل'}),
 L('شطه|شطة|סחוג|זחוג|هريسه|הריסה',{k:'jar',c1:'#b8261f',c2:'#2f6b2a',z:'door2',t:'مرطبان شطة'}),
 L('نوتيلا|נוטלה|ממרח',{k:'jar',c1:'#5a3420',c2:'#c62828',z:'door2',t:'مرطبان شوكولاتة'}),
 L('مربى|ריבה|jam',{k:'jar',c1:'#b0283a',c2:'#e7d9b8',z:'door2',t:'مرطبان مربى'}),
 L('عسل|דבש',{k:'jar',c1:'#e0a21a',c2:'#5b3a1a',z:'door2',t:'مرطبان عسل'}),
 L('مخلل|كبيس|חמוצים|מלפפון חמוץ',{k:'jar',c1:'#7e9a3a',c2:'#c9a227',z:'door2',t:'مرطبان مخلل'}),
 L('تونا|טונה|tuna',{k:'can',c1:'#2a6fb0',c2:'#f1c232',co:'סטארקיסט',z:'shelf2',t:'علبة تونا',flat:1}),
 L('ذره|תירס',{k:'can',c1:'#f1c232',c2:'#2f8f3a',z:'shelf2',t:'علبة ذرة'}),
 L('شوكولاته|שוקולד|عيليت|עלית|كيندر',{k:'bar',c1:'#5a2d82',c2:'#ffffff',co:'עלית',z:'door1',t:'لوح شوكولاتة'}),
 L('شنيتسل|شنيتزل|שניצל|دجاج|جاج|עוף|חזה|פרגיות|كبده|כבד|اجنحه|כנפיים',{k:'tray',c1:'#f2c1a6',c2:'#ffffff',z:'shelf2',t:'صينية دجاج'}),
 L('لحمه|لحم|בשר|كفته|קציצות|انتركوت|אנטריקוט|ستيك|سيخ|קבב|كباب|مفروم|טחון',{k:'tray',c1:'#b8433d',c2:'#ffffff',z:'shelf2',t:'صينية لحمة'}),
 L('سمك|דג|סלמון|سلمون|فيليه|אמנון|دنيس|דניס',{k:'tray',c1:'#f08a6c',c2:'#dfeef6',z:'shelf2',t:'صينية سمك'}),
 L('نقانق|נקניקיות|נקניק|פסטרמה|بسطرمه|سلامي|סלמי|مرتديلا',{k:'pack',c1:'#c9584a',c2:'#ffffff',co:'זוגלובק',z:'shelf2',t:'باكيت نقانق'}),
 L('بطاطا|بطاطس|תפוחי אדמה|תפוא|potato',{k:'potato',c1:'#c9a06a',c2:'#a9824f',z:'crisperR',t:'بطاطا'}),
 L('باذنجان|بيتنجان|חציל',{k:'eggplant',c1:'#3e1f4a',c2:'#4f7a2a',z:'crisperL',t:'باذنجانة'}),
 L('كوسا|קישוא',{k:'zucchini',c1:'#6c9a3c',c2:'#3f6b22',z:'crisperL',t:'كوساية'}),
 L('ملفوف|כרוב ',{k:'cabbage',c1:'#a9cf7a',c2:'#d9ecb8',z:'crisperR',t:'ملفوفة'}),
 L('بروكلي|ברוקולי',{k:'broccoli',c1:'#3d7a32',c2:'#6fa05a',z:'crisperR',t:'بروكلي'}),
 L('قرنبيط|زهره|כרובית',{k:'cauli',c1:'#f3eedc',c2:'#6fa05a',z:'crisperR',t:'قرنبيط'}),
 L('فطر|مشروم|פטריות|שמפיניון',{k:'mushroom',c1:'#f3ece0',c2:'#8f7a5a',z:'chiller',t:'علبة فطر'}),
 L('بندوره|طماطم|עגבני|שרי',{k:'tomato',c1:'#e0483b',c2:'#4f8a3a',z:'crisperL',t:'بندورة'}),
 L('خيار|مقتي|מלפפון',{k:'cucumber',c1:'#4c8a3c',c2:'#6aa752',z:'crisperL',t:'خيارة'}),
 L('فلفل|פלפל',{k:'pepper',c1:'#d6322e',c2:'#3f7d31',z:'crisperL',t:'فلفل رومي'}),
 L('بصل|בצל',{k:'onion',c1:'#d9a35f',c2:'#b9813e',z:'chiller',t:'بصلة'}),
 L('ثوم|שום',{k:'garlic',c1:'#f1ece0',c2:'#d8cfbd',z:'chiller',t:'راس ثوم'}),
 L('جزر|גזר',{k:'carrot',c1:'#ec8a2c',c2:'#5f9e43',z:'crisperR',t:'جزرة'}),
 L('شمندر|شوندر|סלק',{k:'round',c1:'#7a1d3a',c2:'#4f7a2a',z:'crisperR',t:'شمندر'}),
 L('فجل|צנון',{k:'round',c1:'#d43a5a',c2:'#4f8a3a',z:'chiller',t:'فجل',small:1}),
 L('خس|חסה',{k:'lettuce',c1:'#9ccc6a',c2:'#c7e39a',z:'chiller',t:'خسة'}),
 L('بقدونس|פטרוזיליה|نعنع|נענע|كزبره|כוסברה|شبت|שמיר|ريحان|בזיליקום|جرجير|רוקט|ميرميه|מרווה|زعتر|זעתר|كرفس|סלרי',{k:'bunch',c1:'#3f8f3a',c2:'#6fb553',z:'chiller',t:'ضمة'}),
 L('تفاح|תפוח|apple',{k:'apple',c1:'#c8282e',c2:'#5a8f2a',z:'shelf3',t:'تفاحة'}),
 L('موز|בננ|banana',{k:'banana',c1:'#f2d03b',c2:'#6b4a1f',z:'shelf3',t:'موز'}),
 L('برتقال|תפוז|كلمنتينا|קלמנטינה|منداريني|مندلينا|اشكدنيا|ננה',{k:'orange',c1:'#f28c1c',c2:'#4f8a3a',z:'shelf3',t:'برتقالة'}),
 L('ليمون|לימון',{k:'lemon',c1:'#f5de3a',c2:'#8fae3a',z:'shelf3',t:'ليمونة'}),
 L('عنب|ענבים',{k:'grapes',c1:'#7a3b7d',c2:'#5a7a2a',z:'shelf3',t:'عنقود عنب'}),
 L('افوكادو|אבוקדו',{k:'pear',c1:'#3c5a24',c2:'#2a3a18',z:'shelf3',t:'أفوكادو'}),
 L('اجاص|انجاص|אגס',{k:'pear',c1:'#c9cf4a',c2:'#6b4a1f',z:'shelf3',t:'إجاصة'}),
 L('مانجا|منجا|מנגו',{k:'pear',c1:'#f4a62a',c2:'#6fae3a',z:'shelf3',t:'مانجا'}),
 L('فراوله|תות',{k:'berries',c1:'#d8202e',c2:'#3f8a2f',z:'shelf3',t:'علبة فراولة'}),
 L('بطيخ|אבטיח',{k:'melon',c1:'#2f6b2a',c2:'#e5413f',z:'shelf3',t:'نص بطيخة'}),
 L('شمام|מלון',{k:'round',c1:'#e8d58a',c2:'#b8a05a',z:'shelf3',t:'شمامة',big:1}),
 L('رمان|רימון',{k:'pomegranate',c1:'#b3202a',c2:'#7a1a1a',z:'shelf3',t:'رمانة'}),
 L('خوخ|אפרסק|نكتارين|נקטרינה|مشمش|משמש|دراق',{k:'apple',c1:'#f29a5a',c2:'#d9553a',z:'shelf3',t:'خوخة'}),
 L('كيوي|קיווי',{k:'round',c1:'#7a5a32',c2:'#5a8f2a',z:'shelf3',t:'كيوي',small:1}),
 L('تمر|תמרים',{k:'box',c1:'#6b3a1f',c2:'#e9d9b0',z:'house',t:'علبة تمر'})
];
const COLORWORDS=[[/احمر|אדום/,'#d6322e'],[/اصفر|צהוב/,'#f1c232'],[/اخضر غامق|غامق/,'#2f6b2a'],[/اخضر فاتح|فاتح/,'#8cc152'],[/اخضر|ירוק/,'#3f8a2f'],[/برتقالي|כתום/,'#f08a24'],[/اخضر/,'#3f8a2f']];
function recognize(name){const n=norm(name);if(n.trim().length<2)return null;
 for(const e of LEX)for(const k of e.keys)if(k&&n.includes(k)){const d={...e.d};
  if(/pepper|apple/.test(d.k))for(const[re,c]of COLORWORDS)if(re.test(n)){d.c1=c;break}
  return d}
 return null}

/* ---------- materials & textures ---------- */
const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:0},o));
const lum=h=>{const c=new T.Color(h);return .3*c.r+.59*c.g+.11*c.b};
const texCache=new Map();
function fitText(c,t,maxW,size,weight){let s=size;do{c.font=`${weight} ${s}px ${FONT}`;if(c.measureText(t).width<=maxW)break;s-=2}while(s>14);return s}
function labelTex(p,mode){const key=[mode,p.name,p.company,p.c1,p.c2].join('|');if(texCache.has(key))return texCache.get(key);
 const W=mode==='round'?256:512,H=256,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');
 const c1=p.c1||'#e7edf1',c2=p.c2||'#3f7fae',ink=lum(c1)>.6?'#1f2b33':'#ffffff';
 c.direction='rtl';c.textAlign='center';c.textBaseline='middle';
 if(mode==='round'){c.fillStyle=c2;c.fillRect(0,0,W,H);c.fillStyle=c1;c.beginPath();c.arc(128,128,96,0,7);c.fill();c.strokeStyle=lum(c2)>.6?'#ffffff':'rgba(255,255,255,.6)';c.lineWidth=6;c.beginPath();c.arc(128,128,108,0,7);c.stroke();
  c.fillStyle=ink;const t=(p.company||p.name||'').slice(0,14);fitText(c,t,170,46,500);c.fillText(t,128,128)}
 else{c.fillStyle=c1;c.fillRect(0,0,W,H);c.fillStyle=c2;c.fillRect(0,0,W,46);c.fillRect(0,H-36,W,36);
  c.globalAlpha=.18;c.beginPath();c.arc(W*.82,H*.55,70,0,7);c.fill();c.globalAlpha=1;
  c.fillStyle=ink;const nm=(p.name||'').slice(0,22);fitText(c,nm,W-60,58,500);c.fillText(nm,W/2,H*.47);
  if(p.company){c.fillStyle=lum(c2)>.6?'#1f2b33':'#ffffff';fitText(c,p.company,W-80,28,500);c.fillText(p.company,W/2,23)}
  if(p.info){c.fillStyle=lum(c2)>.6?'#1f2b33':'#ffffff';fitText(c,p.info,W-80,22,400);c.fillText(p.info,W/2,H-18)}}
 const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;texCache.set(key,tx);return tx}
function clearTex(){texCache.forEach(t=>t.dispose());texCache.clear()}

/* ---------- shared geometry ---------- */
const lathe=(pts,seg=24)=>new T.LatheGeometry(pts.map(([x,y])=>new T.Vector2(x,y)),seg);
const G={
 cyl:new T.CylinderGeometry(.5,.5,1,32,1,false),cylO:new T.CylinderGeometry(.5,.5,1,32,1,true),cone:new T.ConeGeometry(.5,1,20),
 sph:new T.SphereGeometry(.5,28,20),box:new T.BoxGeometry(1,1,1),ico:new T.IcosahedronGeometry(.5,1),cap:new T.CapsuleGeometry(.5,1,8,16),
 cupT:new T.CylinderGeometry(.5,.4,1,28,1,true),torus:new T.TorusGeometry(.5,.08,8,24),halfS:new T.SphereGeometry(.5,28,14,0,Math.PI*2,0,Math.PI/2),
 onion:lathe([[0,0],[.18,.01],[.32,.08],[.38,.2],[.36,.33],[.26,.46],[.12,.56],[.05,.64],[0,.68]]),
 garlic:lathe([[0,0],[.2,.01],[.3,.07],[.32,.17],[.26,.29],[.14,.38],[.05,.45],[0,.5]],14),
 pear:lathe([[0,0],[.2,.02],[.3,.13],[.3,.27],[.22,.42],[.16,.55],[.12,.66],[0,.72]]),
 egg:lathe([[0,0],[.12,.01],[.18,.07],[.2,.15],[.18,.24],[.12,.31],[0,.34]],16),
 bottle:lathe([[0,0],[.33,0],[.4,.06],[.4,1.25],[.34,1.5],[.16,1.86],[.13,1.95],[0,1.95]],28),
 squeeze:lathe([[0,0],[.13,0],[.15,.05],[.15,.18],[.27,.28],[.31,.45],[.31,1.12],[.24,1.34],[.1,1.4],[0,1.4]],24),
 eggplant:lathe([[0,0],[.18,.04],[.25,.22],[.26,.45],[.2,.75],[.13,.95],[.07,1.08],[0,1.12]]),
 squash:lathe([[0,0],[.14,.03],[.18,.2],[.18,.9],[.14,1.08],[.06,1.16],[0,1.17]],18),
 pepper:lathe([[0,0],[.22,.02],[.34,.12],[.38,.3],[.38,.5],[.33,.66],[.2,.72],[.06,.74],[0,.73]],20)
};
{const g=new T.SphereGeometry(.5,20,14),p=g.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=1+.09*Math.sin(v.x*9)*Math.cos(v.y*7)+.06*Math.sin(v.z*11);v.multiplyScalar(n);p.setXYZ(i,v.x,v.y,v.z)}g.computeVertexNormals();G.potato=g}
{const g=G.pepper,p=g.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const a=Math.atan2(v.z,v.x);const k=1+.08*Math.cos(a*4)*Math.min(1,v.y*2);p.setXYZ(i,v.x*k,v.y,v.z*k)}g.computeVertexNormals()}
{const s=new T.Shape();s.moveTo(-.5,0);s.lineTo(.5,0);s.lineTo(0,.5);s.lineTo(-.5,0);G.roof=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});G.roof.translate(0,0,-.5)}
G.banana=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(-.55,.2,0),new T.Vector3(-.3,.04,0),new T.Vector3(0,0,0),new T.Vector3(.3,.04,0),new T.Vector3(.55,.22,0)]),24,.11,10,false);

function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return()=>(s=s*16807%2147483647)/2147483647}
function mesh(g,m,sx,sy,sz,x,y,z){const o=new T.Mesh(g,m);o.scale.set(sx,sy,sz);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o}

/* ---------- builders: each returns [w,h,d] ---------- */
const B={};
const tubB=(g,p,m,r,h)=>{const lab=M('#ffffff',{map:labelTex(p,'side'),roughness:.4});lab.map.repeat.set(2,1);lab.map.wrapS=T.RepeatWrapping;
 const side=new T.Mesh(new T.CylinderGeometry(r,r*.9,h*.86,32,1,true),lab);side.position.y=h*.43;side.castShadow=true;g.add(side);m.push(lab);
 const bot=M(p.c1||'#fff');m.push(bot);g.add(mesh(G.cyl,bot,r*1.8,.02,r*1.8,0,.01,0));
 const lid=M(p.c2||'#3f7fae',{roughness:.35});m.push(lid);g.add(mesh(G.cyl,lid,r*2.08,h*.12,r*2.08,0,h*.92,0));
 const top=M('#ffffff',{map:labelTex(p,'round'),roughness:.35});m.push(top);const tp=new T.Mesh(new T.CircleGeometry(r*.98,32),top);tp.rotation.x=-Math.PI/2;tp.position.y=h*.985;g.add(tp);
 return[r*2.1,h,r*2.1]};
B.tub=(g,p,m)=>tubB(g,p,m,.48,.6);B.tubS=(g,p,m)=>tubB(g,p,m,.3,.45);B.tubL=(g,p,m)=>tubB(g,p,m,.56,.72);
B.cup=(g,p,m)=>{const r=.33,h=.78;const lab=M('#ffffff',{map:labelTex(p,'side'),roughness:.4});lab.map.repeat.set(2,1);lab.map.wrapS=T.RepeatWrapping;m.push(lab);
 const s=new T.Mesh(new T.CylinderGeometry(r,r*.78,h,28,1,true),lab);s.position.y=h/2;s.castShadow=true;g.add(s);
 const foil=M(p.c2||'#2f8f5b',{metalness:.6,roughness:.3});m.push(foil);g.add(mesh(G.cyl,foil,r*2.12,.04,r*2.12,0,h+.01,0));
 const b=M(p.c1||'#fff');m.push(b);g.add(mesh(G.cyl,b,r*1.56,.02,r*1.56,0,.01,0));return[r*2.1,h+.05,r*2.1]};
B.yogurt=(g,p,m)=>{const lab=M('#ffffff',{map:labelTex(p,'side')});lab.map.repeat.set(2,1);lab.map.wrapS=T.RepeatWrapping;const foil=M(p.c2||'#e05a7a',{metalness:.5,roughness:.3});m.push(lab,foil);
 [[-.21,-.21],[.21,-.21],[-.21,.21],[.21,.21]].forEach(([x,z])=>{const s=new T.Mesh(new T.CylinderGeometry(.2,.17,.46,20,1,true),lab);s.position.set(x,.23,z);s.castShadow=true;g.add(s);g.add(mesh(G.cyl,foil,.42,.03,.42,x,.47,z))});
 const sl=M(p.c2||'#e05a7a',{roughness:.7});m.push(sl);g.add(mesh(G.box,sl,.86,.12,.86,0,.1,0));return[.86,.5,.86]};
B.block=(g,p,m)=>{const w=1,h=.36,d=.66;const lab=M('#ffffff',{map:labelTex(p,'side'),roughness:.45});const base=M(p.c1||'#f6ecce',{roughness:.45,metalness:/زبد|חמא/.test(p.name)?.25:0});m.push(lab,base);
 const b=new T.Mesh(new T.BoxGeometry(w,h,d),[base,base,lab,base,lab,base]);b.position.y=h/2;b.castShadow=true;g.add(b);return[w,h,d]};
B.carton=(g,p,m,s)=>{const w=.95*s,h=2.05*s,d=.95*s;const lab=M('#ffffff',{map:labelTex(p,'side'),roughness:.5}),plain=M(p.c1||'#fff',{roughness:.5}),c2=M(p.c2||'#2e64b0',{roughness:.4});m.push(lab,plain,c2);
 const b=new T.Mesh(new T.BoxGeometry(w,h,d),[plain,plain,plain,plain,lab,lab]);b.position.y=h/2;b.castShadow=true;g.add(b);
 const r=new T.Mesh(G.roof,plain);r.scale.set(w,.7*s,d);r.position.y=h;r.castShadow=true;g.add(r);
 g.add(mesh(G.box,plain,w*.98,.12*s,.05,0,h+.38*s,0));g.add(mesh(G.cyl,c2,.26*s,.12*s,.26*s,0,h+.2*s,d*.24));return[w,h+.44*s,d]};
B.carton2=(g,p,m)=>B.carton(g,p,m,1);B.carton1=(g,p,m)=>B.carton(g,p,m,.78);
B.bottle=(g,p,m)=>{const clear=/مي|מים|ماء|صودا|סודה/.test(p.name);const body=M(p.c1||'#cfe9c2',{transparent:true,opacity:clear?.45:.9,roughness:.15,depthWrite:!clear});m.push(body);
 const b=new T.Mesh(G.bottle,body);b.scale.set(1,1.1,1);b.castShadow=true;g.add(b);
 const lab=M('#ffffff',{map:labelTex(p,'side'),roughness:.4});lab.map.repeat.set(2,1);lab.map.wrapS=T.RepeatWrapping;m.push(lab);
 const l=new T.Mesh(G.cylO,lab);l.scale.set(.83,.55,.83);l.position.y=.75;g.add(l);
 const cap=M(p.c2||'#d42a2a',{roughness:.3});m.push(cap);g.add(mesh(G.cyl,cap,.3,.16,.3,0,2.2,0));return[.82,2.3,.82]};
B.squeeze=(g,p,m)=>{const body=M(p.c1||'#c8231f',{roughness:.3});m.push(body);const b=new T.Mesh(G.squeeze,body);b.castShadow=true;g.add(b);
 const lab=M('#ffffff',{map:labelTex(p,'side')});lab.map.repeat.set(2,1);lab.map.wrapS=T.RepeatWrapping;m.push(lab);const l=new T.Mesh(G.cylO,lab);l.scale.set(.64,.5,.64);l.position.y=.78;g.add(l);
 const cap=M(p.c2||'#fff',{roughness:.3});m.push(cap);g.add(mesh(G.cyl,cap,.32,.1,.32,0,.05,0));return[.64,1.4,.64]};
B.jar=(g,p,m)=>{const glass=M('#e8f4f8',{transparent:true,opacity:.35,roughness:.05,depthWrite:false});const fill=M(p.c1||'#b0283a',{roughness:.6});const lid=M(p.c2||'#e7d9b8',{metalness:.5,roughness:.3});m.push(glass,fill,lid);
 g.add(mesh(G.cyl,fill,.66,.66,.66,0,.34,0));g.add(mesh(G.cyl,glass,.74,.76,.74,0,.38,0));g.add(mesh(G.cyl,lid,.72,.12,.72,0,.82,0));
 const lab=M('#ffffff',{map:labelTex(p,'side')});lab.map.repeat.set(2,1);lab.map.wrapS=T.RepeatWrapping;m.push(lab);const l=new T.Mesh(G.cylO,lab);l.scale.set(.76,.34,.76);l.position.y=.36;g.add(l);return[.76,.88,.76]};
B.can=(g,p,m)=>{const flat=/تون|טונ/.test(p.name);const h=flat?.22:.5,r=flat?.42:.33;const lab=M('#ffffff',{map:labelTex(p,'side'),metalness:.2,roughness:.4});lab.map.repeat.set(2,1);lab.map.wrapS=T.RepeatWrapping;const met=M('#c9ced3',{metalness:.85,roughness:.25});m.push(lab,met);
 const s=new T.Mesh(G.cylO,lab);s.scale.set(r*2,h,r*2);s.position.y=h/2;g.add(s);g.add(mesh(G.cyl,met,r*2,.03,r*2,0,h,0));g.add(mesh(G.cyl,met,r*2,.03,r*2,0,0.01,0));const tt=mesh(G.torus,met,r*1.6,r*1.6,.4,0,h+.015,0);tt.rotation.x=Math.PI/2;g.add(tt);return[r*2,h,r*2]};
B.eggs=(g,p,m)=>{const card=M(p.c2||'#cbbd9f',{roughness:.95}),egg=M(p.c1||'#f1e2c8',{roughness:.6});m.push(card,egg);
 g.add(mesh(G.box,card,1.6,.22,.7,0,.11,0));const lid=mesh(G.box,card,1.6,.05,.7,0,.42,-.52);lid.rotation.x=-1.1;g.add(lid);
 for(let i=0;i<5;i++)for(let j=0;j<2;j++){const e=new T.Mesh(G.egg,egg);e.position.set(-.64+i*.32,.17,-.16+j*.32);e.scale.set(1.15,1.15,1.15);e.castShadow=true;g.add(e)}return[1.6,.6,.8]};
B.loaf=(g,p,m)=>{const crust=M(p.c1||'#c98d4b',{roughness:.85}),bag=M('#ffffff',{transparent:true,opacity:.28,roughness:.2,depthWrite:false});m.push(crust,bag);
 const l=mesh(G.cap,crust,.62,.5,.62,0,.3,0);l.rotation.z=Math.PI/2;l.scale.set(.55,.75,.62);g.add(l);g.add(mesh(G.box,bag,1.5,.66,.72,0,.33,0));
 const lab=M('#ffffff',{map:labelTex(p,'side')});m.push(lab);const s=new T.Mesh(new T.PlaneGeometry(.8,.4),lab);s.position.set(0,.36,.37);g.add(s);return[1.5,.66,.72]};
B.pita=(g,p,m)=>{const br=M(p.c1||'#e8c690',{roughness:.9}),bag=M('#ffffff',{transparent:true,opacity:.3,depthWrite:false});m.push(br,bag);
 for(let i=0;i<6;i++)g.add(mesh(G.cyl,br,.95,.05,.95,(i%2)*.02,.04+i*.055,0));g.add(mesh(G.box,bag,1.05,.42,1.05,0,.21,0));return[1.05,.42,1.05]};
B.bar=(g,p,m)=>{const lab=M('#ffffff',{map:labelTex(p,'side')}),base=M(p.c1||'#5a2d82');m.push(lab,base);const b=new T.Mesh(new T.BoxGeometry(.9,.12,.46),[base,base,lab,base,base,base]);b.position.y=.06;b.castShadow=true;g.add(b);return[.9,.12,.46]};
B.tray=(g,p,m,rand)=>{const tr=M('#f5f5f2',{roughness:.6}),meat=M(p.c1||'#f2c1a6',{roughness:.7}),film=M('#ffffff',{transparent:true,opacity:.22,roughness:.05,depthWrite:false});m.push(tr,meat,film);
 g.add(mesh(G.box,tr,1.25,.2,.85,0,.1,0));for(let i=0;i<3;i++){const b=mesh(G.sph,meat,.5,.18,.62,-.36+i*.36,.24,(rand()-.5)*.08);b.rotation.y=rand();g.add(b)}
 g.add(mesh(G.box,film,1.25,.04,.85,0,.33,0));const lab=M('#ffffff',{map:labelTex(p,'side')});m.push(lab);const s=new T.Mesh(new T.PlaneGeometry(.6,.3),lab);s.rotation.x=-Math.PI/2;s.position.set(.25,.36,.15);g.add(s);return[1.25,.36,.85]};
B.pack=(g,p,m,rand)=>{const meat=M(p.c1||'#c9584a',{roughness:.5}),film=M('#ffffff',{transparent:true,opacity:.3,depthWrite:false});m.push(meat,film);
 for(let i=0;i<5;i++){const s=mesh(G.cap,meat,.14,.5,.14,-.36+i*.18,.1,0);s.rotation.x=Math.PI/2;g.add(s)}g.add(mesh(G.box,film,1,.2,.6,0,.1,0));
 const lab=M('#ffffff',{map:labelTex(p,'side')});m.push(lab);const s=new T.Mesh(new T.PlaneGeometry(.7,.35),lab);s.rotation.x=-Math.PI/2;s.position.set(0,.205,0);g.add(s);return[1,.22,.6]};
B.box=(g,p,m)=>{const lab=M('#ffffff',{map:labelTex(p,'side')}),base=M(p.c1||'#dfe7ec');m.push(lab,base);const b=new T.Mesh(new T.BoxGeometry(.9,.8,.6),[base,base,base,base,lab,base]);b.position.y=.4;b.castShadow=true;g.add(b);return[.9,.8,.6]};
/* produce */
const stemM=M('#6b4a1f',{roughness:.9}),leafM=M('#4f8a3a',{roughness:.7});
B.apple=(g,p,m)=>{const a=M(p.c1||'#c8282e',{roughness:.35});m.push(a);g.add(mesh(G.sph,a,.72,.64,.72,0,.32,0));g.add(mesh(G.cyl,stemM,.04,.16,.04,0,.68,0));const l=mesh(G.sph,leafM,.18,.03,.09,.08,.68,0);l.rotation.z=.5;g.add(l);return[.72,.72,.72]};
B.orange=(g,p,m)=>{const a=M(p.c1||'#f28c1c',{roughness:.75});m.push(a);g.add(mesh(G.potato,a,.74,.72,.74,0,.36,0));g.add(mesh(G.cyl,leafM,.08,.03,.08,0,.72,0));return[.76,.74,.76]};
B.lemon=(g,p,m)=>{const a=M(p.c1||'#f5de3a',{roughness:.6});m.push(a);const b=mesh(G.sph,a,.52,.52,.7,0,.26,0);g.add(b);[-.36,.36].forEach(z=>{const c=mesh(G.cone,a,.1,.12,.1,0,.26,z);c.rotation.x=z>0?Math.PI/2:-Math.PI/2;g.add(c)});return[.55,.52,.86]};
B.banana=(g,p,m)=>{const a=M(p.c1||'#f2d03b',{roughness:.55});m.push(a);for(let i=0;i<3;i++){const b=new T.Mesh(G.banana,a);b.position.set(0,.12+i*.05,-.18+i*.18);b.rotation.y=(i-1)*.12;b.castShadow=true;g.add(b)}g.add(mesh(G.box,stemM,.12,.12,.5,-.6,.3,0));return[1.3,.5,.7]};
B.grapes=(g,p,m,rand)=>{const a=M(p.c1||'#7a3b7d',{roughness:.3});m.push(a);for(let i=0;i<22;i++){const t=i/22,y=.15+t*.55,r=.32*(1-t*.65);const ang=i*2.4;g.add(mesh(G.sph,a,.2,.2,.2,Math.cos(ang)*r*rand(),y,Math.sin(ang)*r))}g.add(mesh(G.cyl,stemM,.04,.25,.04,0,.82,0));return[.7,.9,.7]};
B.pear=(g,p,m)=>{const a=M(p.c1||'#c9cf4a',{roughness:/אבוק|افوك/.test(p.name)?.85:.4});m.push(a);g.add(mesh(G.pear,a,1.1,1,1.1,0,0,0));g.add(mesh(G.cyl,stemM,.04,.14,.04,0,.76,0));return[.68,.8,.68]};
B.berries=(g,p,m,rand)=>{const box=M('#e8f4f8',{transparent:true,opacity:.35,depthWrite:false}),a=M(p.c1||'#d8202e',{roughness:.4});m.push(box,a);g.add(mesh(G.box,box,1,.45,.75,0,.225,0));
 for(let i=0;i<10;i++){const c=mesh(G.cone,a,.2,.26,.2,-.36+(i%5)*.18,.32,-.18+Math.floor(i/5)*.34);c.rotation.x=Math.PI+(rand()-.5)*.6;g.add(c);g.add(mesh(G.cyl,leafM,.16,.03,.16,c.position.x,.46,c.position.z))}return[1,.5,.75]};
B.melon=(g,p,m)=>{const rind=M(p.c1||'#2f6b2a',{roughness:.5}),flesh=M(p.c2||'#e5413f',{roughness:.8}),white=M('#e9f1d8');m.push(rind,flesh);
 const h=new T.Mesh(G.halfS,rind);h.scale.set(1.4,1.2,1.4);h.rotation.x=Math.PI;h.position.y=.6;h.castShadow=true;g.add(h);
 g.add(mesh(G.cyl,white,1.38,.02,1.38,0,.6,0));g.add(mesh(G.cyl,flesh,1.26,.03,1.26,0,.61,0));return[1.4,.62,1.4]};
B.pomegranate=(g,p,m)=>{const a=M(p.c1||'#b3202a',{roughness:.45});m.push(a);g.add(mesh(G.sph,a,.76,.7,.76,0,.35,0));g.add(mesh(G.cyl,a,.18,.14,.18,0,.74,0));return[.76,.8,.76]};
B.tomato=(g,p,m)=>{const a=M(p.c1||'#e0483b',{roughness:.3});m.push(a);g.add(mesh(G.pepper,a,.95,.8,.95,0,0,0));for(let i=0;i<5;i++){const l=mesh(G.box,leafM,.03,.02,.16,0,.6,0);l.rotation.y=i*1.256;l.translateZ(.08);g.add(l)}g.add(mesh(G.cyl,leafM,.04,.08,.04,0,.63,0));return[.76,.64,.76]};
B.pepper=(g,p,m)=>{const a=M(p.c1||'#d6322e',{roughness:.25});m.push(a);const b=mesh(G.pepper,a,1.05,1.25,1.05,0,0,0);g.add(b);g.add(mesh(G.cyl,leafM,.14,.08,.14,0,.92,0));const s=mesh(G.cyl,leafM,.06,.2,.06,.03,1.02,0);s.rotation.z=.4;g.add(s);return[.82,1.08,.82]};
B.onion=(g,p,m)=>{const a=M(p.c1||'#d9a35f',{roughness:.6});m.push(a);g.add(mesh(G.onion,a,1.05,1,1.05,0,0,0));g.add(mesh(G.cone,M('#a9824f'),.08,.14,.08,0,.72,0));return[.8,.74,.8]};
B.garlic=(g,p,m)=>{const a=M(p.c1||'#f1ece0',{roughness:.7});m.push(a);g.add(mesh(G.garlic,a,1,1,1,0,0,0));g.add(mesh(G.cone,a,.08,.16,.08,0,.55,0));return[.64,.62,.64]};
B.potato=(g,p,m,rand)=>{const a=M(p.c1||'#c9a06a',{roughness:.9});m.push(a);const o=mesh(G.potato,a,.82,.5,.6,0,.25,0);o.rotation.y=rand()*3;g.add(o);return[.82,.5,.62]};
B.carrot=(g,p,m)=>{const a=M(p.c1||'#ec8a2c',{roughness:.6});m.push(a);const c=mesh(G.cone,a,.26,1.05,.26,0,.14,0);c.rotation.z=Math.PI/2;g.add(c);
 for(let i=0;i<3;i++){const l=mesh(G.cone,leafM,.06,.42,.06,.66,.16+(i-1)*.05,(i-1)*.06);l.rotation.z=-Math.PI/2+(i-1)*.3;g.add(l)}return[1.4,.3,.3]};
B.cucumber=(g,p,m)=>{const a=M(p.c1||'#4c8a3c',{roughness:.45});m.push(a);const c=mesh(G.cap,a,.34,.85,.34,0,.17,0);c.rotation.z=Math.PI/2;g.add(c);return[1.2,.34,.34]};
B.eggplant=(g,p,m)=>{const a=M(p.c1||'#3e1f4a',{roughness:.2});m.push(a);const e=mesh(G.eggplant,a,1,1,1,-.56,.26,0);e.rotation.z=-Math.PI/2;g.add(e);const c=mesh(G.cone,leafM,.3,.22,.3,.6,.26,0);c.rotation.z=-Math.PI/2;g.add(c);return[1.3,.52,.52]};
B.zucchini=(g,p,m)=>{const a=M(p.c1||'#6c9a3c',{roughness:.45});m.push(a);const e=mesh(G.squash,a,1,1,1,-.58,.18,0);e.rotation.z=-Math.PI/2;g.add(e);return[1.2,.36,.36]};
B.cabbage=(g,p,m)=>{const a=M(p.c1||'#a9cf7a',{roughness:.6}),b=M(p.c2||'#d9ecb8',{roughness:.6});m.push(a,b);g.add(mesh(G.sph,b,.9,.82,.9,0,.42,0));for(let i=0;i<5;i++){const l=mesh(G.halfS,a,1,.7,1,0,.3,0);l.rotation.set(.5,i*1.25,0);l.scale.set(.62,.5,.62);g.add(l)}return[1,.86,1]};
B.cauli=(g,p,m,rand)=>{const leaf=M(p.c2||'#6fa05a',{roughness:.7,side:T.DoubleSide}),cur=M(p.c1||'#f3eedc',{roughness:.9});m.push(leaf,cur);
 const c=new T.Mesh(G.cone,leaf);c.scale.set(1.3,.6,1.3);c.rotation.x=Math.PI;c.position.y=.3;g.add(c);
 for(let i=0;i<16;i++){const a=i*2.4,r=.42*Math.sqrt(i/16);g.add(mesh(G.ico,cur,.34,.3,.34,Math.cos(a)*r,.66+.12*(1-r/.42),Math.sin(a)*r))}return[1.3,.92,1.3]};
B.broccoli=(g,p,m)=>{const st=M(p.c2||'#6fa05a'),fl=M(p.c1||'#3d7a32',{roughness:.95});m.push(st,fl);g.add(mesh(G.cyl,st,.22,.45,.22,0,.22,0));for(let i=0;i<10;i++){const a=i*2.4,r=.3*Math.sqrt(i/10);g.add(mesh(G.ico,fl,.3,.26,.3,Math.cos(a)*r,.55,Math.sin(a)*r))}return[.9,.78,.9]};
B.mushroom=(g,p,m)=>{const box=M('#2b2b2b',{roughness:.7}),cap=M(p.c1||'#f3ece0',{roughness:.7}),film=M('#ffffff',{transparent:true,opacity:.25,depthWrite:false});m.push(box,cap,film);
 g.add(mesh(G.box,box,.95,.22,.7,0,.11,0));for(let i=0;i<6;i++){const h=new T.Mesh(G.halfS,cap);h.scale.set(.3,.22,.3);h.position.set(-.3+(i%3)*.3,.22,-.15+Math.floor(i/3)*.3);h.castShadow=true;g.add(h)}g.add(mesh(G.box,film,.95,.03,.7,0,.36,0));return[.95,.38,.7]};
B.lettuce=(g,p,m,rand)=>{const a=M(p.c1||'#9ccc6a',{roughness:.65,side:T.DoubleSide}),b=M(p.c2||'#c7e39a',{roughness:.65});m.push(a,b);g.add(mesh(G.ico,b,.8,.75,.8,0,.42,0));
 for(let i=0;i<7;i++){const l=new T.Mesh(G.halfS,a);l.scale.set(.6,.6,.35);l.position.set(0,.4,0);l.rotation.set(-1.2+rand()*.3,i*.9,0);l.translateZ(.22);l.castShadow=true;g.add(l)}return[1.15,.95,1.15]};
B.bunch=(g,p,m,rand)=>{const big=/سلق|סלק|سبانخ|תרד|ملوخ/.test(p.name);const a=M(p.c1||'#3f8f3a',{roughness:.7}),b=M(p.c2||'#6fb553',{roughness:.7});m.push(a,b);
 const n=big?9:7,H=big?1.2:.95;for(let i=0;i<n;i++){const s=mesh(G.cyl,b,.035,H*.55,.035,(rand()-.5)*.18,H*.27,(rand()-.5)*.18);s.rotation.z=(rand()-.5)*.25;g.add(s)}
 for(let i=0;i<(big?10:8);i++){const ang=rand()*6.3,r=.1+rand()*.18;const l=mesh(G.ico,a,big?.42:.3,big?.3:.24,big?.2:.3,Math.cos(ang)*r,H*.6+rand()*H*.35,Math.sin(ang)*r);l.rotation.set(rand(),rand(),rand());g.add(l)}
 const rb=mesh(G.torus,M('#d64545'),.2,.2,.6,0,H*.25,0);rb.rotation.x=Math.PI/2;g.add(rb);return[big?.9:.7,H,big?.9:.7]};
B.round=(g,p,m)=>{const small=/فجل|צנון|كيوي|ثوم/.test(p.name),big=/شمام|מלון/.test(p.name);const r=big?1.1:small?.45:.7;const a=M(p.c1||'#c9a06a',{roughness:.5});m.push(a);g.add(mesh(G.sph,a,r,r*.92,r,0,r*.46,0));return[r,r*.92,r]};
B.cauliflower=B.cauli;

const PRODUCE=new Set(['apple','orange','lemon','banana','grapes','pear','berries','melon','pomegranate','tomato','pepper','onion','garlic','potato','carrot','cucumber','eggplant','zucchini','cabbage','cauli','broccoli','mushroom','lettuce','bunch','round']);
function kindOf(p){let k=p.kind;if(!B[k]||k==='round'){const r=recognize(p.name);if(r&&B[r.k]&&(k==='round'||!B[k]))k=r.k}return B[k]?k:'box'}
function build(p,seed){const g=new T.Group(),mats=[];const k=kindOf(p);const size=B[k](g,p,mats,rng(seed*7919+13));
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(mt=>{if(!mats.includes(mt))mats.push(mt)})}});
 mats.forEach(mt=>{mt.userData.base={color:mt.color.getHex(),opacity:mt.opacity,transparent:mt.transparent,depthWrite:mt.depthWrite}});
 g.userData.size=size;g.userData.mats=mats;g.userData.lying=['carrot','cucumber','eggplant','zucchini','banana'].includes(k);
 if(PRODUCE.has(k)&&k!=='bunch'&&k!=='berries'&&k!=='mushroom'){const r=rng(seed*31+7);g.rotation.y=r()*6.28}
 return g}
const KINDS={tub:'علبة',tubS:'علبة صغيرة',tubL:'علبة كبيرة',cup:'كاسة',yogurt:'كاسات يوغورت',block:'قالب (زبدة/جبنة)',carton2:'كرتونة كبيرة',carton1:'كرتونة صغيرة',bottle:'قنينة',squeeze:'قنينة عصر',jar:'مرطبان',can:'علبة معدن',eggs:'كرتونة بيض',loaf:'رغيف خبز',pita:'كماج',bar:'لوح',tray:'صينية لحمة/دجاج',pack:'باكيت',box:'علبة عامة',
 apple:'تفاحة',orange:'برتقالة',lemon:'ليمونة',banana:'موز',grapes:'عنب',pear:'إجاص/أفوكادو',berries:'علبة فراولة',melon:'بطيخ',pomegranate:'رمان',tomato:'بندورة',pepper:'فلفل',onion:'بصل',garlic:'ثوم',potato:'بطاطا',carrot:'جزر',cucumber:'خيار',eggplant:'باذنجان',zucchini:'كوسا',cabbage:'ملفوف',cauli:'قرنبيط',broccoli:'بروكلي',mushroom:'فطر',lettuce:'خس',bunch:'ضمة خضرة',round:'حبّة'};
window.FM={recognize,build,KINDS,clearTex,kindOf,norm};
})();
