/* VQ Art — JSON-only animated scene elements. No dependencies or network access. */
(function (global) {
'use strict';
const TYPES = ['flower','butterfly','tree','fern','bush','reeds','bird','falling-petals','custom'];
const SPECIES = ['daisy','tulip','rose','poppy','lavender','sunflower','wildflower'];
const STYLES = ['monarch','blue','swallowtail','moth'];
const KINDS = ['pine','oak','birch','palm','willow','cherry-blossom'];
const AREAS = ['bottom','full','left','right','top'];
const ANIMATIONS = ['sway','flutter','rotate','pulse','drift','wander'];
const LIMITS = {elements:8,instances:240,parts:40,points:300,customPartDraws:1800,fps:30,dpr:1.5,canvasPixels:2000000,canvasDimension:2048};
const DEFAULTS = {flower:[16,70,80],butterfly:[6,40,40],tree:[5,180,16],fern:[12,75,50],bush:[8,90,40],reeds:[24,90,80],bird:[12,26,60],'falling-petals':[36,16,160],custom:[3,80,60]};
const TAU = Math.PI*2;
const copy = x => JSON.parse(JSON.stringify(x));
const bad = message => { throw new Error(message); };
function object(v,label) { if(!v || typeof v !== 'object' || Array.isArray(v)) bad(label+' must be an object'); }
function fields(v,allowed,label) { object(v,label); for(const k of Object.keys(v)) if(!allowed.includes(k)) bad(label+': unknown setting "'+k+'"'); }
function number(v,min,max,label,integer=false) { if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v))) bad(label+' must be '+(integer?'an integer ':'')+'between '+min+' and '+max); return v; }
function choice(v,values,label) { if(!values.includes(v)) bad(label+' must be one of: '+values.join(', ')); return v; }
function colour(v,label) { if(typeof v!=='string'||!/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(v)) bad(label+' must be a #hex colour'); return v; }
// Read only data properties: never execute a getter, callback or code supplied in a spec.
function plain(v,seen=new Set(),depth=0) {
  if(depth>12) bad('Spec is nested too deeply');
  if(typeof v==='string'&&v.length>1000)bad('Spec text is too long');
  if(v===null || typeof v==='string' || typeof v==='boolean') return;
  if(typeof v==='number') { if(!Number.isFinite(v)) bad('Spec contains a non-finite number'); return; }
  if(typeof v!=='object') bad('Spec must contain plain JSON data only');
  const proto=Object.getPrototypeOf(v);
  if(Array.isArray(v) ? proto!==Array.prototype : proto!==Object.prototype&&proto!==null) bad('Spec must contain plain JSON objects and arrays');
  if(Array.isArray(v)&&(v.length>300||Object.keys(v).length!==v.length||Object.keys(v).some(k=>!/^\d+$/.test(k))))bad('Spec arrays must be dense JSON arrays of at most 300 entries');
  if(seen.has(v)) bad('Spec contains a circular reference'); seen.add(v);
  const descriptors=Object.getOwnPropertyDescriptors(v);
  if(Reflect.ownKeys(descriptors).some(k=>typeof k==='symbol')) bad('Spec cannot contain symbol keys');
  for(const [k,d] of Object.entries(descriptors)) {
    if(Array.isArray(v)&&k==='length') continue;
    if(['__proto__','prototype','constructor'].includes(k)) bad('Unsupported data key: '+k);
    if(!('value' in d)) bad('Spec cannot contain getters or setters');
    plain(d.value,seen,depth+1);
  }
  seen.delete(v);
}
function validate(raw) {
  plain(raw); fields(raw,['elements'],'Spec');
  if(!Array.isArray(raw.elements)||raw.elements.length>LIMITS.elements) bad('elements must be an array with at most 8 elements');
  const result={elements:[]}; let total=0,work=0;
  for(let i=0;i<raw.elements.length;i++) {
    const input=raw.elements[i],label='Element '+(i+1); object(input,label);
    const type=choice(input.type,TYPES,label+' type');
    fields(input,['type','count','size','density','colors','speed','area','seed',...(type==='flower'?['species']:type==='butterfly'?['style']:type==='tree'?['kind']:type==='custom'?['name','parts']:[])],label);
    const def=DEFAULTS[type];
    const e={type,count:number(input.count??def[0],1,def[2],label+' count',true),size:number(input.size??def[1],8,300,label+' size'),density:number(input.density??1,0,2,label+' density'),speed:number(input.speed??1,0,3,label+' speed'),area:choice(input.area??(['butterfly','bird','falling-petals','custom'].includes(type)?'full':'bottom'),AREAS,label+' area'),seed:number(input.seed??1,0,4294967295,label+' seed',true)};
    if(type!=='custom'||input.colors!==undefined) {
      if(!Array.isArray(input.colors)||input.colors.length<1||input.colors.length>8) bad(label+' colors must contain 1 to 8 #hex colours');
      e.colors=input.colors.map(c=>colour(c,label+' color'));
    }
    if(type==='flower') e.species=choice(input.species??'daisy',SPECIES,label+' species');
    if(type==='butterfly') e.style=choice(input.style??'monarch',STYLES,label+' style');
    if(type==='tree') e.kind=choice(input.kind??'oak',KINDS,label+' kind');
    if(type==='custom') {
      if(typeof input.name!=='string'||!input.name.trim()||input.name.length>80) bad(label+' name must be 1 to 80 characters'); e.name=input.name;
      if(!Array.isArray(input.parts)||input.parts.length<1||input.parts.length>40) bad(label+' parts must contain 1 to 40 parts');
      let points=0; e.parts=input.parts.map((p,j)=>{
        const pl=label+' part '+(j+1); fields(p,['shape','points','fill','stroke','mirror','animate'],pl);
        const q={shape:choice(p.shape,['ellipse','path','circle','polygon'],pl+' shape'),mirror:choice(p.mirror??'none',['x','y','none'],pl+' mirror')};
        const min=q.shape==='polygon'?3:2;
        if(!Array.isArray(p.points)||p.points.length<min||p.points.length>300) bad(pl+' needs '+min+' to 300 points');
        if(['ellipse','circle'].includes(q.shape)&&p.points.length!==2) bad(pl+' '+q.shape+' needs exactly two points');
        points+=p.points.length; if(points>300) bad(label+' exceeds 300 points across its parts');
        q.points=p.points.map(pt=>{ if(!Array.isArray(pt)||pt.length!==2) bad(pl+' point must be [x,y]'); return pt.map(v=>number(v,0,100,pl+' coordinate')); });
        if(q.shape==='ellipse'&&(q.points[0][0]===q.points[1][0]||q.points[0][1]===q.points[1][1])) bad(pl+' ellipse must have nonzero width and height');
        if(q.shape==='circle') { const [c,r]=q.points,rad=Math.hypot(r[0]-c[0],r[1]-c[1]); if(rad===0||c[0]-rad<0||c[0]+rad>100||c[1]-rad<0||c[1]+rad>100) bad(pl+' circle must fit inside the 0–100 box'); }
        if(p.fill===undefined&&p.stroke===undefined) bad(pl+' requires fill or stroke');
        if(p.fill!==undefined) q.fill=colour(p.fill,pl+' fill'); if(p.stroke!==undefined) q.stroke=colour(p.stroke,pl+' stroke');
        if(p.animate!==undefined) { fields(p.animate,['kind','amount','speed'],pl+' animate'); q.animate={kind:choice(p.animate.kind,ANIMATIONS,pl+' animation'),amount:number(p.animate.amount??.3,0,1,pl+' amount'),speed:number(p.animate.speed??1,.2,2,pl+' animation speed')}; }
        return q;
      });
    }
    e.effectiveCount=Math.min(def[2],Math.round(e.count*e.density)); total+=e.effectiveCount*(e.kind==='cherry-blossom'?4:1);
    if(e.parts) work+=e.effectiveCount*e.parts.reduce((n,p)=>n+(p.mirror==='none'?1:2),0);
    result.elements.push(e);
  }
  if(total>LIMITS.instances) bad('Scene exceeds 240 instances; lower count or density');
  if(work>LIMITS.customPartDraws) bad('Scene exceeds 1800 custom part draws; lower count, parts or mirroring');
  return result;
}
function random(seed) { let s=seed>>>0; return ()=>{s=(s+0x6D2B79F5)>>>0;let t=Math.imul(s^(s>>>15),1|s);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;}; }
function instances(spec) {
  const nodes=[];
  for(const e of spec.elements) { const rng=random(e.seed); for(let i=0;i<e.effectiveCount;i++) nodes.push({e,i,x:rng(),y:rng(),phase:rng()*TAU,size:e.size*(.72+rng()*.5),variant:rng(),period:17+rng()*13,drift:rng()}); }
  return nodes;
}
function bounds(area) { return area==='bottom'?[0,.68,1,1]:area==='top'?[0,0,1,.32]:area==='left'?[0,0,.28,1]:area==='right'?[.72,0,1,1]:[0,0,1,1]; }
function anchor(n,w,h) { const b=bounds(n.e.area),living=['butterfly','bird','falling-petals','custom'].includes(n.e.type); const x=(b[0]+(.04+n.x*.92)*(b[2]-b[0]))*w; const y=(b[1]+(living?.12+n.y*.76:.62+n.y*.38)*(b[3]-b[1]))*h;return [x,y,b]; }
const col=(e,i)=>e.colors[i%e.colors.length];
function ellipse(c,x,y,rx,ry,fill,rotation=0) { c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),rotation,0,TAU);c.fillStyle=fill;c.fill(); }
function line(c,points,stroke,width=1) { c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++) c.lineTo(...points[i]);c.strokeStyle=stroke;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke(); }
function curve(c,a,b,d,stroke,width=1) { c.beginPath();c.moveTo(...a);c.quadraticCurveTo(...b,...d);c.strokeStyle=stroke;c.lineWidth=width;c.lineCap='round';c.stroke(); }
function polygon(c,pts,fill) { c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill(); }
function flower(c,n,t) {
  const e=n.e,p=n.phase,sway=Math.sin(t*1.1+p)*6,top=-75;
  curve(c,[0,0],[sway*.3,-42],[sway,top],col(e,0),2.4);
  ellipse(c,-8+sway*.3,-31,11,3.5,col(e,0),-.6);ellipse(c,9+sway*.6,-49,11,3.5,col(e,0),.7);
  c.save();c.translate(sway,top);c.rotate(Math.sin(t*.8+p)*.055);
  const petal=col(e,1),centre=col(e,2);
  if(e.species==='tulip') { c.beginPath();c.moveTo(-15,-15);c.quadraticCurveTo(-17,17,0,15);c.quadraticCurveTo(18,13,15,-15);c.lineTo(7,-7);c.lineTo(0,-19);c.lineTo(-7,-7);c.closePath();c.fillStyle=petal;c.fill();curve(c,[0,14],[-7,1],[0,-15],centre,1); }
  else if(e.species==='lavender') { for(let i=0;i<8;i++){const y=10-i*5;ellipse(c,(i%2?1:-1)*3,y,4.5-i*.3,3.5,col(e,1+i%2),i%2?.5:-.5);} }
  else if(e.species==='rose') { for(let i=0;i<15;i++){const a=i*2.4,r=12*(1-i/18);ellipse(c,Math.cos(a)*r*.48,Math.sin(a)*r*.48,9-i*.3,5-i*.16,col(e,1+i%2),a);}ellipse(c,0,0,3,3,centre); }
  else { const count=e.species==='poppy'?4:e.species==='wildflower'?5:e.species==='sunflower'?16:12;for(let i=0;i<count;i++){const a=i*TAU/count,wide=e.species==='poppy'?11:4.5,r=e.species==='poppy'?8:13;ellipse(c,Math.cos(a)*r,Math.sin(a)*r,e.species==='poppy'?13:10,wide,petal,a);}ellipse(c,0,0,e.species==='sunflower'?10:6,e.species==='poppy'?5:6,centre);if(e.species==='sunflower')for(let i=0;i<25;i++){const a=i*2.4,r=Math.sqrt(i/25)*8;ellipse(c,Math.cos(a)*r,Math.sin(a)*r,.8,.8,col(e,3));} }
  c.restore();
}
function butterfly(c,n,t) {
  const e=n.e,cycle=(t+n.variant*n.period)%n.period,rest=cycle>n.period-3,flap=rest?.26:Math.max(.08,Math.abs(Math.sin(t*9+n.phase)));
  c.save();c.rotate(Math.sin(t*.8+n.phase)*.12);
  for(const sign of [-1,1]) { c.save();c.scale(sign*flap,1);const wing=col(e,1),pattern=col(e,2);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(8,-32,43,-35,41,-10);c.bezierCurveTo(43,9,20,7,3,5);c.bezierCurveTo(39,6,32,30,12,24);c.quadraticCurveTo(3,20,0,0);c.fillStyle=wing;c.fill();c.strokeStyle=pattern;c.lineWidth=1.8;c.stroke();
    if(e.style==='swallowtail') polygon(c,[[21,19],[23,39],[15,23]],wing);
    if(e.style==='monarch'||e.style==='swallowtail') { for(let i=0;i<5;i++) curve(c,[2,1],[12+i*3,-10],[10+i*6,-24+i*2],pattern,1);for(let i=0;i<7;i++)ellipse(c,10+i*4,-22+Math.sin(i*.5)*5,1.3,1.3,col(e,3)); }
    else { ellipse(c,23,-12,e.style==='moth'?8:6,7,pattern);ellipse(c,23,-12,3,3,col(e,3));ellipse(c,17,17,3,3,pattern); }
    c.restore();
  }
  ellipse(c,0,0,2.5,19,col(e,0));ellipse(c,0,-19,3.4,3.6,col(e,0));curve(c,[-1,-20],[-9,-32],[-11,-28],col(e,0),1);curve(c,[1,-20],[9,-32],[11,-28],col(e,0),1);c.restore();
}
function fern(c,n,t) { const e=n.e;for(const side of [-1,1])for(let f=0;f<3;f++){const tipX=side*(20+f*13),tipY=-65+f*11,sway=Math.sin(t+n.phase+f*.6)*4;curve(c,[0,0],[tipX*.45+sway,-45],[tipX+sway,tipY],col(e,0),1.4);for(let i=1;i<9;i++){const u=i/9,x=tipX*u*u+sway*u,y=tipY*u,leaf=(1-u)*12+2;ellipse(c,x-side*leaf*.45,y+3,leaf,2,col(e,1),side*.45);ellipse(c,x+side*leaf*.45,y-3,leaf,2,col(e,2),side*-.65);}} }
function bush(c,n,t) {const e=n.e;for(let i=0;i<13;i++){const a=i*2.4,r=22*Math.sqrt(i/13);ellipse(c,Math.cos(a)*r+Math.sin(t+n.phase)*2, -22+Math.sin(a)*r*.6,13,16,col(e,1+i%2));}for(let i=0;i<5;i++)curve(c,[0,0],[i*4-8,-15],[i*9-18,-37],col(e,0),1.4);}
function reeds(c,n,t) {const e=n.e;for(let i=0;i<3;i++){const x=(i-1)*7,tip=-65-i*8,sway=Math.sin(t*1.3+n.phase+i*.5)*7;curve(c,[x,0],[x+sway*.2,-40],[x+sway,tip],col(e,0),1.7);ellipse(c,x+sway,tip-7,3.2,12,col(e,1),sway*.012);curve(c,[x,-15],[x+22,-58],[x+16+sway,-75],col(e,0),1.1);}}
function tree(c,n,t) {
 const e=n.e,kind=e.kind;c.save();c.rotate(Math.sin(t*.7+n.phase)*.025);
 if(kind==='palm') { curve(c,[0,0],[-14,-40],[0,-77],col(e,0),6);for(let i=0;i<7;i++){const a=(i/6)*Math.PI-Math.PI,tip=[Math.cos(a)*42,-75+Math.sin(a)*26+15];curve(c,[0,-77],[tip[0]*.5,-96],[...tip],col(e,1),3);for(let j=1;j<6;j++){const u=j/6,x=tip[0]*u,y=-77+(tip[1]+77)*u-12*Math.sin(u*Math.PI);line(c,[[x,y],[x+(i<3?-7:7),y+12]],col(e,2),1.4);}} }
 else { polygon(c,[[-5,0],[-3,-80],[3,-80],[6,0]],col(e,0));
 if(kind==='pine') { for(let i=0;i<4;i++){const y=-98+i*18,w=15+i*7;polygon(c,[[0,y],[-w,y+34],[-w*.45,y+30],[-w*.7,y+42],[w*.7,y+42],[w*.45,y+30],[w,y+34]],col(e,1+i%2));} }
 else {for(let i=0;i<7;i++){const sign=i%2?-1:1;curve(c,[0,-20-i*5],[sign*12,-48-i*4],[sign*(20+i*2),-64-i*3],col(e,0),2.5);}
 if(kind==='willow') {for(let i=0;i<13;i++){const x=(i-6)*5,y=-82+Math.abs(i-6)*2;ellipse(c,x,y,13,12,col(e,1));curve(c,[x,y],[x+Math.sin(i)*5,y+32],[x+Math.sin(t+n.phase+i)*4,y+65-Math.abs(i-6)*3],col(e,2),2.4);} }
 else {const rng=random(e.seed+n.i*91+7),amount=kind==='cherry-blossom'?28:15;for(let i=0;i<amount;i++){const a=i*2.4,r=31*Math.sqrt(i/amount),x=Math.cos(a)*r,y=-76+Math.sin(a)*r*.7;if(kind==='cherry-blossom'){ellipse(c,x,y,8+4*rng(),8+4*rng(),col(e,1));for(let j=0;j<3;j++){const xx=x+(rng()-.5)*12,yy=y+(rng()-.5)*12;ellipse(c,xx,yy,2.5,2.5,col(e,2));}}else ellipse(c,x,y,kind==='birch'?11:16,kind==='birch'?16:14,col(e,1+i%2));} }
 if(kind==='birch')for(let i=0;i<9;i++)line(c,[[-3,-7-i*8],[i%2?1:4,-8-i*8]],col(e,2),1.1);
 }
 }
 c.restore();
 // Three drifting blossoms per cherry tree; they share the existing bounded tree count.
 if(kind==='cherry-blossom')for(let i=0;i<3;i++){const f=(t*.035+i/3+n.variant)%1;c.save();c.translate(Math.sin(t*.5+i+n.phase)*20+i*8-8,-80+f*85);c.rotate(t*.5+i);ellipse(c,0,0,2.4,4,col(e,2));c.restore();}
}
function bird(c,n,t) { const e=n.e,a=Math.sin(t*5+n.phase)*16;curve(c,[0,0],[-14,-5-a],[-31,-a],col(e,0),2.7);curve(c,[0,0],[14,-5-a],[31,-a],col(e,0),2.7);ellipse(c,0,0,4,7,col(e,1));polygon(c,[[0,5],[-5,15],[5,15]],col(e,0));}
function petal(c,n,t) {c.rotate(t*.8+n.phase);ellipse(c,0,0,35,14,col(n.e,0));}
function customPart(c,p,t,phase) {
 c.save();const a=p.animate;
 if(a){const z=t*a.speed,amp=a.amount;
 switch(a.kind){case 'sway':c.translate(50,100);c.rotate(Math.sin(z+phase)*amp*.35);c.translate(-50,-100);break;case 'flutter':c.translate(50,50);c.scale(Math.max(.08,1-amp*.92*(.5+.5*Math.sin(z*9+phase))),1);c.translate(-50,-50);break;case 'rotate':c.translate(50,50);c.rotate(z*amp+phase*amp);c.translate(-50,-50);break;case 'pulse':{const k=1+Math.sin(z*2+phase)*amp*.18;c.translate(50,50);c.scale(k,k);c.translate(-50,-50);break}case 'drift':c.translate(Math.sin(z*.6+phase)*amp*18,Math.cos(z*.4+phase)*amp*12);break;case 'wander':c.translate((Math.sin(z*.7+phase)+Math.sin(z*.23+phase))*amp*12,Math.sin(z*.53+phase)*amp*15);break;}}
 const draw=()=>{const ps=p.points;c.beginPath();if(p.shape==='ellipse'){const a=ps[0],b=ps[1];c.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])/2,Math.abs(b[1]-a[1])/2,0,0,TAU);}else if(p.shape==='circle'){c.arc(...ps[0],Math.hypot(ps[1][0]-ps[0][0],ps[1][1]-ps[0][1]),0,TAU);}else if(p.shape==='polygon'){ps.forEach((pt,i)=>i?c.lineTo(...pt):c.moveTo(...pt));c.closePath();}else{c.moveTo(...ps[0]);if(ps.length===2)c.lineTo(...ps[1]);else{for(let i=1;i<ps.length-1;i++)c.quadraticCurveTo(...ps[i],(ps[i][0]+ps[i+1][0])/2,(ps[i][1]+ps[i+1][1])/2);c.lineTo(...ps[ps.length-1]);}}if(p.fill!==undefined){c.fillStyle=p.fill;c.fill();}if(p.stroke!==undefined){c.strokeStyle=p.stroke;c.lineWidth=1.25;c.lineCap='round';c.lineJoin='round';c.stroke();}};
 draw();if(p.mirror!=='none'){c.save();p.mirror==='x'?(c.translate(100,0),c.scale(-1,1)):(c.translate(0,100),c.scale(1,-1));draw();c.restore();}c.restore();
}
function paint(c,nodes,w,h,time) {
 c.clearRect(0,0,w,h);
 for(const n of nodes){const e=n.e,t=time*e.speed,[ax,ay,b]=anchor(n,w,h);let x=ax,y=ay;
 if(e.type==='butterfly') {const z=t+n.variant*n.period,phase=z%n.period,fly=phase<n.period-3,blend=Math.min(1,Math.max(0,Math.min(phase/2,(n.period-3-phase)/2)));const wanderX=Math.sin(t*.47+n.phase)*Math.min(w*(b[2]-b[0])*.16,130),wanderY=Math.sin(t*.71+n.phase)*Math.min(h*(b[3]-b[1])*.22,100);x+=wanderX*(fly?blend:0);y+=wanderY*(fly?blend:0);}
 if(e.type==='bird'){const u=(n.x+t*.027)%1;x=(b[0]+u*(b[2]-b[0]))*w;y=ay+Math.sin(t*.5+n.phase)*h*.035;}
 if(e.type==='falling-petals'){const f=(n.y+t*.055)%1;x=(b[0]+n.x*(b[2]-b[0]))*w+Math.sin(t*.8+n.phase)*25;y=(b[1]+f*(b[3]-b[1]))*h;}
 c.save();c.translate(x,y);c.scale(n.size/100,n.size/100);
 switch(e.type){case 'flower':flower(c,n,t);break;case 'butterfly':butterfly(c,n,t);break;case 'tree':tree(c,n,t);break;case 'fern':fern(c,n,t);break;case 'bush':bush(c,n,t);break;case 'reeds':reeds(c,n,t);break;case 'bird':bird(c,n,t);break;case 'falling-petals':petal(c,n,t);break;case 'custom':c.translate(-50,-50);for(let j=0;j<e.parts.length;j++)customPart(c,e.parts[j],t,n.phase);break;}
 c.restore();}
}
function capabilities(){return copy({version:'1.0.0',types:TYPES,variants:{flower:{species:SPECIES},butterfly:{style:STYLES},tree:{kind:KINDS}},shared:{count:{range:'1 to per-type maximum',defaults:Object.fromEntries(TYPES.map(t=>[t,DEFAULTS[t][0]])),maximums:Object.fromEntries(TYPES.map(t=>[t,DEFAULTS[t][2]]))},size:{min:8,max:300,unit:'CSS pixels per 100-unit drawing box',defaults:Object.fromEntries(TYPES.map(t=>[t,DEFAULTS[t][1]]))},density:{min:0,max:2,default:1,meaning:'Effective count = round(count × density), capped at the per-type maximum'},colors:{minItems:1,maxItems:8,format:'#RGB, #RGBA, #RRGGBB or #RRGGBBAA',required:'All generators; custom parts require their own fill or stroke; custom colors is optional'},speed:{min:0,max:3,default:1},area:{values:AREAS,defaults:'bottom for plants, full for flying elements, petals and custom'},seed:{min:0,max:4294967295,integer:true,default:1}},custom:{name:{minLength:1,maxLength:80},parts:{min:1,max:40},points:{maxTotal:300,coordinateMin:0,coordinateMax:100,format:'[x,y]'},shapes:{ellipse:'Exactly two opposite bounding-box corners; nonzero width and height',circle:'Exactly two points: centre and a point on circumference; circle must fit 0–100',polygon:'At least three vertices; closed',path:'At least two points; smooth quadratic interpolation for 3+ points; open stroke'},fill:'Optional #hex; fill or stroke required',stroke:'Optional #hex; 1.25 local-unit width',mirror:{values:['x','y','none'],default:'none',meaning:'Draw original plus reflection across x=50 or y=50'},animate:{kind:ANIMATIONS,amount:{min:0,max:1,default:.3},speed:{min:.2,max:2,default:1},default:'No part animation when animate omitted'}},limits:LIMITS,behaviour:{unknownFields:'Rejected',failedRender:'Previous valid scene preserved',hiddenTab:'No animation frames requested',reducedMotion:'Static pose; no animation frames requested',network:'None',instanceBudget:'Includes three drifting blossoms per cherry tree',canvas:'Transparent overlay, pointer-events none',colors:'Only from spec; generator color indices wrap through supplied array',clear:'Erase and stop animation',dispose:'Remove canvas and observers/listeners; stop animation'}});}
class Engine {
 constructor(root){
  if(!root||root.nodeType!==1||typeof root.appendChild!=='function'||typeof root.getBoundingClientRect!=='function') throw new TypeError('VQArt.create requires a DOM element root');
  this.root=root;this.dead=false;this.nodes=[];this.spec={elements:[]};this.clock=0;this.last=0;this.next=0;this.raf=0;this.w=0;this.h=0;this.scale=1;
  this.canvas=document.createElement('canvas');this.canvas.className='vq-art-canvas';this.canvas.setAttribute('aria-hidden','true');this.canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;background:transparent;';this.ctx=this.canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas 2D is unavailable');
  this.previousPosition=root.style.position;this.changedPosition=getComputedStyle(root).position==='static';if(this.changedPosition)root.style.position='relative';root.appendChild(this.canvas);
  this.media=global.matchMedia?global.matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  this.onVisibility=()=>{this.stop();this.sync();};this.onMotion=()=>{this.stop();this.draw();this.sync();};this.onResize=()=>{if(this.dead)return;this.resize();this.draw();this.sync();};
  document.addEventListener('visibilitychange',this.onVisibility);if(this.media.addEventListener)this.media.addEventListener('change',this.onMotion);else this.media.addListener?.(this.onMotion);
  if(typeof global.ResizeObserver==='function'){this.observer=new global.ResizeObserver(this.onResize);this.observer.observe(root);}else global.addEventListener('resize',this.onResize);
  this.tick=this.tick.bind(this);this.resize();
 }
 resize(){const r=this.root.getBoundingClientRect();this.w=Math.max(0,Number.isFinite(r.width)?r.width:0);this.h=Math.max(0,Number.isFinite(r.height)?r.height:0);const w=Math.max(1,this.w),h=Math.max(1,this.h);this.scale=Math.min(global.devicePixelRatio||1,LIMITS.dpr,LIMITS.canvasDimension/w,LIMITS.canvasDimension/h,Math.sqrt(LIMITS.canvasPixels/(w*h)));this.canvas.width=Math.max(1,Math.floor(w*this.scale));this.canvas.height=Math.max(1,Math.floor(h*this.scale));this.ctx.setTransform(this.scale,0,0,this.scale,0,0);}
 draw(){if(this.dead)return;paint(this.ctx,this.nodes,this.w,this.h,this.media.matches?0:this.clock);}
 active(){return !this.dead&&!document.hidden&&!this.media.matches&&this.w>0&&this.h>0&&this.nodes.some(n=>n.e.speed>0&&(n.e.type!=='custom'||n.e.parts.some(p=>p.animate&&p.animate.amount>0)));}
 stop(){if(this.raf)global.cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.next=0;}
 sync(){if(this.active()){if(!this.raf)this.raf=global.requestAnimationFrame(this.tick);}else this.stop();}
 tick(now){this.raf=0;if(!this.active()){this.stop();return;}if(!this.last)this.last=now;if(now+.01>=this.next){this.clock+=Math.min(.1,Math.max(0,(now-this.last)/1000));this.last=now;this.next=now+1000/LIMITS.fps;try{this.draw();}catch(_){this.stop();return;}}this.sync();}
 render(spec){if(this.dead)return {ok:false,error:'Engine has been disposed'};let old;try{const parsed=validate(spec),nodes=instances(parsed);old={nodes:this.nodes,spec:this.spec,clock:this.clock};this.stop();this.nodes=nodes;this.spec=parsed;this.clock=0;this.resize();this.draw();this.sync();return {ok:true};}catch(e){if(old){this.nodes=old.nodes;this.spec=old.spec;this.clock=old.clock;try{this.draw();this.sync();}catch(_){this.stop();}}return {ok:false,error:String(e?.message||'Invalid scene')};}}
 clear(){if(this.dead)return;this.stop();this.nodes=[];this.spec={elements:[]};this.clock=0;this.ctx.clearRect(0,0,this.w,this.h);}
 dispose(){if(this.dead)return;this.clear();this.dead=true;this.observer?.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);if(this.media.removeEventListener)this.media.removeEventListener('change',this.onMotion);else this.media.removeListener?.(this.onMotion);global.removeEventListener?.('resize',this.onResize);this.canvas.remove();if(this.changedPosition&&this.root.style.position==='relative')this.root.style.position=this.previousPosition;}
}
const VQArt={create({root}={}){return new Engine(root);},capabilities};
if(typeof module!=='undefined'&&module.exports)module.exports=VQArt;
global.VQArt=VQArt;
})(typeof window!=='undefined'?window:globalThis);
