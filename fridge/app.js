{
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>(Math.round(n*100)/100).toFixed(2)+' ₪';
const pad=n=>String(n).padStart(2,'0');
const fmtD=ms=>{const d=new Date(ms);return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()};
const fmtDT=ms=>{const d=new Date(ms);return fmtD(ms)+' '+pad(d.getHours())+':'+pad(d.getMinutes())};
const toastEl=$('#toast');let tt;
const toast=m=>{toastEl.textContent=m;toastEl.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('on'),2800)};
const okHex=h=>/^#[0-9a-f]{3,8}$/i.test(h||'');

const ZONES=[
 {k:'shelf1',t:'رف ١'},{k:'shelf2',t:'رف ٢'},{k:'shelf3',t:'رف ٣'},{k:'chiller',t:'درج التبريد'},
 {k:'crisperL',t:'خضرة يسار'},{k:'crisperR',t:'خضرة يمين'},
 {k:'door1',t:'باب – رف ١'},{k:'door2',t:'باب – رف ٢'},{k:'door3',t:'باب – رف ٣'},{k:'door4',t:'باب – رف ٤'},{k:'doorB',t:'باب – القناني'}];
const ZT=Object.fromEntries(ZONES.map(z=>[z.k,z.t]));
const PLACES=[...ZONES,{k:'house',t:'قائمة البيت (برّا الثلاجة)'},{k:'cartonly',t:'السلة بس'}];
const PT=Object.fromEntries(PLACES.map(z=>[z.k,z.t]));

const DEFAULTS=[
 ['p01','حمص','צבר','',11.9,'shelf1','tub',1,'#efe1c0','#c9493b'],['p02','لبنة 500 غ 5%','תנובה','',13.5,'shelf1','tubL',1,'#ffffff','#2d6db5'],
 ['p03','زبدة لورباك حمراء','Lurpak','',12.9,'shelf1','block',1,'#f6ecce','#c7333c'],['p04','חצילים – حجم وسط','البستان','',10.9,'shelf1','tub',1,'#e9e2d6','#6e4a86'],
 ['p05','شمنيت صغيرة','תנובה','',4.9,'shelf1','tubS',4,'#ffffff','#4b8fd6'],['p06','كوتج 5%','תנובה','',6.9,'shelf1','tub',1,'#ffffff','#1f5fa8'],
 ['p07','جبنة صفراء 300 غ','עמק','',22.9,'shelf1','block',1,'#f2c84f','#2f7a47'],['p08','جبنة عربية','جبارين','',27.9,'shelf1','tubL',1,'#fbf9f2','#3a8b5c'],
 ['p09','لبن الحفيد','الحفيد','صناعة فلسطينية',7.5,'shelf1','cup',2,'#ffffff','#2f8f5b'],['p10','بصل','','السعر للكيلو',4.9,'chiller','onion',3,'#d9a35f','#b9813e'],
 ['p11','ثوم','','',3.9,'chiller','garlic',1,'#f1ece0','#d8cfbd'],['p12','بقدونس','','ضمة',3,'chiller','bunch',1,'#3f8f3a','#6fb553'],
 ['p13','نعنع','','ضمة',3,'chiller','bunch',1,'#2f7d4a','#59a66a'],['p14','خس','','',5.9,'chiller','lettuce',1,'#9ccc6a','#c7e39a'],
 ['p15','جرجير','','ضمة',3.5,'chiller','bunch',1,'#3c7f2f','#5f9e43'],['p16','ريحان','','ضمة',4,'chiller','bunch',1,'#3a8a43','#4fa65a'],
 ['p17','بصل أخضر','','ضمة',3,'chiller','bunch',1,'#5aa548','#eef3df'],['p18','بطاطا','','السعر للكيلو',3.9,'crisperR','potato',4,'#c9a06a','#a9824f'],
 ['p19','جزر','','السعر للكيلو',4.5,'crisperR','carrot',4,'#ec8a2c','#5f9e43'],['p20','قرنبيط','','',8.9,'crisperR','cauli',1,'#f3eedc','#6fa05a'],
 ['p21','بندورة','','السعر للكيلو',5.9,'crisperL','tomato',4,'#e0483b','#4f8a3a'],['p22','خيار','','السعر للكيلو',4.9,'crisperL','cucumber',4,'#4c8a3c','#6aa752'],
 ['p23','فلفل رومي أحمر','','',2.5,'crisperL','pepper',2,'#d6322e','#3f7d31'],['p24','فلفل رومي أصفر','','',2.5,'crisperL','pepper',1,'#f1c232','#3f7d31'],
 ['p25','فلفل رومي أخضر غامق','','',2,'crisperL','pepper',2,'#2f6b2a','#3f7d31'],['p26','فلفل رومي أخضر فاتح','','',2,'crisperL','pepper',2,'#8cc152','#3f7d31'],
 ['p27','حليب 2 لتر','תנובה','',8.9,'doorB','carton2',3,'#ffffff','#2e64b0'],['p28','لبن','תנובה','',7.2,'doorB','carton1',1,'#ffffff','#3aa0d8']
].map((a,i)=>({id:a[0],name:a[1],company:a[2],info:a[3],price:a[4],zone:a[5],kind:a[6],qty:a[7],c1:a[8],c2:a[9],place:'باقة الغربية',order:i}));
const HOUSE_DEF=['خبز','بيض','رز','سكر','طحين','زيت زيتون','زيت قلي','ملح','قهوة','شاي','عدس','معكرونة','ورق تواليت','محارم','سائل جلي','مسحوق غسيل','أكياس زبالة','شامبو','صابون']
 .map((n,i)=>({id:'h'+pad(i+1),name:n,zone:'house',kind:'box',qty:1,have:true,order:100+i,company:'',info:'',price:null,place:''}));

const S={products:{},cart:{},lists:{},note:'',buyer:'',photos:[null,null,null,null,null,null],tab:'fridge',cartView:'open',zone:null,sel:null,open:true,houseOut:null,editing:null,openBill:null};
let db=null,user=null,sample=null,sampleImg=false,local=true;
const ME={name:'',code:''};
S.members={};S.feed=[];S.noteBy='';S.photoBy=[];S.rc={};

/* ---------- storage ---------- */
const LS='fridge-local-v2';
function loadLocal(){let d=null;try{d=JSON.parse(localStorage.getItem(LS))}catch(e){}
 if(!d){d={products:{},cart:{},lists:{},note:'خبز للفطور\nاتصلوا على أبو محمد بخصوص الغاز',buyer:'',photos:[null,null,null,null,null,null]};[...DEFAULTS,...HOUSE_DEF].forEach(p=>d.products[p.id]=p)}
 Object.assign(S,d);S.lists=S.lists||{}}
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify({products:S.products,cart:S.cart,lists:S.lists,note:S.note,buyer:S.buyer,photos:S.photos}))}catch(e){}}
const newId=p=>(p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function fail(e){if(e&&e.code==='invalid_argument')toast('ما عندك صلاحية تعديل — اطلبوا من صاحب الصفحة يضيفكم كـ Editor');else if(e&&e.code==='quota_exceeded')toast('المساحة امتلأت، احذفوا أشياء قديمة');else toast('ما زبط الحفظ، جرّبوا كمان مرة')}
async function put(col,obj){obj={...obj,ub:ME.name||'',ut:Date.now()};S[col==='products'?'products':col==='cart'?'cart':'lists'][obj.id]=obj;if(local){saveLocal();refresh()}else{try{await db.collection(col).doc(obj.id).set(obj)}catch(e){fail(e)}}}
async function del(col,id){delete S[col==='products'?'products':col==='cart'?'cart':'lists'][id];if(local){saveLocal();refresh()}else{try{await db.collection(col).doc(id).delete()}catch(e){fail(e)}}}
const putProduct=p=>put('products',p),putCart=c=>put('cart',c),putList=l=>put('lists',l);
async function delProduct(id){await del('products',id);if(S.cart[id])await del('cart',id)}
async function putState(k,obj){obj={...obj,by:ME.name||'',at:Date.now()};if(local){Object.assign(S,k==='note'?{note:obj.text}:k==='meta'?{buyer:obj.buyer}:{photos:obj.list});saveLocal();refresh()}else{try{await db.doc('state/'+k).set(obj)}catch(e){fail(e)}}}
const meId=async()=>ME.name||null;
async function logA(t){if(local||!db)return;try{await db.collection('log').add({who:ME.name,what:String(t).slice(0,120),at:Date.now()})}catch(e){}}

/* ---------- 3D scene ---------- */
const stage=$('#stage');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
stage.prepend(renderer.domElement);
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,0.1,200);
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches};
scene.add(new THREE.HemisphereLight(0xffffff,0xd8d2c8,1.5));
const sun=new THREE.DirectionalLight(0xffffff,1.7);sun.position.set(-8,22,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0004;
Object.assign(sun.shadow.camera,{left:-14,right:14,top:22,bottom:-4});scene.add(sun);
const inLight=new THREE.PointLight(0xfff6e8,22,18,1.5);inLight.position.set(0,11.6,1.8);scene.add(inLight);
const inLight2=new THREE.PointLight(0xfff6e8,10,10,1.5);inLight2.position.set(0,4.2,2.4);scene.add(inLight2);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0xe9e3da,roughness:1}));
floor.rotation.x=-Math.PI/2;floor.position.y=-0.6;floor.receiveShadow=true;scene.add(floor);
function setBg(){scene.background=new THREE.Color(isDark()?0x151a1f:0xf4f1ec);floor.material.color.set(isDark()?0x1c2329:0xe9e3da)}
const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.55,metalness:0},o));
const shellM=M(0xf7f7f5,{roughness:.32}),innerM=M(0xf1f5f8,{roughness:.7}),trimM=M(0xd9dee2,{roughness:.3,metalness:.4});
const glassM=M(0xcfe6f1,{transparent:true,opacity:.26,roughness:.08,depthWrite:false});
const drawerM=M(0xe2f0f6,{transparent:true,opacity:.2,roughness:.08,depthWrite:false,side:THREE.DoubleSide});
const hitM=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
function rbox(w,h,d,r,m){const s=new THREE.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:3,curveSegments:8});g.center();
 const mesh=new THREE.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;return mesh}
function box(w,h,d,m,x,y,z,parent){const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=b.receiveShadow=!m.transparent;(parent||scene).add(b);return b}
box(0.3,18,7,shellM,-3.85,9,0);box(0.3,18,7,shellM,3.85,9,0);box(8,18,0.3,innerM,0,9,-3.35);
box(8,0.3,7,shellM,0,17.85,0);box(8,0.45,7,shellM,0,0.22,0);box(8,0.5,7,shellM,0,13.2,0);box(7.4,12.6,0.05,innerM,0,6.8,-3.18);
box(7.6,0.6,6.4,M(0xb9bfc4),0,-0.3,-0.2);
const strip=M(0xfff4dc,{emissive:0xfff0d0,emissiveIntensity:.9});box(0.08,9,0.08,strip,-3.66,7.5,2.6);box(0.08,9,0.08,strip,3.66,7.5,2.6);
const SH={shelf1:9.95,shelf2:7.25,shelf3:4.55};
for(const k in SH){box(7.4,0.08,5.7,glassM,0,SH[k],-0.3);box(7.4,0.16,0.12,trimM,0,SH[k],2.58)}
box(7.3,0.06,5.6,drawerM,0,2.92,0.1);box(7.3,1.25,0.06,drawerM,0,3.5,2.9);box(0.06,1.25,5.6,drawerM,-3.62,3.5,0.1);box(0.06,1.25,5.6,drawerM,3.62,3.5,0.1);box(7.3,0.2,0.1,trimM,0,4.15,2.95);
const hpC=document.createElement('canvas');hpC.width=1024;hpC.height=64;{const c=hpC.getContext('2d');c.fillStyle='#f7f8f8';c.fillRect(0,0,1024,64);c.fillStyle='#4d5a63';c.font='500 28px sans-serif';c.textAlign='center';c.fillText('HumidityControl',512,42);
 [130,760].forEach(x=>{c.strokeStyle='#4f8fc9';c.lineWidth=3;c.strokeRect(x,14,34,36);c.fillStyle='#5b6670';for(let i=0;i<3;i++)c.fillRect(x+44,18+i*11,150,5)})}
const hpT=new THREE.CanvasTexture(hpC);hpT.colorSpace=THREE.SRGBColorSpace;box(7.4,0.42,0.14,new THREE.MeshStandardMaterial({map:hpT,roughness:.6}),0,2.62,3.2);
[-1.85,1.85].forEach(x=>{box(3.5,0.06,5.6,drawerM,x,0.5,0.2);box(3.5,2.0,0.06,drawerM,x,1.48,3.0);box(0.06,2.0,5.6,drawerM,x-1.75,1.48,0.2);box(0.06,2.0,5.6,drawerM,x+1.75,1.48,0.2);box(1.1,0.16,0.08,trimM,x,0.75,3.05)});
{const basket=new THREE.Group(),bm=M(0xf2b8c6,{roughness:.8});const add=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bm);m.position.set(x,y,z);m.castShadow=true;basket.add(m)};
 add(2.6,.08,1.8,0,.04,0);add(2.6,.8,.06,0,.45,.9);add(2.6,.8,.06,0,.45,-.9);add(.06,.8,1.8,1.3,.45,0);add(.06,.8,1.8,-1.3,.45,0);
 for(let i=0;i<5;i++)add(.3,.06,1.82,-1+i*.5,.6,0);basket.position.set(1.8,SH.shelf3+.04,0.4);scene.add(basket)}
const fDoor=new THREE.Group();fDoor.position.set(4,13.45,3.5);scene.add(fDoor);
const fd=rbox(7.96,4.45,0.6,0.35,shellM);fd.position.set(-3.98,2.22,0.35);fDoor.add(fd);
const door=new THREE.Group();door.position.set(4,0,3.5);scene.add(door);
const dd=rbox(7.96,13.1,0.6,0.35,shellM);dd.position.set(-3.98,6.55,0.35);door.add(dd);box(7.2,12.3,0.06,innerM,-3.98,6.55,-0.02,door);
const handleM=M(0xcfd5da,{roughness:.25,metalness:.6});
const hd1=box(0.18,3.4,0.25,handleM,-7.55,10.5,0.82,door),hd2=box(0.18,2.2,0.25,handleM,-7.55,1.2,0.82,fDoor);hd1.userData.handle=hd2.userData.handle=1;
const DOORY={door1:10.3,door2:8.4,door3:6.5,door4:4.6,doorB:0.75};
for(const k in DOORY){const y=DOORY[k],tall=k==='doorB';box(6.8,0.08,1.25,innerM,-3.98,y,-0.68,door);
 box(6.8,tall?1.1:0.55,0.06,drawerM,-3.98,y+(tall?0.55:0.28),-1.3,door);box(6.8,0.08,0.08,trimM,-3.98,y+(tall?1.1:0.55),-1.3,door)}
const ZG={shelf1:{y:SH.shelf1+.04,x0:-3.5,x1:3.5,z0:-2.9,z1:2.3,h:2.5},shelf2:{y:SH.shelf2+.04,x0:-3.5,x1:3.5,z0:-2.9,z1:2.3,h:2.5},
 shelf3:{y:SH.shelf3+.04,x0:-3.5,x1:0.3,z0:-2.9,z1:2.3,h:2.5},chiller:{y:2.96,x0:-3.5,x1:3.5,z0:-2.4,z1:2.7,h:1.15},
 crisperL:{y:0.54,x0:-3.5,x1:-0.2,z0:-2.4,z1:2.85,h:1.9},crisperR:{y:0.54,x0:0.2,x1:3.5,z0:-2.4,z1:2.85,h:1.9}};
for(const k in DOORY)ZG[k]={y:DOORY[k]+.04,x0:-7.25,x1:-0.75,z0:-1.22,z1:-0.12,h:k==='doorB'?2.8:1.7,door:1};
const zoneHits=[];
for(const k in ZG){const g=ZG[k];const m=new THREE.Mesh(new THREE.BoxGeometry(g.x1-g.x0,g.h,g.z1-g.z0),hitM);m.position.set((g.x0+g.x1)/2,g.y+g.h/2,(g.z0+g.z1)/2);m.userData.zone=k;(g.door?door:scene).add(m);zoneHits.push(m)}
/* photos & papers */
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.userData={c};return t}
const FONT='"IBM Plex Sans Arabic",Rubik,sans-serif';
function placeholder(i){return canvasTex(256,320,(c,w,h)=>{c.fillStyle=['#dcebf3','#f3e4dc','#e3eedf','#efe6f3','#f4efdc','#dfeef0'][i];c.fillRect(0,0,w,h);
 c.strokeStyle='rgba(60,80,95,.35)';c.lineWidth=6;c.beginPath();c.arc(w/2,h/2-14,34,0,7);c.moveTo(w/2-16,h/2-14);c.lineTo(w/2+16,h/2-14);c.moveTo(w/2,h/2-30);c.lineTo(w/2,h/2+2);c.stroke();
 c.fillStyle='rgba(60,80,95,.6)';c.font='500 26px '+FONT;c.textAlign='center';c.direction='rtl';c.fillText('صورة '+(i+1),w/2,h/2+58)})}
const photoSlots=[];
[[fDoor,-6.4,2.3],[fDoor,-3.98,2.3],[fDoor,-1.55,2.3],[door,-6.4,11.2],[door,-3.98,11.2],[door,-1.55,11.2]].forEach(([par,x,y],i)=>{const g=new THREE.Group();g.position.set(x,y,0.72);g.rotation.z=[.04,-.03,.05,-.05,.02,-.04][i];par.add(g);
 const fr=new THREE.Mesh(new THREE.BoxGeometry(2.05,2.6,0.04),M(0xffffff,{roughness:.8}));fr.castShadow=true;g.add(fr);
 const pm=new THREE.MeshStandardMaterial({map:placeholder(i),roughness:.7});const pic=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.25),pm);pic.position.set(0,0.08,0.025);g.add(pic);
 const mag=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.08,20),M([0xe2775c,0x3f7fae,0x8cc152,0xf1c232,0xb9a0d6,0x5bb7b2][i]));mag.rotation.x=Math.PI/2;mag.position.set(0,1.18,.06);g.add(mag);
 fr.userData.photo=i;pic.userData.photo=i;photoSlots.push({pm,url:null})});
const noteTex=canvasTex(512,640,()=>{}),listTex=canvasTex(400,540,()=>{});
const noteMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.5,4.4),new THREE.MeshStandardMaterial({map:noteTex,roughness:.9}));noteMesh.position.set(-5.2,6.4,0.73);noteMesh.rotation.z=.03;noteMesh.userData.note=1;door.add(noteMesh);
const listMesh=new THREE.Mesh(new THREE.PlaneGeometry(2.6,3.5),new THREE.MeshStandardMaterial({map:listTex,roughness:.9}));listMesh.position.set(-1.8,6.8,0.73);listMesh.rotation.z=-.04;listMesh.userData.house=1;door.add(listMesh);
[[-5.2,8.55,0xe2775c],[-1.8,8.5,0x3f7fae]].forEach(([x,y,c])=>{const mag=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.08,20),M(c));mag.rotation.x=Math.PI/2;mag.position.set(x,y,.78);door.add(mag)});
function wrapLines(c,text,maxW){const out=[];String(text||'').split('\n').forEach(par=>{let line='';par.split(' ').forEach(w=>{const t=line?line+' '+w:w;if(c.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t});out.push(line)});return out}
function drawNote(){const c=noteTex.userData.c.getContext('2d'),W=512,H=640;c.fillStyle='#fff6cf';c.fillRect(0,0,W,H);c.strokeStyle='#efdf9f';c.lineWidth=2;
 for(let y=120;y<H;y+=46){c.beginPath();c.moveTo(20,y);c.lineTo(W-20,y);c.stroke()}
 c.direction='rtl';c.textAlign='right';c.fillStyle='#5b4b22';c.font='500 40px '+FONT;c.fillText('ملاحظات',W-34,72);
 c.font='31px '+FONT;c.fillStyle='#3a3326';wrapLines(c,S.note||'اكتبوا هون…',W-70).slice(0,11).forEach((l,i)=>c.fillText(l,W-34,112+i*46));noteTex.needsUpdate=true}
const byOrder=(a,b)=>(a.order??0)-(b.order??0)||String(a.name).localeCompare(String(b.name));
function drawList(){const c=listTex.userData.c.getContext('2d'),W=400,H=540;c.fillStyle='#ffffff';c.fillRect(0,0,W,H);c.fillStyle='#dcebf3';c.fillRect(0,0,W,86);
 c.direction='rtl';c.textAlign='right';c.fillStyle='#24506f';c.font='500 34px '+FONT;c.fillText('قائمة البيت',W-26,56);
 const hs=Object.values(S.products).filter(p=>p.zone==='house').sort(byOrder);c.font='27px '+FONT;
 hs.slice(0,10).forEach((p,i)=>{const y=128+i*41;c.strokeStyle='#8aa1b1';c.lineWidth=3;c.strokeRect(W-58,y-24,26,26);if(p.have){c.strokeStyle='#3f8a62';c.beginPath();c.moveTo(W-53,y-12);c.lineTo(W-46,y-4);c.lineTo(W-36,y-20);c.stroke()}
  c.fillStyle=p.have?'#24323c':'#c0563f';c.fillText(String(p.name).slice(0,16),W-72,y)});listTex.needsUpdate=true}

/* ---------- items ---------- */
const itemsRoot=new THREE.Group(),doorItems=new THREE.Group();scene.add(itemsRoot);door.add(doorItems);
let unitMeshes=[];
const plus=new THREE.Sprite(new THREE.SpriteMaterial({map:canvasTex(128,128,c=>{c.fillStyle='#2b86c5';c.beginPath();c.arc(64,64,58,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=12;c.lineCap='round';c.beginPath();c.moveTo(64,34);c.lineTo(64,94);c.moveTo(34,64);c.lineTo(94,64);c.stroke()}),depthTest:false}));
plus.scale.set(.85,.85,1);plus.renderOrder=10;plus.visible=false;scene.add(plus);
const openQty=id=>S.cart[id]?(S.cart[id].qty||1):0;
const listQty=id=>Object.values(S.lists).filter(l=>l.status==='tobuy').reduce((a,l)=>a+(l.items||[]).filter(i=>i.id===id).reduce((b,i)=>b+(i.qty||1),0),0);
const missQty=id=>openQty(id)+listQty(id);
function disposeTree(o){o.traverse(x=>{if(x.isMesh){(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>{if(m&&m!==hitM&&m.dispose)m.dispose()})}})}
function buildItems(){[itemsRoot,doorItems].forEach(r=>{while(r.children.length){const o=r.children.pop();disposeTree(o)}});unitMeshes=[];
 const byZone={};Object.values(S.products).filter(p=>ZG[p.zone]).sort(byOrder).forEach(p=>(byZone[p.zone]=byZone[p.zone]||[]).push(p));
 let seed=1;
 for(const z in byZone){const g=ZG[z];const units=[];byZone[z].forEach(p=>{const n=Math.max(1,Math.min(10,p.qty||1)),miss=Math.min(n,missQty(p.id));for(let i=0;i<n;i++)units.push({p,ghost:i>=n-miss})});
  let x=g.x1,zc=g.z1,rowD=0;const gap=.07;
  units.forEach(u=>{const m=FM.build(u.p,seed++);let[w,h,d]=m.userData.size;
   const sc=Math.min(1,(g.h-.05)/h,(g.x1-g.x0)/w,(g.z1-g.z0)/d);if(sc<1){m.scale.setScalar(sc);w*=sc;h*=sc;d*=sc;m.userData.size=[w,h,d]}
   const rot=Math.abs(Math.sin(m.rotation.y));const ew=w*(1-rot)+d*rot,ed=d*(1-rot)+w*rot;
   if(x-ew<g.x0&&x<g.x1){x=g.x1;zc-=rowD+gap;rowD=0}
   if(zc-ed<g.z0-0.01){zc=g.z1-0.12;x=g.x1-0.25}
   m.position.set(x-ew/2,g.y,zc-ed/2);x-=ew+gap;rowD=Math.max(rowD,ed);
   m.userData.pid=u.p.id;m.userData.ghost=u.ghost;m.userData.zone=z;
   if(u.ghost)m.userData.mats.forEach(mt=>{mt.transparent=true;mt.opacity=.16;mt.depthWrite=false});
   m.traverse(o=>{if(o.isMesh)o.userData.unit=m});(g.door?doorItems:itemsRoot).add(m);unitMeshes.push(m)})}
 paintSel()}
const SEL=new THREE.Color('#9ed6f7'),EMI=new THREE.Color('#3d93c9');
function paintSel(){let target=null;unitMeshes.forEach(m=>{const on=m.userData.pid===S.sel;m.userData.mats.forEach(mt=>{const b=mt.userData.base;
  if(on){mt.color.copy(SEL);mt.emissive.copy(EMI);mt.emissiveIntensity=.28}else{mt.color.setHex(b.color);mt.emissive.setHex(0)}});
  if(on&&(!target||!m.userData.ghost))target=m});plus.visible=!!target;placePlus()}
function placePlus(){const m=unitMeshes.find(m=>m.userData.pid===S.sel&&!m.userData.ghost)||unitMeshes.find(m=>m.userData.pid===S.sel);if(!m)return;
 const v=new THREE.Vector3(0,m.userData.size[1]/(m.scale.y||1)+.55,0);m.localToWorld(v);plus.position.copy(v)}

/* ---------- camera ---------- */
const view={t:new THREE.Vector3(0.6,8,0),d:34,az:0.28,el:0.2},cur={t:new THREE.Vector3(0.6,8,0),d:36,az:0.28,el:0.2};let userAz=0,userZoom=1;
const doorAng={v:1.95,target:1.95};
function fitDist(b){const a=camera.aspect,f=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));return Math.max(b.h/2/f,b.w/2/(f*a))}
function setView(){userAz=0;userZoom=1;
 if(S.zone&&S.open){const g=ZG[S.zone];const c=new THREE.Vector3((g.x0+g.x1)/2,g.y+Math.min(g.h,1.6)/2,(g.z0+g.z1)/2);
  if(g.door){const ang=doorAng.target;view.t.copy(c.clone().applyAxisAngle(new THREE.Vector3(0,1,0),ang).add(door.position));view.az=ang-Math.PI-0.05;view.el=0.22}
  else{view.t.copy(c);view.az=0.06;view.el=g.y>8?0.08:g.y>4?0.3:g.y>2?0.5:0.62}
  view.d=fitDist({w:(g.x1-g.x0)+3.2,h:g.h+2})}
 else if(S.open){view.t.set(1.2,8.2,1.2);view.az=0.32;view.el=0.14;view.d=fitDist({w:15,h:19.5})}
 else{view.t.set(0,8.8,2);view.az=0.12;view.el=0.08;view.d=fitDist({w:11.5,h:21.5})}
 $('#hint').style.display=S.zone?'none':''}
function frame(){requestAnimationFrame(frame);
 doorAng.v+=(doorAng.target-doorAng.v)*0.12;door.rotation.y=doorAng.v;const li=Math.min(1,doorAng.v/1.2);inLight.intensity=22*li;inLight2.intensity=10*li;
 const k=0.1;cur.t.lerp(view.t,k);cur.d+=(view.d*userZoom-cur.d)*k;cur.az+=(view.az+userAz-cur.az)*k;cur.el+=(view.el-cur.el)*k;
 camera.position.set(cur.t.x+Math.sin(cur.az)*Math.cos(cur.el)*cur.d,cur.t.y+Math.sin(cur.el)*cur.d,cur.t.z+Math.cos(cur.az)*Math.cos(cur.el)*cur.d);camera.lookAt(cur.t);
 if(plus.visible)placePlus();renderer.render(scene,camera)}
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();setView()}
new ResizeObserver(resize).observe(stage);

/* ---------- input ---------- */
const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();let down=null,pinch=null;const pts=new Map();const cv=renderer.domElement;
cv.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===1)down={x:e.clientX,y:e.clientY,az:userAz,moved:false};
 if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:userZoom}}});
cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&pts.size===2){const[a,b]=[...pts.values()];userZoom=THREE.MathUtils.clamp(pinch.z*pinch.d/Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),.5,1.5);if(down)down.moved=true;return}
 if(down){const dx=e.clientX-down.x;if(Math.abs(dx)+Math.abs(e.clientY-down.y)>7)down.moved=true;if(down.moved)userAz=THREE.MathUtils.clamp(down.az-dx*0.006,-0.7,0.7)}});
cv.addEventListener('pointerup',e=>{const wasTap=down&&!down.moved&&pts.size===1;pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(wasTap)tap(e);if(!pts.size)down=null});
cv.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);down=null;pinch=null});
cv.addEventListener('wheel',e=>{e.preventDefault();userZoom=THREE.MathUtils.clamp(userZoom*(e.deltaY>0?1.08:.93),.5,1.5)},{passive:false});
const extra=[];scene.traverse(o=>{if(o.isMesh&&(o.userData.photo!==undefined||o.userData.note||o.userData.house||o.userData.handle))extra.push(o)});
function tap(e){const r=cv.getBoundingClientRect();ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ptr,camera);
 if(plus.visible&&ray.intersectObject(plus).length){addToCart(S.sel);return}
 const objs=[];if(S.open)unitMeshes.forEach(u=>u.traverse(o=>{if(o.isMesh)objs.push(o)}));
 const hi=ray.intersectObjects(objs,false)[0];if(hi){const u=hi.object.userData.unit;select(u.userData.pid,u.userData.zone);return}
 const h=ray.intersectObjects(S.open?[...extra,...zoneHits]:extra,false)[0];
 if(!h){if(S.sel){S.sel=null;paintSel();renderSheet()}return}
 const d=h.object.userData;if(d.handle)return toggleDoor();if(d.photo!==undefined)return pickPhoto(d.photo);if(d.note)return go('note');if(d.house)return go('house');if(d.zone)openZone(d.zone)}

/* ---------- actions ---------- */
function toggleDoor(){S.open=!S.open;doorAng.target=S.open?1.95:0;if(!S.open){S.zone=null;S.sel=null;paintSel()}$('#doorBtn').textContent=S.open?'سكّر الثلاجة':'افتح الثلاجة';
 $('#chips').style.display=S.open?'flex':'none';$('#hint').textContent=S.open?'اكبس على أي غرض ناقص، بيصير أزرق، وبعدين اكبس + لتحطه بالسلة':'اكبس على صورة لتغييرها، أو على ورقة الملاحظات';renderChips();setView();renderSheet()}
$('#doorBtn').onclick=toggleDoor;
function openZone(z){if(!S.open)toggleDoor();if(S.sel&&S.products[S.sel]?.zone!==z){S.sel=null;paintSel()}S.zone=z;S.tab='fridge';syncNav();setView();renderChips();renderSheet()}
function select(pid,zone){S.sel=S.sel===pid?null:pid;if(zone&&S.zone!==zone){S.zone=zone;setView();renderChips()}S.tab='fridge';syncNav();paintSel();renderSheet()}
async function addToCart(pid,n=1){const p=S.products[pid];if(!p)return;const c=S.cart[pid];const qty=(c?(c.qty||1):0)+n;
 await putCart({id:pid,name:p.name,qty,by:c?.by||await meId(),at:c?.at||Date.now()});toast('انضاف للسلة: '+p.name+(qty>1?' ×'+qty:''));logA('حطّ «'+p.name+'» بالسلة');S.sel=null;paintSel();renderSheet()}

/* ---------- prices ---------- */
const placeKey=pl=>String(pl||'').trim().replace(/[^\p{L}\p{N} ]/gu,'').replace(/\s+/g,'_').slice(0,60)||'x';
function cheapest(p){const all=Object.values((p&&p.seen)||{}).filter(s=>s&&typeof s.price==='number'&&s.price>0);if(!all.length)return null;all.sort((a,b)=>a.price-b.price);return{...all[0],n:all.length}}
function cheapLine(p){const c=cheapest(p);if(!c)return '';return `<div class="cheap">أرخص سعر: ${money(c.price)} في ${esc(c.place)}${c.n>1?` · من ${c.n} محلات`:''}</div>`}
const knownPlaces=()=>[...new Set([...Object.values(S.lists).map(l=>l.place),...Object.values(S.products).flatMap(p=>Object.values(p.seen||{}).map(s=>s.place)),'باقة الغربية'].filter(Boolean).map(String))];

/* ---------- sheet ---------- */
const sheet=$('#sheet');
function go(tab){S.tab=tab;if(tab!=='fridge'){S.sel=null;paintSel()}syncNav();renderSheet();sheet.scrollTop=0}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{if(b.dataset.tab==='fridge'&&S.tab==='fridge'&&S.zone){S.zone=null;setView();renderChips()}if(b.dataset.tab==='add')S.editing=null;go(b.dataset.tab)});
function syncNav(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===S.tab))}
function renderChips(){const el=$('#chips');el.innerHTML=`<button data-z="" class="${S.zone?'':'on'}">كل الثلاجة</button>`+ZONES.map(z=>`<button data-z="${z.k}" class="${S.zone===z.k?'on':''}">${z.t}</button>`).join('');
 el.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.z)openZone(b.dataset.z);else{S.zone=null;S.sel=null;paintSel();setView();renderChips();renderSheet()}})}
const sw=p=>`<span class="sw" style="background:${okHex(p.c1)?p.c1:'#dfe7ec'}"><b style="background:${okHex(p.c2)?p.c2:'#7aa6c4'}"></b></span>`;
const sub=p=>[p.company,p.info].filter(Boolean).map(esc).join(' · ');
function renderSheet(){const t=S.tab;sheet.classList.toggle('open',t!=='fridge'||!!S.zone||!!S.sel||matchMedia('(min-width:900px)').matches);
 if(t==='fridge')return S.zone?zoneSheet():overview();if(t==='cart')return cartSheet();if(t==='note')return noteSheet();if(t==='house')return houseSheet();if(t==='add')return formSheet(S.editing);if(t==='feed')return feedSheet()}
function overview(){const ps=Object.values(S.products).filter(p=>ZG[p.zone]);const n=ps.reduce((a,p)=>a+(p.qty||1),0);
 sheet.innerHTML=`<div class="sh"><h2>الثلاجة</h2></div><p class="small">فيها ${n} غرض. الثلاجة بالموقع هي شكلها بعد المشتريات: اللي ناقص بتكبسوا عليه وبيروح للسلة.</p>`+
 ZONES.map(z=>{const c=ps.filter(p=>p.zone===z.k);return `<div class="row" data-z="${z.k}" role="button" tabindex="0"><div class="nm"><div>${z.t}</div><div class="small">${c.length?c.map(p=>esc(p.name)).join('، '):'فاضي'}</div></div><span class="price">${c.length}</span></div>`}).join('');
 sheet.querySelectorAll('[data-z]').forEach(r=>r.onclick=()=>openZone(r.dataset.z))}
function zoneSheet(){const z=S.zone;const ps=Object.values(S.products).filter(p=>p.zone===z).sort(byOrder);
 sheet.innerHTML=`<div class="sh"><h2>${ZT[z]}</h2><button class="btn" id="addHere">+ غرض هون</button><button class="x" id="cls" aria-label="رجوع">×</button></div>`+
 (ps.length?ps.map(p=>{const miss=missQty(p.id);return `<div class="row ${S.sel===p.id?'sel':''} ${miss>=(p.qty||1)?'ghost':''}">${sw(p)}<div class="nm"><div>${esc(p.name)}${(p.qty||1)>1?' ×'+(p.qty||1):''}</div><div class="small">${sub(p)}${miss?' · ناقص '+miss:''}${p.ub?' · آخر تعديل: '+esc(p.ub):''}</div>${cheapLine(p)}</div>
 <span class="price">${p.price!=null&&p.price!==''?money(+p.price):''}</span>${S.sel===p.id?`<button class="btn add" data-add="${esc(p.id)}">+ للسلة</button>`:`<button class="btn" data-sel="${esc(p.id)}">تحديد</button>`}<button class="btn" data-ed="${esc(p.id)}">تعديل</button></div>`}).join(''):`<div class="empty">${z==='shelf3'?'فيه سلة فواكه فاضية. ':''}الرف فاضي.</div>`)+
 `<p class="small">الأسعار تقديرية لحد ما تسجّلوا فواتير، بعدها بتتحدّث لحالها.</p>`;
 $('#cls').onclick=()=>{S.zone=null;S.sel=null;paintSel();setView();renderChips();renderSheet()};
 $('#addHere').onclick=()=>{S.editing={zone:z};go('add')};
 sheet.querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>select(b.dataset.sel));
 sheet.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addToCart(b.dataset.add));
 sheet.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{S.editing=S.products[b.dataset.ed];go('add')})}

/* ---------- cart: open / to-buy / bills ---------- */
function cartSheet(){const tobuy=Object.values(S.lists).filter(l=>l.status==='tobuy').length;const bills=Object.values(S.lists).filter(l=>l.status==='bought').length;
 sheet.innerHTML=`<div class="sh"><h2>المشتريات</h2></div><div class="seg" role="tablist">
 <button class="tab ${S.cartView==='open'?'on':''}" data-v="open">السلة المفتوحة (${Object.keys(S.cart).length})</button>
 <button class="tab ${S.cartView==='tobuy'?'on':''}" data-v="tobuy">للشراء (${tobuy})</button>
 <button class="tab ${S.cartView==='bills'?'on':''}" data-v="bills">الفواتير (${bills})</button></div><div id="cv"></div>`;
 sheet.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{S.cartView=b.dataset.v;S.openBill=null;cartSheet()});
 const cvEl=$('#cv');if(S.cartView==='open')openCart(cvEl);else if(S.cartView==='tobuy')toBuy(cvEl);else billsView(cvEl);nameBy()}
function openCart(el){const items=Object.values(S.cart).sort((a,b)=>(a.at||0)-(b.at||0));
 const total=items.reduce((a,c)=>{const p=S.products[c.id];const cp=cheapest(p);const pr=cp?cp.price:(p&&p.price?+p.price:0);return a+pr*(c.qty||1)},0);
 el.innerHTML=`<label class="f" for="buyer">مسؤول المشتريات</label><input type="text" id="buyer" placeholder="مين رايح على السوبر؟" value="${esc(S.buyer)}">`+
 (items.length?items.map(c=>{const p=S.products[c.id]||{name:c.name};return `<div class="row">${sw(p)}<div class="nm"><div>${esc(p.name||c.name)}</div><div class="small">${[p.company].filter(Boolean).map(esc).join(' · ')}<span data-by="${esc(c.by||'')}"></span></div>${cheapLine(p)}</div>
  <div class="qty"><button class="q" data-dec="${esc(c.id)}" aria-label="أقل">−</button><span>${c.qty||1}</span><button class="q" data-inc="${esc(c.id)}" aria-label="أكثر">+</button></div></div>`}).join(''):'<div class="empty">السلة فاضية. اكبسوا على غرض بالثلاجة لتضيفوه.</div>')+
 (items.length?`<div class="total"><span>تقدير (حسب أرخص سعر معروف)</span><span>${money(total)}</span></div>`:'')+
 `<div class="acts">${items.length?'<button class="pill pri" id="closeL">سكّر القائمة</button><button class="pill" id="cartImg">نزّلها كصورة</button>':''}<button class="pill" id="addC">+ منتج للسلة</button></div>
 <p class="small">لما تسكّروا القائمة بتنحفظ بالتاريخ والساعة وبتروح على «للشراء»، وبتنفتح سلة جديدة.</p><div id="preview"></div>`;
 const bi=$('#buyer');bi.onchange=()=>{putState('meta',{buyer:bi.value.trim()});logA('المسؤول عن المشتريات: '+(bi.value.trim()||'—'))};
 el.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>{const c=S.cart[b.dataset.inc];putCart({...c,qty:(c.qty||1)+1})});
 el.querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>{const c=S.cart[b.dataset.dec];if((c.qty||1)<=1)del('cart',c.id);else putCart({...c,qty:c.qty-1})});
 $('#addC').onclick=()=>{S.editing={zone:'cartonly'};go('add')};
 const ci=$('#cartImg');if(ci)ci.onclick=()=>exportImage('قائمة المشتريات',items.map(c=>'☐ '+(S.products[c.id]?.name||c.name)+((c.qty||1)>1?' ×'+c.qty:'')),'shopping-list.png',S.buyer);
 const cl=$('#closeL');if(cl)cl.onclick=closeCart}
async function closeCart(){const items=Object.values(S.cart);if(!items.length)return;const now=Date.now();
 const list={id:newId('L'),status:'tobuy',closedAt:now,by:await meId(),buyer:S.buyer||'',items:items.map(c=>({id:c.id,name:(S.products[c.id]?.name)||c.name,qty:c.qty||1,got:false}))};
 await putList(list);for(const c of items)await del('cart',c.id);
 toast('انسكرت القائمة '+fmtDT(now)+' وانفتحت سلة جديدة');logA('سكّر قائمة المشتريات ('+items.length+' أغراض)');S.cartView='tobuy';renderSheet()}
function toBuy(el){const ls=Object.values(S.lists).filter(l=>l.status==='tobuy').sort((a,b)=>b.closedAt-a.closedAt);
 if(!ls.length){el.innerHTML='<div class="empty">ما في قوائم مسكّرة. سكّروا السلة لما تكون جاهزة.</div>';return}
 el.innerHTML=ls.map(l=>{const got=(l.items||[]).filter(i=>i.got).length;return `<div class="card"><div class="ch"><div><b>قائمة ${esc(fmtDT(l.closedAt))}</b><div class="small">المسؤول: ${esc(l.buyer||'—')} · سكّرها ${esc(l.by||'—')} · ${got}/${(l.items||[]).length} انشرى</div></div></div>`+
  (l.items||[]).map((it,i)=>{const p=S.products[it.id]||{name:it.name};return `<div class="row ${it.got?'done':''}"><button class="chk ${it.got?'on':''}" data-l="${esc(l.id)}" data-i="${i}" aria-label="انشرى">${it.got?'✓':''}</button>${sw(p)}<div class="nm"><div>${esc(p.name||it.name)}${(it.qty||1)>1?' ×'+it.qty:''}</div>${it.got&&it.gb?`<div class="small">اشتراه ${esc(it.gb)}</div>`:''}${cheapLine(p)}</div></div>`}).join('')+
  `<div class="acts"><button class="pill pri" data-bought="${esc(l.id)}">تم الشراء</button><button class="pill" data-img="${esc(l.id)}">نزّلها كصورة</button><button class="pill danger" data-dl="${esc(l.id)}">احذف</button></div></div>`}).join('')+'<div id="preview"></div>';
 el.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{const l=S.lists[b.dataset.l];const it0=l.items[+b.dataset.i];const items=l.items.map((it,i)=>i===+b.dataset.i?{...it,got:!it.got,gb:ME.name}:it);putList({...l,items});logA((it0.got?'شال الصح عن «':'اشترى «')+it0.name+'»')});
 el.querySelectorAll('[data-img]').forEach(b=>b.onclick=()=>{const l=S.lists[b.dataset.img];exportImage('قائمة '+fmtDT(l.closedAt),l.items.map(i=>(i.got?'☑ ':'☐ ')+i.name+((i.qty||1)>1?' ×'+i.qty:'')),'list.png',l.buyer)});
 el.querySelectorAll('[data-dl]').forEach(b=>b.onclick=async()=>{if(!b.dataset.sure){b.dataset.sure=1;b.textContent='متأكدين؟';return}await del('lists',b.dataset.dl)});
 el.querySelectorAll('[data-bought]').forEach(b=>b.onclick=()=>markBought(b.dataset.bought))}
async function markBought(id){const l=S.lists[id];const missing=l.items.filter(i=>!i.got);
 if(!l.items.some(i=>i.got)){toast('حطّوا صح ✓ جنب اللي انشرى أول');return}
 await putList({...l,status:'bought',boughtAt:Date.now(),items:l.items.filter(i=>i.got),place:l.place||'',total:l.total??null});
 for(const it of missing)await addToCart(it.id,it.qty||1);
 logA('كبس «تم الشراء» لقائمة '+fmtDT(l.closedAt));toast(missing.length?`تمام! ${missing.length} أغراض ما انشرت رجعت للسلة`:'تمام! رجعت الأغراض للثلاجة');S.cartView='bills';S.openBill=id;renderSheet()}
function billsView(el){const bs=Object.values(S.lists).filter(l=>l.status==='bought').sort((a,b)=>(b.date||b.boughtAt)-(a.date||a.boughtAt));
 const now=new Date(),mk=d=>d.getFullYear()*12+d.getMonth();const tot=f=>bs.filter(f).reduce((a,l)=>a+(+l.total||0),0);
 const thisM=tot(l=>mk(new Date(l.date||l.boughtAt))===mk(now)),lastM=tot(l=>mk(new Date(l.date||l.boughtAt))===mk(now)-1),all=tot(()=>1);
 const byPlace={};bs.forEach(l=>{if(l.total&&l.place)byPlace[l.place]=(byPlace[l.place]||0)+(+l.total)});
 el.innerHTML=`<div class="box"><div class="bx"><span>هالشهر</span><b>${money(thisM)}</b></div><div class="bx"><span>الشهر الماضي</span><b>${money(lastM)}</b></div><div class="bx"><span>كل الفواتير</span><b>${money(all)}</b></div>
 ${Object.keys(byPlace).length?`<div class="small" style="grid-column:1/-1">${Object.entries(byPlace).map(([k,v])=>esc(k)+': '+money(v)).join(' · ')}</div>`:''}</div>
 <div class="acts" style="margin-top:0"><button class="pill" id="newBill">+ فاتورة جديدة</button></div>`+
 (bs.length?bs.map(l=>`<div class="card"><div class="ch" data-ob="${esc(l.id)}" role="button" tabindex="0"><div><b>${esc(fmtD(l.date||l.boughtAt))} · ${esc(l.place||'مكان الشراء؟')}</b><div class="small">${(l.items||[]).length} أغراض${l.buyer?' · المسؤول: '+esc(l.buyer):''}${l.receipt?' · فيه صورة فاتورة':''}${l.ub?' · آخر تعديل: '+esc(l.ub):''}</div></div><span class="price">${l.total?money(+l.total):'<span class="warn">بلا سعر</span>'}</span></div>${S.openBill===l.id?billEditor(l):''}</div>`).join(''):'<div class="empty">لسا ما في فواتير. لما تكبسوا «تم الشراء» على قائمة بتظهر هون.</div>');
 el.querySelectorAll('[data-ob]').forEach(h=>h.onclick=e=>{if(e.target.closest('.ed'))return;S.openBill=S.openBill===h.dataset.ob?null:h.dataset.ob;billsView(el)});
 $('#newBill').onclick=async()=>{const id=newId('L');await putList({id,status:'bought',boughtAt:Date.now(),date:Date.now(),closedAt:Date.now(),by:await meId(),buyer:S.buyer||'',items:[],place:'',total:null});S.openBill=id;renderSheet()};
 if(S.openBill&&S.lists[S.openBill])wireBill(S.lists[S.openBill])}
function billEditor(l){const d=new Date(l.date||l.boughtAt);const dv=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 return `<div class="ed"><div class="grid2"><div><label class="f" for="b-place">مكان الشراء</label><input type="text" id="b-place" list="placesDL" value="${esc(l.place||'')}" placeholder="مثلاً: سوبر بالبلد"></div>
 <div><label class="f" for="b-date">التاريخ</label><input type="date" id="b-date" value="${dv}"></div></div>
 <label class="f" for="b-total">سعر الفاتورة ₪</label><input type="number" id="b-total" step="0.01" min="0" inputmode="decimal" value="${l.total??''}" placeholder="ممكن تضيفوه بعدين">
 <div class="acts"><button class="pill" id="b-photo">${l.receipt?'غيّر صورة الفاتورة':'ارفع صورة الفاتورة'}</button>${sample&&sampleImg?'<button class="pill" id="b-read">اقرأ الفاتورة (Claude)</button>':''}</div>
 ${l.receipt?`<img class="rcpt" id="rcImg" alt="صورة الفاتورة">`:''}<div class="small" id="b-msg"></div>
 ${(l.items||[]).length?`<div class="small" style="margin-top:10px">سعر كل غرض (اختياري) — بيتسجّل للمحل وبيساعد تعرفوا وين أرخص:</div>`+l.items.map((it,i)=>`<div class="row"><div class="nm"><div>${esc(it.name)}${(it.qty||1)>1?' ×'+it.qty:''}</div></div><input type="number" class="ip" data-ip="${i}" step="0.01" min="0" inputmode="decimal" value="${it.price??''}" placeholder="₪" aria-label="سعر ${esc(it.name)}"></div>`).join(''):''}
 <datalist id="placesDL">${knownPlaces().map(p=>`<option value="${esc(p)}">`).join('')}</datalist>
 <div class="acts"><button class="pill pri" id="b-save">احفظ الفاتورة</button><button class="pill danger" id="b-del">احذف</button></div></div>`}
let receiptFor=null;
function wireBill(l){const msg=$('#b-msg');
 $('#b-save').onclick=()=>saveBill(l.id);
 $('#b-del').onclick=async e=>{const b=e.target;if(!b.dataset.sure){b.dataset.sure=1;b.textContent='متأكدين؟';return}await del('lists',l.id);S.openBill=null};
 $('#b-photo').onclick=()=>{receiptFor=l.id;fileIn.value='';fileIn.click()};
 const rd=$('#b-read');if(rd)rd.onclick=()=>readReceipt(l.id);
 const im=$('#rcImg');if(im&&l.receipt){const show=()=>{im.src=S.rc[l.receipt]||'';im.onclick=()=>{const pv=sheet.querySelector('#b-msg');if(pv)pv.innerHTML=`<img alt="" style="max-width:100%;border-radius:10px" src="${S.rc[l.receipt]}">`}};
  if(S.rc[l.receipt])show();else if(db)db.collection('receipts').doc(l.receipt).get().then(d=>{if(d.exists&&/^data:image\//.test(d.data().data||'')){S.rc[l.receipt]=d.data().data;show()}}).catch(()=>{})}}
function billForm(l){const items=(l.items||[]).map((it,i)=>{const v=sheet.querySelector(`[data-ip="${i}"]`);const pv=v&&v.value!==''?+v.value:null;return{...it,price:pv}});
 const t=$('#b-total').value,dt=$('#b-date').value;return{...l,place:$('#b-place').value.trim(),total:t===''?null:+t,date:dt?new Date(dt+'T12:00').getTime():(l.date||l.boughtAt),items}}
async function saveBill(id){const l=billForm(S.lists[id]);await putList(l);
 if(l.place)for(const it of l.items){if(it.price==null||!(it.price>0))continue;const p=S.products[it.id];if(!p)continue;const unit=Math.round(it.price/(it.qty||1)*100)/100;
  const seen={...(p.seen||{})};seen[placeKey(l.place)]={place:l.place,price:unit,at:l.date};await putProduct({...p,seen,price:unit,place:l.place})}
 toast('انحفظت الفاتورة');logA('سجّل فاتورة'+(l.place?' من '+l.place:'')+(l.total?' بـ '+money(l.total):''));S.openBill=null;renderSheet()}
async function readReceipt(id){const l=S.lists[id];const msg=$('#b-msg');let blob=null;
 if(l.receipt){try{blob=await (await fetch('/_blob/'+encodeURIComponent(l.receipt))).blob()}catch(e){}}
 if(!blob){msg.textContent='ارفعوا صورة الفاتورة أول';return}
 const cand=(l.items&&l.items.length?l.items.map(i=>({id:i.id,name:i.name})):Object.values(S.products).map(p=>({id:p.id,name:p.name,company:p.company||undefined}))).slice(0,120);
 msg.textContent='Claude عم يقرأ الفاتورة…';
 const prompt=`This is a photo of a supermarket receipt from Israel (usually Hebrew). Read it and return ONLY JSON:
{"store": string|null, "date": "YYYY-MM-DD"|null, "total": number|null, "items":[{"id": string, "price": number}]}
"total" is the final amount paid in ILS. For "items", match receipt lines to this list of our products (Arabic/Hebrew names) and give the line price in ILS for each matched product id. Skip lines you cannot match. Products: ${JSON.stringify(cand)}`;
 try{const r=await sample.json(prompt,{images:[blob],modelTier:'default'});const cur=billForm(S.lists[id]);
  if(r&&typeof r==='object'){if(r.store&&!cur.place)cur.place=String(r.store).slice(0,60);if(typeof r.total==='number'&&cur.total==null)cur.total=r.total;
   if(typeof r.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date))cur.date=new Date(r.date+'T12:00').getTime();
   const found=Array.isArray(r.items)?r.items.filter(x=>x&&typeof x.price==='number'&&S.products[String(x.id)]):[];
   found.forEach(x=>{const i=cur.items.findIndex(it=>it.id===String(x.id));if(i>=0){if(cur.items[i].price==null)cur.items[i].price=x.price}else cur.items.push({id:String(x.id),name:S.products[String(x.id)].name,qty:1,got:true,price:x.price})});
   await putList(cur);S.openBill=id;renderSheet();toast(`Claude قرأ الفاتورة: ${found.length} أغراض`)}}
 catch(e){msg.textContent=e&&e.code==='not_granted'?'ما انسمح لـ Claude يقرأ':'ما قدر يقرأ الفاتورة، عبّوها بإيدكم'}}
function nameBy(){sheet.querySelectorAll('[data-by]').forEach(e=>{if(e.dataset.by)e.textContent=' · أضافه '+e.dataset.by})}

/* ---------- notes & house ---------- */
let noteTimer,noteLogged=0;
function noteSheet(){sheet.innerHTML=`<div class="sh"><h2>ورقة الملاحظات</h2></div><textarea id="nt" aria-label="الملاحظات" placeholder="اكتبوا كل اللي بنحتاجه…">${esc(S.note)}</textarea><div class="small" id="nst">بتنحفظ لحالها وبتطلع على باب الثلاجة${S.noteBy?' · آخر تعديل: '+esc(S.noteBy):''}</div>
 <div class="acts"><button class="pill pri" id="nimg">نزّلها كصورة للتلفون</button><button class="pill" id="nclear">امسح الورقة</button></div><div id="preview"></div>`;
 const ta=$('#nt');ta.oninput=()=>{S.note=ta.value;drawNote();$('#nst').textContent='عم يحفظ…';clearTimeout(noteTimer);noteTimer=setTimeout(async()=>{await putState('note',{text:ta.value});$('#nst').textContent='انحفظ ✓';if(!noteLogged){noteLogged=1;logA('عدّل ورقة الملاحظات')}},900)};
 $('#nimg').onclick=()=>exportImage('ملاحظات البيت',String(S.note||'').split('\n'),'notes.png',S.buyer);$('#nclear').onclick=()=>{ta.value='';ta.oninput()}}
function houseSheet(){const hs=Object.values(S.products).filter(p=>p.zone==='house').sort(byOrder);
 sheet.innerHTML=`<div class="sh"><h2>قائمة البيت</h2></div><p class="small">حطّوا صح ✓ جنب كل إشي موجود بالبيت. لما تخلصوا اكبسوا «جاهز» وبتطلع قائمة باللي ناقص.</p>`+
 hs.map(p=>`<div class="row"><button class="chk ${p.have?'on':''}" data-h="${esc(p.id)}" aria-label="موجود">${p.have?'✓':''}</button><div class="nm"><div>${esc(p.name)}</div><div class="small">${sub(p)}${p.ub?(sub(p)?' · ':'')+esc(p.ub):''}</div>${cheapLine(p)}</div><button class="btn" data-ed="${esc(p.id)}">تعديل</button></div>`).join('')+
 `<div class="acts" style="flex-wrap:nowrap"><input type="text" id="hn" placeholder="غرض جديد للبيت"><button class="btn" id="hadd">إضافة</button></div>
 <div class="acts"><button class="pill pri" id="ready">جاهز</button><button class="pill" id="hall">كله موجود</button></div><div id="hout"></div>`;
 sheet.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{const p=S.products[b.dataset.h];putProduct({...p,have:!p.have});logA((p.have?'علّم ناقص: ':'علّم موجود: ')+p.name)});
 sheet.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{S.editing=S.products[b.dataset.ed];go('add')});
 const hn=$('#hn');const addH=()=>{const n=hn.value.trim();if(!n)return;const r=FM.recognize(n);putProduct({id:newId(),name:n,zone:'house',kind:r?r.k:'box',c1:r?.c1,c2:r?.c2,qty:1,have:false,order:200+Date.now()/1e11,company:r?.co||'',info:'',price:null,place:''});hn.value=''};
 $('#hadd').onclick=addH;hn.onkeydown=e=>{if(e.key==='Enter')addH()};
 $('#hall').onclick=async()=>{for(const p of hs)if(!p.have)await putProduct({...p,have:true})};
 $('#ready').onclick=()=>{S.houseOut=hs.filter(p=>!p.have).map(p=>p.id);showHouseOut()};if(S.houseOut)showHouseOut()}
function showHouseOut(){const o=$('#hout');if(!o)return;const list=S.houseOut.map(id=>S.products[id]).filter(Boolean);
 o.innerHTML=`<div class="total"><span>الناقص من البيت</span><span>${list.length}</span></div>`+(list.length?`<div class="small" style="line-height:2">${list.map(p=>esc(p.name)).join('، ')}</div>
 <div class="acts"><button class="pill pri" id="hcart">حطّ الناقص بالسلة</button><button class="pill" id="himg">نزّلها كصورة</button></div><div id="preview"></div>`:'<div class="empty">ما في إشي ناقص</div>');
 const hc=$('#hcart');if(hc)hc.onclick=async()=>{const me=await meId();for(const p of list)if(!S.cart[p.id])await putCart({id:p.id,name:p.name,qty:1,by:me,at:Date.now()});toast('الناقص صار بالسلة')};
 const hi=$('#himg');if(hi)hi.onclick=()=>exportImage('الناقص من البيت',list.map(p=>'☐ '+p.name),'house-missing.png',S.buyer)}

/* ---------- product form with recognition ---------- */
function formSheet(p){const isNew=!p||!p.id;p=Object.assign({name:'',company:'',info:'',price:'',place:'باقة الغربية',zone:'shelf2',kind:'box',qty:1},p||{});
 const st={kind:p.kind,c1:p.c1,c2:p.c2,touchedKind:!isNew,touchedZone:!isNew||!!S.editing?.zone,touchedCo:!!p.company};
 sheet.innerHTML=`<div class="sh"><h2>${isNew?'منتج جديد':'تعديل '+esc(p.name)}</h2><button class="x" id="cls" aria-label="إغلاق">×</button></div>
 <form id="pf" novalidate><label class="f" for="f-name">اسم المنتج *</label><input type="text" id="f-name" value="${esc(p.name)}" autocomplete="off" placeholder="مثلاً: بيض، حليب، تفاح، שניצל">
 <div class="rec" id="rec"></div>
 <div class="grid2"><div><label class="f" for="f-company">الشركة</label><input type="text" id="f-company" value="${esc(p.company)}"></div>
 <div><label class="f" for="f-price">السعر ₪</label><input type="number" id="f-price" step="0.1" min="0" inputmode="decimal" value="${p.price==null?'':esc(p.price)}"></div>
 <div><label class="f" for="f-place">مكان الشراء</label><input type="text" id="f-place" list="plDL" value="${esc(p.place)}"></div>
 <div><label class="f" for="f-qty">الكمية</label><input type="number" id="f-qty" min="1" max="20" value="${esc(p.qty||1)}"></div></div>
 <datalist id="plDL">${knownPlaces().map(x=>`<option value="${esc(x)}">`).join('')}</datalist>
 <label class="f" for="f-info">معلومات ثانية</label><input type="text" id="f-info" value="${esc(p.info)}" placeholder="حجم، نسبة دسم…">
 <div class="grid2"><div><label class="f" for="f-zone">وين بينحط</label><select id="f-zone">${PLACES.map(z=>`<option value="${z.k}" ${p.zone===z.k?'selected':''}>${z.t}</option>`).join('')}</select></div>
 <div><label class="f" for="f-kind">الشكل</label><select id="f-kind">${Object.entries(FM.KINDS).map(([k,v])=>`<option value="${k}" ${FM.kindOf(p)===k?'selected':''}>${v}</option>`).join('')}</select></div></div>
 <div class="small" id="ferr" style="color:#b8432c;min-height:1.4em"></div>
 <div class="acts"><button class="pill pri" type="submit">تم</button>${isNew?'':'<button class="pill danger" type="button" id="del">احذف المنتج</button>'}</div></form>`;
 const nm=$('#f-name'),rec=$('#rec'),ks=$('#f-kind'),zs=$('#f-zone'),co=$('#f-company');
 ks.onchange=()=>{st.touchedKind=true;st.kind=ks.value};zs.onchange=()=>st.touchedZone=true;co.oninput=()=>st.touchedCo=true;
 const apply=(r,src)=>{if(!r){rec.innerHTML=nm.value.trim().length>1?`<span>ما عرفته.</span>${sample?' <button class="btn" type="button" id="askC">اسأل Claude شو هاد</button>':' اختاروا الشكل من تحت.'}`:'';const a=$('#askC');if(a)a.onclick=askClaude;return}
  if(!st.touchedKind){ks.value=r.k;st.kind=r.k;st.c1=r.c1;st.c2=r.c2}if(!st.touchedZone&&r.z&&PT[r.z])zs.value=r.z;if(!st.touchedCo&&r.co&&!co.value)co.value=r.co;
  rec.innerHTML=`<span class="dot" style="background:${okHex(r.c1)?r.c1:'#ccc'}"></span>${src==='ai'?'Claude عرفه':'تعرّفنا عليه'}: <b>${esc(r.t||FM.KINDS[r.k]||'')}</b> · رح ينحط بـ ${esc(PT[zs.value]||'')}`};
 let tm;nm.oninput=()=>{$('#ferr').textContent='';clearTimeout(tm);tm=setTimeout(()=>apply(FM.recognize(nm.value)),200)};
 if(isNew&&p.name)apply(FM.recognize(p.name));
 async function askClaude(){const n=nm.value.trim();if(!n)return;rec.textContent='Claude عم يفكّر…';
  try{const r=await sample.json(`A family in Israel adds a grocery product named "${n}" (Arabic/Hebrew/English) to their fridge app. Reply with ONLY JSON {"k":kind,"c1":"#hex main color of the real product/package","c2":"#hex accent/brand color","co":"typical Israeli brand in Hebrew or null","z":zone,"t":"short Arabic description of its shape"}. kind must be one of: ${Object.keys(FM.KINDS).join(',')}. zone one of: ${PLACES.map(z=>z.k).join(',')} (house = pantry outside the fridge).`,{modelTier:'quick'});
   if(r&&FM.KINDS[r.k]){r.c1=okHex(r.c1)?r.c1:'#dfe7ec';r.c2=okHex(r.c2)?r.c2:'#6f9fc2';r.z=PT[r.z]?r.z:null;r.co=typeof r.co==='string'?r.co.slice(0,30):'';r.t=typeof r.t==='string'?r.t.slice(0,40):'';apply(r,'ai')}else rec.textContent='ما قدر يعرفه، اختاروا الشكل من تحت.'}
  catch(e){rec.textContent=e&&e.code==='not_granted'?'ما انسمح لـ Claude':'ما زبط، اختاروا الشكل من تحت.'}}
 const close=()=>{S.editing=null;go(p.zone==='house'?'house':p.zone==='cartonly'?'cart':'fridge')};$('#cls').onclick=close;
 $('#pf').onsubmit=async e=>{e.preventDefault();const name=nm.value.trim();if(!name){$('#ferr').textContent='لازم تكتبوا اسم المنتج';nm.focus();return}
  const pr=$('#f-price').value;const zone=zs.value;const r=FM.recognize(name);const kind=ks.value;const pal=['#e9d9b0','#dfeaf2','#f2dede','#e3efd9','#efe6f5','#fbefd2'];
  const sameRec=r&&r.k===kind;const c1=(kind===p.kind&&p.c1)?p.c1:(st.kind===kind&&st.c1)?st.c1:sameRec?r.c1:pal[name.length%pal.length];const c2=(kind===p.kind&&p.c2)?p.c2:(st.kind===kind&&st.c2)?st.c2:sameRec?r.c2:'#6f9fc2';
  const np={...p,id:p.id||newId(),name,company:co.value.trim(),info:$('#f-info').value.trim(),price:pr===''?null:+pr,place:$('#f-place').value.trim(),zone,kind,qty:Math.max(1,Math.min(20,+$('#f-qty').value||1)),c1,c2,order:p.order??(50+Date.now()/1e11)};
  if(zone==='house'&&np.have===undefined)np.have=false;
  await putProduct(np);if(zone==='cartonly'&&isNew)await putCart({id:np.id,name:np.name,qty:np.qty,by:await meId(),at:Date.now()});
  toast(isNew?'انضاف: '+name:'انحفظ');logA((isNew?'أضاف منتج «':'عدّل «')+name+'»');S.editing=null;if(ZG[zone]){S.zone=zone;S.sel=np.id;go('fridge');setView();renderChips();paintSel()}else go(zone==='house'?'house':'cart')};
 const dl=$('#del');if(dl)dl.onclick=async()=>{if(dl.dataset.sure){await delProduct(p.id);logA('حذف «'+p.name+'»');toast('انحذف');close()}else{dl.dataset.sure=1;dl.textContent='متأكدين؟ اكبسوا كمان مرة'}}}

/* ---------- image export (always shows the responsible person) ---------- */
async function exportImage(title,lines,fname,buyer){const W=1080,c=document.createElement('canvas');c.width=W;const ctx=c.getContext('2d');ctx.font='44px '+FONT;
 const wrapped=[];lines.forEach(l=>wrapped.push(...wrapLines(ctx,l,W-160)));const H=Math.max(900,330+wrapped.length*70+80);c.height=H;
 ctx.fillStyle='#fff6cf';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#efdf9f';ctx.lineWidth=3;for(let y=300;y<H-40;y+=70){ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(W-60,y);ctx.stroke()}
 ctx.direction='rtl';ctx.textAlign='right';ctx.fillStyle='#5b4b22';ctx.font='500 64px '+FONT;ctx.fillText(title,W-80,130);
 ctx.font='36px '+FONT;ctx.fillStyle='#8a7a52';ctx.fillText(fmtDT(Date.now()),W-80,190);
 ctx.font='500 40px '+FONT;ctx.fillStyle='#24506f';ctx.fillText('المسؤول: '+(buyer||'—'),W-80,250);
 ctx.font='44px '+FONT;ctx.fillStyle='#3a3326';wrapped.forEach((l,i)=>ctx.fillText(l,W-80,285+i*70));
 const url=c.toDataURL('image/png');const pv=sheet.querySelector('#preview');if(pv)pv.innerHTML=`<p class="small">على التلفون: اكبسوا مطوّل على الصورة واحفظوها.</p><img alt="${esc(title)}" src="${url}">`;
 try{const a=document.createElement('a');a.href=url;a.download=fname;document.body.appendChild(a);a.click();a.remove();toast('الصورة نزلت')}catch(e){}}

/* ---------- photos & receipts ---------- */
let photoIdx=0;const fileIn=$('#file');
function pickPhoto(i){receiptFor=null;photoIdx=i;fileIn.value='';fileIn.click()}
async function shrink(f,max,q){const bmp=await createImageBitmap(f);const sc=Math.min(1,max/Math.max(bmp.width,bmp.height));const c=document.createElement('canvas');c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return c}
fileIn.onchange=async()=>{const f=fileIn.files[0];if(!f)return;toast('عم نرفع الصورة…');
 try{if(receiptFor){const id=receiptFor;receiptFor=null;const c=await shrink(f,1300,.8);let data=c.toDataURL('image/jpeg',.72);if(data.length>900000)data=c.toDataURL('image/jpeg',.5);
   const cur=document.getElementById('b-total')?billForm(S.lists[id]):S.lists[id];
   if(local){toast('صور الفواتير بتنحفظ بس مع المزامنة');return}
   const rid=newId('R');await db.collection('receipts').doc(rid).set({data,by:ME.name,at:Date.now()});S.rc[rid]=data;await putList({...cur,receipt:rid});logA('رفع صورة فاتورة');S.openBill=id;renderSheet();toast('انرفعت صورة الفاتورة');return}
  const c=await shrink(f,900,.8);let data=c.toDataURL('image/jpeg',.75);if(data.length>700000)data=c.toDataURL('image/jpeg',.5);
  if(local){const photos=S.photos.slice();photos[photoIdx]=data;S.photos=photos;saveLocal();applyPhotos();toast('انحفظت على هاد الجهاز بس');return}
  await db.collection('photos').doc('p'+photoIdx).set({data,by:ME.name,at:Date.now()});logA('غيّر صورة '+(photoIdx+1)+' على باب الثلاجة');toast('الصورة انحطت على الباب')}
 catch(e){toast('ما زبط رفع الصورة')}};
const texLoader=new THREE.TextureLoader();
function applyPhotos(){S.photos.forEach((v,i)=>{const slot=photoSlots[i];const url=!v?null:String(v).startsWith('data:image/')?v:'/_blob/'+encodeURIComponent(v);if(slot.url===url)return;slot.url=url;
 if(!url){slot.pm.map=placeholder(i);slot.pm.needsUpdate=true;return}
 texLoader.load(url,t=>{t.colorSpace=THREE.SRGBColorSpace;const im=t.image,ar=im.width/im.height,tr=1.8/2.25;t.repeat.set(ar>tr?tr/ar:1,ar>tr?1:ar/tr);t.offset.set((1-t.repeat.x)/2,(1-t.repeat.y)/2);slot.pm.map=t;slot.pm.needsUpdate=true})})}

/* ---------- refresh & boot ---------- */
let rq=0;function refresh(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;buildItems();drawNote();drawList();applyPhotos();const n=Object.keys(S.cart).length;const b=$('#badge');b.hidden=!n;b.textContent=n;
 const a=document.activeElement;if(a&&sheet.contains(a)&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;renderSheet()})}
function setSync(on,txt){$('#sync').classList.toggle('on',on);$('#sync span').textContent=txt}
/* ---------- login (once per device) + Firebase sync ---------- */
const LOGIN='fridge-login-v1';
function famDb(code){const fs=firebase.firestore();const root=fs.collection('families').doc(code);return{collection:c=>root.collection(c),doc:p=>{const[a,b]=p.split('/');return root.collection(a).doc(b)}}}
let fbReady=false;
function initFirebase(){if(fbReady)return true;const cfg=window.FRIDGE_FIREBASE;if(!cfg||!cfg.apiKey||!window.firebase)return false;
 firebase.initializeApp(cfg);const fs=firebase.firestore();try{fs.settings({ignoreUndefinedProperties:true,merge:true})}catch(e){}fs.enablePersistence({synchronizeTabs:true}).catch(()=>{});fbReady=true;return true}
function showLogin(msg){const el=$('#login');el.hidden=false;const can=!!(window.FRIDGE_FIREBASE&&window.FRIDGE_FIREBASE.apiKey);
 el.innerHTML=`<div class="lg"><h2>ثلاجة بيتنا</h2>${can?`<p class="small">بتسجلوا مرة وحدة على كل تلفون، وبعدها كل تعديل بينكتب عليه اسمكم.</p>
 <form id="lf" novalidate><label class="f" for="l-code">كود العيلة</label><input type="text" id="l-code" autocomplete="off" autocapitalize="off" value="${esc(ME.code)}">
 <label class="f" for="l-name">اسمك</label><input type="text" id="l-name" autocomplete="nickname" value="${esc(ME.name)}" placeholder="مثلاً: نبأ">
 <div class="chips" id="l-chips"></div><div class="small" id="l-err" style="color:#b8432c;min-height:1.4em">${esc(msg||'')}</div>
 <button class="pill pri" type="submit" style="width:100%">ادخل</button></form>`:`<p>الموقع لسا مش موصول بقاعدة البيانات المشتركة.</p><p class="small">صاحب الموقع لازم يعبّي ملف <code>config.js</code> بإعدادات Firebase مرة وحدة.</p>`}
 <button class="pill" id="l-demo" style="width:100%;margin-top:10px">جرّبوا بدون مزامنة (على هاد الجهاز بس)</button></div>`;
 $('#l-demo').onclick=()=>{el.hidden=true;setSync(false,'تجربة على هاد الجهاز')};
 const f=$('#lf');if(!f)return;const err=$('#l-err');
 $('#l-code').oninput=$('#l-name').oninput=()=>err.textContent='';
 f.onsubmit=async e=>{e.preventDefault();const code=$('#l-code').value.trim(),name=$('#l-name').value.trim().slice(0,24);
  if(!code){err.textContent='اكتبوا كود العيلة';return}if(!name){err.textContent='اكتبوا اسمكم';return}
  if(!/^[A-Za-z0-9_-]{4,40}$/.test(code)){err.textContent='الكود بالإنجليزي والأرقام بس';return}
  err.textContent='عم نتأكد…';if(!initFirebase()){err.textContent='ما قدرنا نوصل لـ Firebase';return}
  try{await famDb(code).doc('state/meta').get({source:'server'})}catch(x){err.textContent=x&&x.code==='permission-denied'?'الكود غلط':'ما في إنترنت، جرّبوا كمان مرة';return}
  ME.code=code;ME.name=name;try{localStorage.setItem(LOGIN,JSON.stringify({code,name}))}catch(x){}el.hidden=true;startSync()}}
function logout(){try{localStorage.removeItem(LOGIN)}catch(e){}location.reload()}
async function boot(){setBg();matchMedia('(prefers-color-scheme: dark)').addEventListener('change',setBg);new MutationObserver(setBg).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 loadLocal();resize();renderChips();refresh();$('#loading').remove();frame();
 if(document.fonts)Promise.all(['500 30px "IBM Plex Sans Arabic"','30px "IBM Plex Sans Arabic"','30px Rubik','500 30px Rubik'].map(f=>document.fonts.load(f))).catch(()=>{}).then(()=>{FM.clearTex();refresh()});
 $('#whoBtn').onclick=()=>go('feed');
 let saved=null;try{saved=JSON.parse(localStorage.getItem(LOGIN))}catch(e){}
 if(saved&&saved.code&&saved.name&&initFirebase()){ME.code=saved.code;ME.name=saved.name;startSync()}else{setSync(false,'محلي');showLogin()}}
let subs=[];
function startSync(){db=famDb(ME.code);local=false;$('#whoBtn').hidden=false;$('#meName').textContent=ME.name;
 Object.assign(S,{products:{},cart:{},lists:{},note:'',buyer:'',photos:[null,null,null,null,null,null]});refresh();setSync(false,'عم يحمّل…');
 const timer=setTimeout(()=>setSync(false,'ما في اتصال — بنكمّل على آخر نسخة'),10000);let first=true;
 const err=e=>{clearTimeout(timer);if(e&&e.code==='permission-denied'){setSync(false,'الكود ما عاد شغّال');showLogin('الكود تغيّر، ادخلوا من جديد')}else setSync(false,'انقطع التزامن')};
 const live=s=>{if(!s.metadata.fromCache){clearTimeout(timer);setSync(true,'متزامن مع العيلة')}};
 subs.push(db.collection('products').onSnapshot({includeMetadataChanges:false},s=>{S.products={};s.docs.forEach(d=>S.products[d.id]={...d.data(),id:d.id});live(s);refresh();if(first&&!s.metadata.fromCache){first=false;if(s.empty)setTimeout(offerSeed,50)}},err));
 subs.push(db.collection('cart').onSnapshot(s=>{S.cart={};s.docs.forEach(d=>S.cart[d.id]={...d.data(),id:d.id});refresh()},err));
 subs.push(db.collection('lists').onSnapshot(s=>{S.lists={};s.docs.forEach(d=>{const v=d.data();S.lists[d.id]={...v,id:d.id,items:Array.isArray(v.items)?v.items:[]}});refresh()},err));
 subs.push(db.doc('state/note').onSnapshot(d=>{const v=d.exists?String(d.data().text||''):'';S.noteBy=d.exists?String(d.data().by||''):'';if(!(document.activeElement&&document.activeElement.id==='nt'))S.note=v;drawNote();if(S.tab!=='note')refresh()},err));
 subs.push(db.doc('state/meta').onSnapshot(d=>{S.buyer=d.exists?String(d.data().buyer||''):'';refresh()},err));
 subs.push(db.collection('photos').onSnapshot(s=>{const ph=[null,null,null,null,null,null];s.docs.forEach(d=>{const i=+d.id.slice(1);const v=d.data().data;if(i>=0&&i<6&&typeof v==='string'&&/^data:image\//.test(v)){ph[i]=v;S.photoBy[i]=d.data().by}});S.photos=ph;applyPhotos()},err));
 subs.push(db.collection('log').orderBy('at','desc').limit(60).onSnapshot(s=>{S.feed=s.docs.map(d=>d.data());if(S.tab==='feed')renderSheet()},err));
 subs.push(db.collection('members').onSnapshot(s=>{S.members={};s.docs.forEach(d=>S.members[d.id]=d.data());renderWho();if(S.tab==='feed')renderSheet()},err));
 const beat=()=>{if(document.visibilityState==='visible')db.collection('members').doc(ME.name.replace(/[\/.#$\[\]]/g,'_')).set({name:ME.name,seen:Date.now()}).catch(()=>{})};
 beat();setInterval(beat,60000);document.addEventListener('visibilitychange',beat)}
const online=m=>Date.now()-(m.seen||0)<150000;
function renderWho(){const ms=Object.values(S.members).sort((a,b)=>(b.seen||0)-(a.seen||0));const on=ms.filter(online).length;$('#whoN').textContent=on?String(on):'';}
const ago=t=>{const m=Math.round((Date.now()-t)/60000);return m<1?'هلّق':m<60?`قبل ${m} د`:m<1440?`قبل ${Math.round(m/60)} س`:fmtD(t)};
function feedSheet(){const ms=Object.values(S.members).sort((a,b)=>(b.seen||0)-(a.seen||0));
 sheet.innerHTML=`<div class="sh"><h2>العيلة</h2></div><p class="small">انت داخل باسم <b>${esc(ME.name)}</b> · <button class="linkb" id="lo">مش انت؟ بدّل</button></p>
 <div class="chips">${ms.map(m=>`<span class="chip"><i class="${online(m)?'on':''}"></i>${esc(m.name)}</span>`).join('')||'<span class="small">لسا ما حدا دخل</span>'}</div>
 <h3 class="h3">آخر التعديلات</h3>${S.feed.length?S.feed.map(f=>`<div class="row"><div class="nm"><div><b>${esc(f.who||'')}</b> ${esc(f.what||'')}</div><div class="small">${esc(ago(f.at||0))} · ${esc(fmtDT(f.at||0))}</div></div></div>`).join(''):'<div class="empty">لسا ما في تعديلات</div>'}`;
 $('#lo').onclick=()=>{if(confirmLo++)logout();else $('#lo').textContent='اكبسوا كمان مرة للتأكيد'}}
let confirmLo=0;
function offerSeed(){S.tab='fridge';sheet.classList.add('open');sheet.innerHTML=`<div class="sh"><h2>الثلاجة فاضية</h2></div><p>بدكم أعبّيها بالمحتويات الأصلية؟</p><div class="acts"><button class="pill pri" id="seed">عبّيها</button></div>`;
 $('#seed').onclick=async e=>{e.target.disabled=true;e.target.textContent='عم يعبّي…';for(const p of [...DEFAULTS,...HOUSE_DEF]){try{await db.collection('products').doc(p.id).set(p)}catch(er){fail(er);break}}renderSheet()}}
boot();
}
