const fs=require('fs'),D=__dirname,html=fs.readFileSync(D+'/index.html','utf8');const src=html.match(/<script id="dsp">([\s\S]*?)<\/script>/)[1];
const m={exports:{}};new Function('module',src)(m);const A=m.exports,SR=48000;let pass=0,fail=0;const ok=(name,c,info)=>{console.log((c?'✅':'❌')+' '+name+' → '+info);c?pass++:fail++;};
const r=(()=>{let s=1;return()=>((s=s*16807%2147483647)/2147483647-0.5)})();
// 1 ultrasonido: ruido suave + voz-ish, con 19 kHz entre 2 y 3 s
let x=new Float32Array(SR*5).map((_,i)=>0.2*Math.sin(2*Math.PI*300*i/SR)+0.01*r());const u=A.tone(SR,19000,1,0.2);for(let i=0;i<u.length;i++)x[2*SR+i]+=u[i];
let S=A.stft(x,2048,0,x.length-2048,500),h=A.detectHigh(S,SR,17000);ok('banda casi ultrasónica',h.segments.length===1&&Math.abs(h.segments[0][0]-2)<0.1&&Math.abs(h.segments[0][1]-3)<0.1,JSON.stringify(h.segments.map(s=>s.map(v=>+v.toFixed(2))))+' '+h.percent.toFixed(1)+'%');
// 2 tono puro: ruido + 1234 Hz fijo débil
x=new Float32Array(SR*4).map((_,i)=>0.3*r()+0.05*Math.sin(2*Math.PI*1234*i/SR));S=A.stft(x,4096,0,x.length-4096,300);const t=A.detectTones(S,SR);ok('tono puro',t.length>=1&&Math.abs(t[0].freq-1234)<15,JSON.stringify(t.slice(0,3)));
// 3 DTMF
x=A.synthDTMF(SR,'1234');for(let i=0;i<x.length;i++)x[i]+=0.01*r();const d=A.dtmf(x,SR).map(e=>e.d).join('');ok('DTMF',d==='1234','"'+d+'"');
// 4 morse
x=A.synthMorse(SR,'SOS',800,0.06);for(let i=0;i<x.length;i++)x[i]+=0.02*r();const mo=A.morse(x,SR);ok('morse',mo.text.trim()==='SOS'&&mo.ok,JSON.stringify(mo));
const mo2=A.morse(A.demo(SR)[1],SR);ok('morse no da falso positivo en voz',!mo2.ok,'ok='+mo2.ok+' conf='+(mo2.conf||0).toFixed(2));
// 5 bytes
const png=fs.readFileSync(D+'/test/mini.png'),txt=fs.readFileSync(D+'/test/nota.txt');const mp=A.magic(png),mt=A.magic(txt),sp=A.strings(png),st=A.strings(txt);
ok('firma PNG',mp.kind==='imagen PNG',mp.kind+' '+mp.sig);ok('strings PNG',sp.some(s=>s.includes('Hola Barbie')),JSON.stringify(sp));ok('firma texto',mt.kind==='texto',mt.kind);ok('strings texto',st.some(s=>s.includes('mensaje secreto')),JSON.stringify(st));
// 6 demo: estéreo L-R y banda alta
const [L,R]=A.demo(SR),sd=A.stereoDiff(L,R);S=A.stft(L,2048,0,L.length-2048,600);h=A.detectHigh(S,SR,15000);ok('demo: alta 1.5–4.5 s y diferencia L−R',h.segments.length>=1&&Math.abs(h.segments[0][0]-1.5)<0.15&&sd.ratioDb>-30,JSON.stringify(h.segments.map(s=>s.map(v=>+v.toFixed(2))))+' L−R '+sd.ratioDb.toFixed(1)+' dB');
const si=A.silences(A.cat(A.tone(SR,440,1),new Float32Array(SR),A.tone(SR,440,1)),SR);ok('silencio',si.length===1&&Math.abs(si[0][0]-1)<0.05,JSON.stringify(si));
console.log(pass+' bien, '+fail+' mal');process.exit(fail?1:0);
