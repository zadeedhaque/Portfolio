/* Self-contained neon WebGL hero. No dependencies. */
(function (global) {
  'use strict';

  /* ---------- mat4 ---------- */
  const M = {
    id: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
    mul(a, b, o) { o = o || new Float32Array(16);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        let s = 0; for (let k = 0; k < 4; k++) s += a[k*4+j] * b[i*4+k];
        o[i*4+j] = s; } return o; },
    persp(fov, asp, n, f, sh, sv) { const t = 1 / Math.tan(fov/2), o = new Float32Array(16);
      o[8]=-(sh||0); o[9]=-(sv||0); o[0]=t/asp; o[5]=t; o[10]=(f+n)/(n-f); o[11]=-1; o[14]=2*f*n/(n-f); return o; },
    trs(tx,ty,tz, rx,ry,rz, sx,sy,sz) {
      const cx=Math.cos(rx),sx_=Math.sin(rx),cy=Math.cos(ry),sy_=Math.sin(ry),cz=Math.cos(rz),sz_=Math.sin(rz);
      const m=new Float32Array(16);
      const r00=cy*cz+sy_*sx_*sz_, r01=cx*sz_, r02=-sy_*cz+cy*sx_*sz_;
      const r10=-cy*sz_+sy_*sx_*cz, r11=cx*cz, r12=sy_*sz_+cy*sx_*cz;
      const r20=sy_*cx, r21=-sx_, r22=cy*cx;
      m[0]=r00*sx; m[1]=r10*sx; m[2]=r20*sx;
      m[4]=r01*sy; m[5]=r11*sy; m[6]=r21*sy;
      m[8]=r02*sz; m[9]=r12*sz; m[10]=r22*sz;
      m[12]=tx; m[13]=ty; m[14]=tz; m[15]=1; return m; },
    look(ex,ey,ez, cx,cy,cz) {
      let zx=ex-cx, zy=ey-cy, zz=ez-cz; let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
      let xx=zz, xy=0, xz=-zx; l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
      const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
      return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
        -(xx*ex+xy*ey+xz*ez), -(yx*ex+yy*ey+yz*ez), -(zx*ex+zy*ey+zz*ez), 1]); }
  };

  /* ---------- geometry ---------- */
  function boxGeo(w, h, d) {
    const x=w/2, y=h/2, z=d/2, P=[], N=[], U=[], I=[], E=[];
    const F=[[[ x,-y, z],[ x,-y,-z],[ x, y,-z],[ x, y, z],[1,0,0]],
             [[-x,-y,-z],[-x,-y, z],[-x, y, z],[-x, y,-z],[-1,0,0]],
             [[-x, y, z],[ x, y, z],[ x, y,-z],[-x, y,-z],[0,1,0]],
             [[-x,-y,-z],[ x,-y,-z],[ x,-y, z],[-x,-y, z],[0,-1,0]],
             [[-x,-y, z],[ x,-y, z],[ x, y, z],[-x, y, z],[0,0,1]],
             [[ x,-y,-z],[-x,-y,-z],[-x, y,-z],[ x, y,-z],[0,0,-1]]];
    F.forEach((f, i) => { const b = i*4;
      for (let k = 0; k < 4; k++) { P.push(...f[k]); N.push(...f[4]); }
      U.push(0,0, 1,0, 1,1, 0,1);
      I.push(b,b+1,b+2, b,b+2,b+3);
      E.push(b,b+1, b+1,b+2, b+2,b+3, b+3,b); });
    return { P, N, U, I, E };
  }
  function polyGeo(verts, faces) {
    const P=[], N=[], U=[], I=[], E=[], seen={};
    faces.forEach(f => {
      const b = P.length/3, a = verts[f[0]], c = verts[f[1]], d = verts[f[2]];
      const u=[c[0]-a[0],c[1]-a[1],c[2]-a[2]], v=[d[0]-a[0],d[1]-a[1],d[2]-a[2]];
      let n=[u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
      const l=Math.hypot(...n)||1; n=n.map(q=>q/l);
      f.forEach(idx => { P.push(...verts[idx]); N.push(...n); });
      U.push(0,0, 1,0, .5,1);
      I.push(b,b+1,b+2);
      for (let k=0;k<f.length;k++){ const p=f[k], q=f[(k+1)%f.length], key=Math.min(p,q)+'_'+Math.max(p,q);
        if(!seen[key]){ seen[key]=1; E.push(b+k, b+(k+1)%f.length); } }
    });
    return { P, N, U, I, E };
  }
  const tetraGeo = () => polyGeo(
    [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]],
    [[0,1,2],[0,3,1],[0,2,3],[1,3,2]]);
  const octaGeo = () => polyGeo(
    [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
    [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]]);
  function torusGeo(R, r, seg, ring) {
    const P=[],N=[],U=[],I=[],E=[];
    for (let i=0;i<=seg;i++){ const u=i/seg*Math.PI*2;
      for (let j=0;j<=ring;j++){ const v=j/ring*Math.PI*2;
        const cx=R*Math.cos(u), cy=R*Math.sin(u);
        P.push(cx+r*Math.cos(v)*Math.cos(u), cy+r*Math.cos(v)*Math.sin(u), r*Math.sin(v));
        N.push(Math.cos(v)*Math.cos(u), Math.cos(v)*Math.sin(u), Math.sin(v));
        U.push(i/seg, j/ring); } }
    const row = ring+1;
    for (let i=0;i<seg;i++) for (let j=0;j<ring;j++){
      const a=i*row+j, b=a+row;
      I.push(a,b,a+1, b,b+1,a+1);
      if (j%3===0) E.push(a,b);
      if (i%2===0) E.push(a,a+1); }
    return { P,N,U,I,E };
  }
  function knotGeo(R, r, seg, ring, p, q) {
    const P=[],N=[],U=[],I=[],E=[];
    const pt = t => { const c = R*(2+Math.cos(q*t))*0.5;
      return [c*Math.cos(p*t), c*Math.sin(p*t), R*Math.sin(q*t)*0.5]; };
    for (let i=0;i<=seg;i++){ const t=i/seg*Math.PI*2;
      const c=pt(t), n1=pt(t+0.01);
      let T=[n1[0]-c[0], n1[1]-c[1], n1[2]-c[2]]; let l=Math.hypot(...T)||1; T=T.map(x=>x/l);
      let Nv=[-T[1],T[0],0]; l=Math.hypot(...Nv)||1; Nv=Nv.map(x=>x/l);
      const B=[T[1]*Nv[2]-T[2]*Nv[1], T[2]*Nv[0]-T[0]*Nv[2], T[0]*Nv[1]-T[1]*Nv[0]];
      for (let j=0;j<=ring;j++){ const v=j/ring*Math.PI*2, cs=Math.cos(v), sn=Math.sin(v);
        const nx=Nv[0]*cs+B[0]*sn, ny=Nv[1]*cs+B[1]*sn, nz=Nv[2]*cs+B[2]*sn;
        P.push(c[0]+r*nx, c[1]+r*ny, c[2]+r*nz); N.push(nx,ny,nz); U.push(i/seg, j/ring); } }
    const row = ring+1;
    for (let i=0;i<seg;i++) for (let j=0;j<ring;j++){
      const a=i*row+j, b=a+row;
      I.push(a,b,a+1, b,b+1,a+1);
      if (j%4===0) E.push(a,b); }
    return { P,N,U,I,E };
  }
  function planeGeo(w,h){ const x=w/2,y=h/2;
    return { P:[-x,-y,0, x,-y,0, x,y,0, -x,y,0], N:[0,0,1, 0,0,1, 0,0,1, 0,0,1],
             U:[0,1, 1,1, 1,0, 0,0], I:[0,1,2, 0,2,3], E:[0,1,1,2,2,3,3,0] }; }


  function cylGeo(r, h, seg) {
    const P=[],N=[],U=[],I=[],E=[];
    for (let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2, c=Math.cos(a), s=Math.sin(a);
      P.push(r*c,-h/2,r*s, r*c,h/2,r*s); N.push(c,0,s, c,0,s); U.push(i/seg,0, i/seg,1); }
    for (let i=0;i<seg;i++){ const a=i*2; I.push(a,a+1,a+2, a+1,a+3,a+2); if(i%2===0) E.push(a,a+1); E.push(a+1,a+3); E.push(a,a+2); }
    const b=P.length/3; P.push(0,h/2,0); N.push(0,1,0); U.push(.5,.5);
    for (let i=0;i<=seg;i++){ const a=i/seg*Math.PI*2; P.push(r*Math.cos(a),h/2,r*Math.sin(a)); N.push(0,1,0); U.push(.5,.5); }
    for (let i=0;i<seg;i++) I.push(b,b+1+i,b+2+i);
    return { P,N,U,I,E };
  }
  function rockGeo(seed) {
    let r = seed * 9301 + 49297; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    const t = (1 + Math.sqrt(5)) / 2;
    let v = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
      .map(p => { const l = Math.hypot(...p); const j = .72 + rnd() * .55; return p.map(x => x / l * j); });
    const f = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
               [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    return polyGeo(v, f);
  }

  /* ---------- canvas textures ---------- */
  function texCanvas(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h); return c;
  }
  const labelTex = (txt, col, bg) => texCanvas(256, 256, (x, w, h) => {
    x.fillStyle = bg || 'rgba(8,10,22,0.92)'; x.fillRect(0,0,w,h);
    x.strokeStyle = col; x.lineWidth = 6; x.strokeRect(3,3,w-6,h-6);
    x.fillStyle = col; x.font = 'bold 74px ui-monospace,Consolas,monospace';
    x.textAlign='center'; x.textBaseline='middle';
    x.shadowColor = col; x.shadowBlur = 26; x.fillText(txt, w/2, h/2);
  });
  const codeTex = (col) => texCanvas(256, 160, (x, w, h) => {
    x.fillStyle = 'rgba(6,8,18,0.95)'; x.fillRect(0,0,w,h);
    x.strokeStyle = col; x.lineWidth = 4; x.strokeRect(2,2,w-4,h-4);
    x.fillStyle = col; x.fillRect(2,2,w-4,16);
    const cols = ['#2fc4ad','#ffd23f','#ff3b76','#7a4dff','#a3a6c4'];
    x.font = '11px ui-monospace,Consolas,monospace'; x.shadowBlur = 8;
    for (let i = 0; i < 9; i++) {
      const c = cols[i % cols.length]; x.fillStyle = c; x.shadowColor = c;
      x.fillText('▍'.repeat(1) + '─'.repeat(3 + (i*5)%14), 12 + (i%3)*8, 38 + i*13);
    }
  });

  const laptopTex = () => texCanvas(512, 320, (x, w, h) => {
    x.fillStyle = 'rgba(6,8,20,0.96)'; x.fillRect(0,0,w,h);
    x.strokeStyle = '#2fc4ad'; x.lineWidth = 6; x.strokeRect(3,3,w-6,h-6);
    x.fillStyle = '#2fc4ad'; x.fillRect(3,3,w-6,14);
    x.font = 'italic bold 60px "Segoe Script","Brush Script MT",cursive,sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowBlur = 22;
    [['Build','#ffd23f'],['Create','#ff3b76'],['Play','#7a4dff'],['Repeat','#2fc4ad']].forEach((l, i) => {
      x.fillStyle = l[1]; x.shadowColor = l[1]; x.fillText(l[0], w/2 + (i%2?14:-14), 58 + i*68); });
  });
  const aeTex = () => texCanvas(256, 256, (x, w, h) => {
    x.fillStyle = 'rgba(16,10,52,0.96)'; x.fillRect(0,0,w,h);
    x.strokeStyle = '#a58bff'; x.lineWidth = 8; x.strokeRect(4,4,w-8,h-8);
    x.fillStyle = '#c9b8ff'; x.font = 'bold 118px system-ui,Arial,sans-serif'; x.textAlign='center'; x.textBaseline='middle';
    x.shadowColor = '#7a4dff'; x.shadowBlur = 30; x.fillText('Ae', w/2, h/2 + 6);
  });
  const spriteTex = () => texCanvas(128, 128, (x, w, h) => {
    const g = x.createRadialGradient(w/2,h/2,0, w/2,h/2,w/2);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.35,'rgba(255,255,255,.35)');
    g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0,0,w,h);
  });

  /* ---------- renderer ---------- */
  const VS = `attribute vec3 aP; attribute vec3 aN; attribute vec2 aU;
uniform mat4 uProj, uView, uModel; varying vec3 vN, vW, vP; varying vec2 vU;
void main(){ vP = aP; vec4 w = uModel * vec4(aP,1.0); vW = w.xyz;
  vN = mat3(uModel) * aN; vU = aU; gl_Position = uProj * uView * w; }`;
  const FS = `precision mediump float;
varying vec3 vN, vW, vP; varying vec2 vU;
uniform vec3 uColor, uCam; uniform float uEmis, uAlpha, uMode; uniform sampler2D uTex;
void main(){
  if (uMode > 2.5) { vec4 t = texture2D(uTex, vU); if (t.a < 0.06) discard;
    vec3 N = normalize(vN); vec3 V = normalize(uCam - vW);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.0);
    vec3 L = normalize(vec3(-0.4, 0.5, 0.75)); float d = 0.93 + 0.14 * dot(N, L);
    float fade = smoothstep(-0.48, -0.24, vP.y);
    gl_FragColor = vec4(t.rgb * d * (1.0 + uEmis) + uColor * rim * (0.28 + uEmis) * t.a, t.a * fade); return; }
  if (uMode > 1.5) { vec4 t = texture2D(uTex, vU);
    gl_FragColor = vec4(uColor * t.a * uAlpha, t.a * uAlpha); return; }
  if (uMode > 0.5) { gl_FragColor = vec4(uColor * (1.2 + uEmis), uAlpha); return; }
  vec3 N = normalize(vN); vec3 V = normalize(uCam - vW);
  float f = pow(1.0 - abs(dot(N, V)), 2.0);
  vec3 base = uColor * (0.06 + 0.70 * f + uEmis);
  float a = uAlpha * (0.14 + 0.72 * f);
  vec4 t = texture2D(uTex, vU);
  if (uMode < -0.5) { base = mix(base, t.rgb * (1.5 + uEmis), t.a); a = max(a, t.a * uAlpha); }
  gl_FragColor = vec4(base, a); }`;

  function compile(gl, src, type) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }


  /* the photo cutout becomes a gently inflated relief mesh, so it has real depth when it tilts */
  function cutoutGeo(img, bulge) {
    const GX = 72, GY = Math.round(GX * img.height / img.width);
    const c = document.createElement('canvas'); c.width = GX; c.height = GY;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, GX, GY);
    const d = x.getImageData(0, 0, GX, GY).data;
    let h = new Float32Array(GX*GY); for (let i = 0; i < GX*GY; i++) h[i] = d[i*4+3] / 255;
    for (let pass = 0; pass < 5; pass++) {           /* box blur = soft inflate */
      const t = new Float32Array(GX*GY);
      for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
        let s = 0, n = 0;
        for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) {
          const ii = i+di, jj = j+dj; if (ii < 0 || jj < 0 || ii >= GX || jj >= GY) { s += h[j*GX+i]; n++; continue; }
          s += h[jj*GX+ii]; n++; }
        t[j*GX+i] = s / n; }
      h = t;
    }
    const P = [], N = [], U = [], I = [], asp = img.height / img.width;
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
      const u = i / (GX-1), v = j / (GY-1), z = h[j*GX+i] * bulge;
      P.push((u-.5), (.5-v)*asp, z); U.push(u, v);
      const l = h[j*GX+Math.max(0,i-1)], r = h[j*GX+Math.min(GX-1,i+1)], up = h[Math.max(0,j-1)*GX+i], dn = h[Math.min(GY-1,j+1)*GX+i];
      let nx = -(r-l) * bulge * GX * .5, ny = (dn-up) * bulge * GX * .5 / asp, nz = 1; const ln = Math.hypot(nx, ny, nz);
      N.push(nx/ln, ny/ln, nz/ln);
    }
    for (let j = 0; j < GY-1; j++) for (let i = 0; i < GX-1; i++) {
      const a = j*GX+i, b = a+1, c2 = a+GX, d2 = c2+1; I.push(a, c2, b, b, c2, d2); }
    return { P: new Float32Array(P), N: new Float32Array(N), U: new Float32Array(U), I: new Uint16Array(I), E: [], asp };
  }

  function initHero(canvas, opts) {
    opts = opts || {};
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, VS, gl.VERTEX_SHADER));
    gl.attachShader(prog, compile(gl, FS, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const A = { p: gl.getAttribLocation(prog,'aP'), n: gl.getAttribLocation(prog,'aN'), u: gl.getAttribLocation(prog,'aU') };
    const U = {}; ['uProj','uView','uModel','uColor','uCam','uEmis','uAlpha','uMode','uTex']
      .forEach(k => U[k] = gl.getUniformLocation(prog, k));

    function upload(g) {
      const b = {};
      b.p = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b.p); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.P), gl.STATIC_DRAW);
      b.n = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b.n); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.N), gl.STATIC_DRAW);
      b.u = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b.u); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.U), gl.STATIC_DRAW);
      b.i = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g.I), gl.STATIC_DRAW);
      b.e = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.e); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g.E.length ? g.E : [0,0]), gl.STATIC_DRAW);
      b.ni = g.I.length; b.ne = g.E.length; return b;
    }
    function mkTex(src) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    }
    const blank = mkTex(texCanvas(2,2,(x)=>{ x.fillStyle='rgba(0,0,0,0)'; x.fillRect(0,0,2,2); }));
    const glowT = mkTex(spriteTex());

    const G = {
      box: upload(boxGeo(1,1,1)), tetra: upload(tetraGeo()), octa: upload(octaGeo()),
      ring: upload(torusGeo(1, .12, 64, 10)), knot: upload(knotGeo(1, .17, 160, 10, 2, 3)),
      plane: upload(planeGeo(1,1)), book: upload(boxGeo(1, .22, .7)), cyl: upload(cylGeo(.5, 1, 28)),
      rock0: upload(rockGeo(1)), rock1: upload(rockGeo(2)), rock2: upload(rockGeo(3)), slab: upload(boxGeo(1, .1, 1))
    };
    const C = opts.colors || { teal:[.18,.77,.68], sun:[1,.82,.25], mag:[1,.23,.46], plum:[.48,.30,1], ice:[.35,.88,1] };

    /* --- scene --- */
    const objs = [];
    let add = o => { objs.push(Object.assign({
      geo:'box', col:C.teal, pos:[0,0,0], rot:[0,0,0], scale:[1,1,1],
      spin:[.05,.09,0], float:.35, phase:Math.random()*6.28,
      emis:0, alpha:1, tex:null, glow:0, label:null, hoverK:0, pick:0
    }, o)); };

    const SC = opts.scene || 'hero';
    const Sx = opts.Sx || 1, Sy = opts.Sy || 1, S = opts.S || 1;
    const add0 = add;
    add = o => { o = Object.assign({}, o); o.bx = o.pos ? o.pos[0] : 0; o.by = o.pos ? o.pos[1]*Sy : 0;
      if (o.pos) o.pos = [o.pos[0]*Sx, o.pos[1]*Sy, o.pos[2]*S];
      if (o.scale) o.scale = o.scale.map(v => v*S);
      if (o.float != null) o.float *= S;
      add0(o); };
    const cubes = n => { for (let i = 0; i < n; i++) add({
      geo:'box', col:[C.teal,C.sun,C.mag,C.plum,C.ice][i%5],
      pos:[(Math.random()-.5)*20, (Math.random()-.5)*11, -6 - Math.random()*5],
      scale:Array(3).fill(.1 + Math.random()*.14), spin:[Math.random()*.2, Math.random()*.2, 0],
      emis:.45, glow:.28, float:.5 }); };
    if (SC === 'hero') {
      /* behind the avatar */
      add({ geo:'knot', col:C.mag, pos:[.6,.9,-7], scale:[3.9,3.9,3.9], spin:[.03,.05,.01], emis:.45, alpha:1, glow:3.8, float:.2, label:'creative' });
      add({ geo:'plane', col:C.teal, pos:[6.9,5.2,-3.8], grp:'scrT', scale:[3.0,1.9,1], rot:[.05,-.5,.03], spin:[0,0,0], tex:'screen', emis:.1, alpha:.95, glow:2, float:.18, pick:1, label:'build' });
      add({ geo:'plane', col:C.mag, pos:[-6.2,3.6,-3.6], grp:'scrM', scale:[2.8,1.8,1], rot:[.05,.5,-.04], spin:[0,0,0], tex:'screen2', emis:.1, alpha:.95, glow:1.8, float:.22, pick:1, label:'ship' });
      add({ geo:'box', col:C.plum, pos:[-7.3,1,-1.4], grp:'code', scale:[1.4,1.4,1.4], rot:[.4,.7,.15], spin:[.05,.12,0], tex:'code', emis:.18, glow:1.6, pick:1, label:'&lt;/&gt; code' });
      add({ geo:'ring', col:C.teal, pos:[-8.4,-1.4,-4], grp:'ring', scale:[1.5,1.5,1.5], rot:[.9,.3,0], spin:[.02,.07,0], emis:.2, alpha:.8, glow:1.2 });
      add({ geo:'octa', col:C.plum, pos:[-7.6,-3.2,-2.4], grp:'octa', scale:[.8,.8,.8], spin:[.06,.1,0], emis:.18, glow:1, pick:1 });
      /* beside / in front of the avatar */
      add({ geo:'box', col:C.ice, pos:[7.7,-.2,-.8], grp:'ai', scale:[1.3,1.3,1.3], rot:[.3,-.5,-.1], spin:[.04,-.11,0], tex:'ai', emis:.18, glow:1.5, pick:1, label:'AI' });
      /* laptop: screen + base */
      add({ geo:'plane', col:C.teal, pos:[5.6,1.6,.4], grp:'lap', scale:[3.7,2.3,1], rot:[-.12,-.42,.02], spin:[0,0,0], tex:'laptop', emis:.16, alpha:1, glow:2.4, float:.16, phase:1, pick:1, label:'build · create · play · repeat' });
      add({ geo:'slab', col:C.plum, pos:[5.5,.38,.9], grp:'lap', scale:[3.7,1,2], rot:[.04,-.42,0], spin:[0,0,0], emis:.2, alpha:.9, glow:.8, float:.16, phase:1 });
      /* camera */
      add({ geo:'box', col:C.ice, pos:[6.6,4.5,.7], grp:'cam', scale:[1.7,1.1,1], rot:[.15,-.5,.05], spin:[.03,.05,0], emis:.2, glow:1.4, float:.28, pick:1, label:'video' });
      add({ geo:'cyl', col:C.mag, pos:[6.35,4.5,1.35], grp:'cam', scale:[.7,.6,.7], rot:[1.4,-.5,0], spin:[0,0,0], emis:.3, glow:.9, float:.28, pick:1, label:'video' });
      /* gamepad */
      add({ geo:'box', col:C.sun, pos:[7.6,-2.6,1.3], grp:'pad', scale:[2,.5,.9], rot:[.7,-.5,.2], spin:[.02,.05,0], emis:.22, glow:1.2, float:.24, pick:1, label:'gaming' });
      add({ geo:'cyl', col:C.sun, pos:[6.75,-2.35,1.5], grp:'pad', scale:[.55,.7,.55], rot:[.6,-.5,.2], spin:[0,0,0], emis:.25, glow:.5, float:.24, pick:1, label:'gaming' });
      add({ geo:'cyl', col:C.sun, pos:[8.5,-2.85,1.1], grp:'pad', scale:[.55,.7,.55], rot:[.6,-.5,.2], spin:[0,0,0], emis:.25, glow:.5, float:.24, pick:1, label:'gaming' });
      /* After Effects tile */
      add({ geo:'box', col:C.plum, pos:[8.3,-4.1,.5], grp:'ae', scale:[1.1,1.1,.3], rot:[.2,-.4,.15], spin:[.02,.04,0], tex:'ae', emis:.2, glow:1.4, float:.2, pick:1, label:'after effects' });
      /* books */
      ['CREATE','DEVELOP','DESIGN'].forEach((t, i) => add({
        geo:'book', col:[C.teal, C.sun, C.mag][i], pos:[-6.4, -4.5 + i*.5, 1.4],
        scale:[2.4,1,1], rot:[0,.3,-.03], spin:[0,0,0], grp:'books', tex:'book'+i, emis:.14, glow:.7, float:.1, pick:1, label:t }));
      /* rocks along the floor */
      [[-8.6,-5.4,-1.2,1.5,0],[-3.8,-5.9,.4,1.1,1],[0.4,-6.2,-.4,1.7,2],[4.2,-6.0,.6,1.2,0],[8.2,-5.6,-.8,1.6,1],[-6,-6.3,-3,1.9,2],[6.4,-6.4,-3,2.1,0]].forEach((r, i) => add({
        geo:'rock'+r[4], col:[C.plum,C.teal,C.mag][i%3], pos:[r[0],r[1],r[2]], scale:[r[3],r[3]*.7,r[3]], rot:[i,i*1.7,0],
        spin:[0,0,0], emis:0, alpha:.5, glow:.25, float:.02 }));
      add({ geo:'tetra', col:C.sun, pos:[-5.4,-2.6,.6], grp:'tetraL', scale:[.5,.5,.5], spin:[-.09,.11,.04], emis:.2, glow:.9, pick:1 });
      add({ geo:'box', col:C.sun, pos:[-5.2,3.6,-.4], grp:'cubeL', scale:[.4,.4,.4], spin:[.12,.16,.08], emis:.3, glow:.7 });
      add({ geo:'box', col:C.mag, pos:[4.3,5.3,-1.6], scale:[.36,.36,.36], spin:[-.1,.15,.06], emis:.3, glow:.6 });
      cubes(12);
    } else if (SC === 'vpc') {
      add({ geo:'box', col:C.teal, pos:[-1.9,-.3,0], scale:[3.1,.14,2.5], spin:[0,0,0], emis:.2, glow:1.2, float:.1 });
      add({ geo:'box', col:C.plum, pos:[1.9,-.3,0], scale:[3.1,.14,2.5], spin:[0,0,0], emis:.2, glow:1.2, float:.1 });
      [[-2.6,-.7],[-1.2,.7],[1.2,-.7],[2.6,.7]].forEach((p, i) => add({ geo:'box', col:[C.sun,C.mag,C.mag,C.sun][i],
        pos:[p[0],.15,p[1]], scale:[.75,.5,.75], spin:[0,0,0], emis:.3, glow:.9, float:.14, pick:1 }));
      add({ geo:'ring', col:C.ice, pos:[0,-.3,0], scale:[2.5,2.5,2.5], rot:[1.5708,0,0], spin:[0,0,.1], emis:.3, alpha:.8, glow:0, float:0 });
    } else if (SC === 'raft') {
      for (let i = 0; i < 4; i++) add({ geo:'box', col:C.sun, pos:[0,0,-.9+i*.6], scale:[3,.14,.5], spin:[0,0,0], emis:.28, glow:.5, float:.12, phase:0, pick:1 });
      add({ geo:'box', col:C.teal, pos:[0,.9,0], scale:[.07,1.7,.07], spin:[0,0,0], emis:.3, glow:.4, float:.12, phase:0 });
      add({ geo:'plane', col:C.mag, pos:[.55,1,0], scale:[1.1,1.3,1], spin:[0,0,0], emis:.25, alpha:.9, glow:.7, float:.12, phase:0, pick:1 });
      add({ geo:'ring', col:C.teal, pos:[0,-.55,0], scale:[2.1,2.1,2.1], rot:[1.5708,0,0], spin:[0,0,.08], emis:.3, alpha:.7, glow:0, float:.05 });
      add({ geo:'ring', col:C.ice, pos:[0,-.75,0], scale:[3,3,3], rot:[1.5708,0,0], spin:[0,0,-.06], emis:.25, alpha:.5, glow:0, float:.05 });
    } else if (SC === 'web') {
      add({ geo:'plane', col:C.teal, pos:[-.5,.9,-1.2], scale:[3.4,2.1,1], rot:[0,.12,0], spin:[0,0,0], tex:'screen', emis:.12, alpha:.95, glow:1.3, float:.18, pick:1 });
      add({ geo:'plane', col:C.sun, pos:[0,0,0], scale:[3.4,2.1,1], rot:[0,.12,0], spin:[0,0,0], tex:'screen3', emis:.12, alpha:.95, glow:1.3, float:.2, pick:1 });
      add({ geo:'plane', col:C.mag, pos:[.5,-.9,1.2], scale:[3.4,2.1,1], rot:[0,.12,0], spin:[0,0,0], tex:'screen2', emis:.12, alpha:.95, glow:1.3, float:.22, pick:1 });
    } else if (SC === 'page') {
      /* page-wide scene: pixel-scaled props anchored to sections, camera follows scroll */
      const N = opts.pageItems || [];
      const K = {
        cube:   [{ g:'box',  c:'*', sc:[.62,.62,.62], sp:[.16,.22,.06], em:.4,  gl:.5 }],
        octa:   [{ g:'octa', c:'*', sc:[.42,.42,.42], sp:[.1,.16,0], em:.28, gl:.55 }],
        tetra:  [{ g:'tetra',c:'*', sc:[.42,.42,.42], sp:[-.1,.14,.05], em:.28, gl:.55 }],
        code:   [{ g:'box',  c:'plum', sc:[.9,.9,.9], sp:[.05,.13,0], tex:'code', em:.18, gl:.5, r:[.4,.7,.15] }],
        ai:     [{ g:'box',  c:'ice',  sc:[.9,.9,.9], sp:[.04,-.11,0], tex:'ai', em:.18, gl:.5, r:[.3,-.5,-.1] }],
        ae:     [{ g:'box',  c:'plum', sc:[.9,.9,.26], sp:[.02,.05,0], tex:'ae', em:.2, gl:.5, r:[.2,-.4,.15] }],
        knot:   [{ g:'knot', c:'mag',  sc:[.5,.5,.5], sp:[.03,.06,.01], em:.4, gl:.8 }],
        ring:   [{ g:'ring', c:'teal', sc:[.5,.5,.5], sp:[.03,.09,0], em:.22, al:.8, gl:0, r:[.9,.3,0] }],
        screen: [{ g:'plane',c:'teal', sc:[1.5,.95,1], sp:[0,0,0], tex:'screen',  em:.1, al:.95, gl:.55, r:[.05,-.5,.03] }],
        screen2:[{ g:'plane',c:'mag',  sc:[1.4,.9,1],  sp:[0,0,0], tex:'screen2', em:.1, al:.95, gl:.5, r:[.05,.5,-.04] }],
        laptop: [{ g:'plane',c:'teal', sc:[1.6,1,1], sp:[0,0,0], tex:'laptop', em:.16, al:1, gl:.6, r:[-.12,-.42,.02], o:[0,.12,0] },
                 { g:'slab', c:'plum', sc:[1.6,1,.9], sp:[0,0,0], em:.2, al:.9, gl:0, r:[.04,-.42,0], o:[0,-.4,.25] }],
        cam:    [{ g:'box',  c:'ice',  sc:[.85,.55,.5], sp:[.03,.06,0], em:.2, gl:.5, r:[.15,-.5,.05] },
                 { g:'cyl',  c:'mag',  sc:[.35,.3,.35], sp:[0,0,0], em:.3, gl:0, r:[1.4,-.5,0], o:[-.13,0,.34] }],
        pad:    [{ g:'box',  c:'sun',  sc:[1,.26,.46], sp:[.02,.05,0], em:.22, gl:.5, r:[.7,-.5,.2] },
                 { g:'cyl',  c:'sun',  sc:[.26,.34,.26], sp:[0,0,0], em:.25, gl:0, r:[.6,-.5,.2], o:[-.36,.1,.1] },
                 { g:'cyl',  c:'sun',  sc:[.26,.34,.26], sp:[0,0,0], em:.25, gl:0, r:[.6,-.5,.2], o:[.36,-.1,-.1] }],
        books:  [0,1,2].map(i => ({ g:'book', c:['teal','sun','mag'][i], sc:[1.1,.6,.9], sp:[0,0,0], tex:'book'+i, em:.14, gl:i?0:.4, r:[0,.3,-.03], o:[0,-.3+i*.27,0] })),
        rock:   [{ g:'rock0', c:'*', sc:[.5,.36,.5], sp:[.01,.03,0], em:0, al:.55, gl:.3 }],
        rock2:  [{ g:'rock2', c:'*', sc:[.5,.36,.5], sp:[.01,.03,0], em:0, al:.55, gl:.3 }]
      };
      const CN = { teal:C.teal, sun:C.sun, mag:C.mag, plum:C.plum, ice:C.ice };
      N.forEach((it, idx) => (K[it.kind] || K.cube).forEach(pt => {
        const s = it.s, o = pt.o || [0,0,0];
        add({ geo:pt.g, col: pt.c === '*' ? CN[it.c || 'teal'] : CN[pt.c], pos:[0,0,0], rot: pt.r || [Math.random()*3, Math.random()*3, 0],
          scale: pt.sc.map(v => v * s), spin: pt.sp, tex: pt.tex || null, emis: pt.em + .22, alpha: Math.min(1, (pt.al == null ? .95 : pt.al) * (it.a || 1)),
          glow: pt.gl * s * .85, float: s * .06, phase: idx * 1.7, item: it, lo: [o[0]*s, o[1]*s, o[2]*s] });
      }));
    } else if (SC === 'contact') {
      add({ geo:'knot', col:C.mag, pos:[0,0,0], scale:[1.7,1.7,1.7], spin:[.05,.08,.02], emis:.45, glow:2.4, float:.15 });
      add({ geo:'ring', col:C.teal, pos:[0,0,0], scale:[1.9,1.9,1.9], rot:[1.1,.4,0], spin:[.03,.09,0], emis:.25, alpha:.8, glow:0, float:0 });
      add({ geo:'tetra', col:C.sun, pos:[2.2,1.4,0], scale:[.35,.35,.35], spin:[.1,.16,0], emis:.3, glow:.8, float:.3 });
      add({ geo:'octa', col:C.plum, pos:[-2.3,-1.2,.3], scale:[.4,.4,.4], spin:[.1,.14,0], emis:.3, glow:.8, float:.3 });
      add({ geo:'box', col:C.ice, pos:[-1.9,1.7,-.4], scale:[.32,.32,.32], spin:[.13,.17,0], emis:.35, glow:.6, float:.3 });
    }

    const texes = {
      code: mkTex(labelTex('</>', '#c9a6ff')), ai: mkTex(labelTex('AI', '#6fe3ff')),
      screen: mkTex(codeTex('#2fc4ad')), screen2: mkTex(codeTex('#ff3b76')), screen3: mkTex(codeTex('#ffd23f')),
      book0: mkTex(labelTex('CREATE', '#2fc4ad', 'rgba(10,14,28,0.96)')),
      laptop: mkTex(laptopTex()), ae: mkTex(aeTex()),
      book1: mkTex(labelTex('DEVELOP', '#ffd23f', 'rgba(10,14,28,0.96)')),
      book2: mkTex(labelTex('DESIGN', '#ff3b76', 'rgba(10,14,28,0.96)'))
    };

    let avatar = null;
    if (opts.cutout) {
      const im = new Image();
      im.onload = () => {
        try {
          const A = cutoutGeo(im, opts.bulge || .16);
          G.avatar = upload(A);
          const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
          const pc = document.createElement('canvas'); pc.width = pc.height = 1024;
          pc.getContext('2d').drawImage(im, 0, 0, 1024, 1024);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pc);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const ext = gl.getExtension('EXT_texture_filter_anisotropic');
          if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
          texes.avatar = t;
          const ap = opts.avatarPos || [0, 0, 0], sc = (opts.avatarScale || 6) * S;
          avatar = { geo:'avatar', avatar:true, col:C.mag, pos:[ap[0]*Sx, ap[1]*Sy, ap[2]*S], rot:[0,0,0],
            scale:[sc, sc, sc], spin:[0,0,0], float:.1*S, phase:0, emis:0, alpha:1, glow:0, hoverK:0, pick:1, label:opts.avatarLabel || null };
          objs.push(avatar);
          if (opts.onAvatar) opts.onAvatar(true);
        } catch (e) { if (opts.onAvatar) opts.onAvatar(false); }
      };
      im.onerror = () => { if (opts.onAvatar) opts.onAvatar(false); };
      im.src = opts.cutout;
    }

    let W = 0, H = 0, aspect = 1;
    const cam = [0, 0, opts.camZ || 17];
    let orbit = 0;
    let px = 0, py = 0, tpx = 0, tpy = 0, hoverIdx = -1, mouseX = -1e4, mouseY = -1e4;

    function resize() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w === W && Math.abs(h - H) < 2) return;
      W = w; H = h; aspect = w / h;
      const d = Math.min(devicePixelRatio || 1, opts.maxDpr || 2);
      canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function bind(b, geoOnly) {
      gl.bindBuffer(gl.ARRAY_BUFFER, b.p); gl.enableVertexAttribArray(A.p); gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.n); gl.enableVertexAttribArray(A.n); gl.vertexAttribPointer(A.n,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.u); gl.enableVertexAttribArray(A.u); gl.vertexAttribPointer(A.u,2,gl.FLOAT,false,0,0);
    }

    let shX = 0, shY = 0;
    const proj = () => M.persp((opts.fov || 43) * Math.PI/180, aspect, opts.near || .1, opts.far || 120, shX, shY);

    function project(p, pv) {
      const x = pv[0]*p[0]+pv[4]*p[1]+pv[8]*p[2]+pv[12];
      const y = pv[1]*p[0]+pv[5]*p[1]+pv[9]*p[2]+pv[13];
      const w = pv[3]*p[0]+pv[7]*p[1]+pv[11]*p[2]+pv[15];
      if (w <= 0) return null;
      return [(x/w*.5+.5)*W, (-y/w*.5+.5)*H, w];
    }

    let t0 = performance.now(), raf = 0, running = true;
    function frame(now) {
      raf = 0; if (!running) return;
      if (opts.fps && now - (frame.last || 0) < 1000/opts.fps - 3) { raf = requestAnimationFrame(frame); return; }
      frame.last = now;
      resize();
      const D = opts.drive ? opts.drive() : null;
      const t = D ? D.t : (now - t0) * .001;
      px += (tpx - px) * .05; py += (tpy - py) * .05;
      if (opts.auto && mouseX < -1e3) { tpx = Math.sin(t*.35)*.7; tpy = Math.cos(t*.27)*.35; }
      if (D) { tpx = tpy = px = py = 0; }
      orbit = (opts.orbit || 0) * t;
      let R0 = cam[2];
      shX = (opts.shift && aspect > (opts.shiftMin || 1.15)) ? opts.shift : 0; shY = 0;
      const L = opts.layout ? opts.layout(W, H) : null;
      if (L) {
        shX = L.x / W * 2 - 1; shY = -(L.y / H * 2 - 1);
        R0 = (H/2) / (L.unit * Math.tan((opts.fov || 43) * Math.PI/360));
        objs.forEach(o => { if (o.avatar) return;
          let x = o.bx * L.sx, y = o.by; const off = L.off && o.grp && L.off[o.grp];
          if (off) { x += off[0]; y += off[1]; }
          o.pos[0] = x; o.pos[1] = y; o.hidden = !!(L.hide && o.grp && L.hide.indexOf(o.grp) >= 0); });
        if (avatar) { avatar.pos[0] = L.av[0]; avatar.pos[1] = L.av[1]; avatar.pos[2] = 0; const sc = L.av[2] * S; avatar.scale = [sc, sc, sc]; }
      }
      if (!L && opts.fit) R0 *= Math.min(1.6, Math.max(1, .95/aspect));
      const R = R0, k = opts.px == null ? 1 : opts.px;
      const PG = opts.pageInfo ? opts.pageInfo() : null;
      let eye, camy = 0;
      if (PG) {
        R0 = (H/2) / Math.tan((opts.fov || 43) * Math.PI/360);
        camy = -(PG.y + H/2);
        const narrow = W < 700, mid = W < 1000;
        objs.forEach(o => {
          const it = o.item, sec = PG.secs[it.sec];
          if (!sec) { o.hidden = true; return; }
          const z = it.z || 0, kk = (R0 - z) / R0;
          const inset = it.s * (narrow ? .1 + .3*it.ix : mid ? .3 + .4*it.ix : .62 + .7*it.ix);
          o.pos[0] = (it.mid ? it.side * W * (.06 + .3*it.ix) * kk : it.side * (W/2 - inset) * kk) + o.lo[0];
          o.pos[1] = -(sec[0] + it.dy * sec[1]) + o.lo[1];
          o.pos[2] = z + o.lo[2];
          o.hidden = (narrow && it.d) || Math.abs((o.pos[1] - camy) * R0 / (R0 - z)) > H/2 + it.s * 2.5;
        });
        eye = [px * 90, camy - py * 50, R0];
      } else eye = [Math.sin(orbit)*R + px*1.7*k, cam[1] - py*1.1*k + (opts.camY || 0) + (D ? Math.min(D.s, 1.2) * 1.8 : 0), Math.cos(orbit)*R];
      const view = PG ? M.look(eye[0], eye[1], eye[2], 0, camy, 0) : M.look(eye[0], eye[1], eye[2], 0, 0, 0);
      const scrollSpin = PG ? PG.y * .0016 : 0;
      const P = proj(), pv = M.mul(P, view);

      /* hover pick */
      let best = -1, bestD = 1e9;
      const blocked = D || (opts.blocked && opts.blocked());
      objs.forEach((o, i) => {
        if (!o.pick || blocked) return;
        const s = project([o.pos[0], o.pos[1] + Math.sin(t*.7+o.phase)*o.float, o.pos[2]], pv);
        if (!s) return;
        const rad = Math.max(58, 130 * Math.max(...o.scale) / s[2] * 8) * (hoverIdx === i ? 1.7 : 1);
        const d = Math.hypot(s[0]-mouseX, s[1]-mouseY);
        if (d < rad && d < bestD) { bestD = d; best = i; }
      });
      hoverIdx = best;
      if (opts.onHover) opts.onHover(best >= 0 ? objs[best] : null);

      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.uProj, false, P); gl.uniformMatrix4fv(U.uView, false, view);
      gl.uniform3fv(U.uCam, new Float32Array(eye));
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(U.uTex, 0);

      /* avatar: opaque, depth-written, so neon props can pass in front of and behind it */
      if (avatar && texes.avatar) {
        const o = avatar, hov = objs[hoverIdx] === o;
        o.hoverK += ((hov ? 1 : 0) - o.hoverK) * .1;
        gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
        gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
        const b = G.avatar; bind(b);
        const sD = D ? Math.min(D.s, 1.2) : 0, ry = opts.avatarStatic ? 0 : D ? sD * .8 - .04 : px * .5 + Math.sin(t*.5) * .04, rx = opts.avatarStatic ? 0 : D ? sD * .12 : py * .18;
        const yy = o.pos[1] + (opts.avatarStatic ? 0 : Math.sin(t*.7) * o.float + o.hoverK * .12);
        const sc = 1 + o.hoverK * .035;
        gl.uniformMatrix4fv(U.uModel, false, M.trs(o.pos[0], yy, o.pos[2], rx, ry, 0, o.scale[0]*sc, o.scale[1]*sc, o.scale[2]*sc));
        gl.uniform3fv(U.uColor, new Float32Array(o.col));
        gl.uniform1f(U.uEmis, o.hoverK * .22);
        gl.uniform1f(U.uMode, 3); gl.uniform1f(U.uAlpha, 1);
        gl.bindTexture(gl.TEXTURE_2D, texes.avatar);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i);
        gl.drawElements(gl.TRIANGLES, b.ni, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.CULL_FACE);
      }
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false);

      /* glow sprites (billboards) */
      bind(G.plane);
      gl.bindTexture(gl.TEXTURE_2D, glowT);
      gl.uniform1f(U.uMode, 2);
      objs.forEach(o => {
        if (!o.glow || o.hidden) return;
        const yy = o.pos[1] + Math.sin(t*.7+o.phase)*o.float;
        const k = o.glow * (1 + o.hoverK * .8) * 2.6;
        const m = M.trs(o.pos[0], yy, o.pos[2]-.15, 0, 0, 0, k, k, k);
        m[0]=k; m[1]=0; m[2]=0; m[4]=0; m[5]=k; m[6]=0; m[8]=0; m[9]=0; m[10]=k;
        gl.uniformMatrix4fv(U.uModel, false, m);
        gl.uniform3fv(U.uColor, new Float32Array(o.col));
        gl.uniform1f(U.uAlpha, .5 + o.hoverK * .35);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, G.plane.i);
        gl.drawElements(gl.TRIANGLES, G.plane.ni, gl.UNSIGNED_SHORT, 0);
      });

      /* solids then edges */
      objs.forEach((o, i) => {
        if (o.avatar || o.hidden) return;
        const hov = i === hoverIdx;
        o.hoverK += ((hov ? 1 : 0) - o.hoverK) * .12;
        const b = G[o.geo]; bind(b);
        const yy = o.pos[1] + Math.sin(t*.7+o.phase)*o.float + o.hoverK*.5;
        const sc = 1 + o.hoverK * .16;
        const sp = 1 + o.hoverK * 2.2;
        const m = M.trs(o.pos[0], yy, o.pos[2],
          o.rot[0] + o.spin[0]*t*sp + scrollSpin*.6, o.rot[1] + o.spin[1]*t*sp + scrollSpin, o.rot[2] + o.spin[2]*t*sp,
          o.scale[0]*sc, o.scale[1]*sc, o.scale[2]*sc);
        gl.uniformMatrix4fv(U.uModel, false, m);
        gl.uniform3fv(U.uColor, new Float32Array(o.col));
        gl.uniform1f(U.uEmis, o.emis + o.hoverK * .55);
        gl.bindTexture(gl.TEXTURE_2D, o.tex ? texes[o.tex] : blank);
        gl.uniform1f(U.uMode, o.tex ? -1 : 0);
        gl.uniform1f(U.uAlpha, o.alpha);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i);
        gl.drawElements(gl.TRIANGLES, b.ni, gl.UNSIGNED_SHORT, 0);
        gl.uniform1f(U.uMode, 1);
        gl.uniform1f(U.uAlpha, (.55 + o.hoverK * .45) * (o.alpha));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.e);
        gl.drawElements(gl.LINES, b.ne, gl.UNSIGNED_SHORT, 0);
      });

      if (!opts.onDemand) raf = requestAnimationFrame(frame);
    }

    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); api.stop(); canvas.style.opacity = 0; if (opts.onLost) opts.onLost(); });
    resize();
    const host = opts.host || canvas.parentElement;
    if (host && !opts.noPointer) ['pointermove','pointerdown'].forEach(ev => host.addEventListener(ev, e => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left; mouseY = e.clientY - r.top;
      tpx = (mouseX / Math.max(1, r.width) - .5) * 2;
      tpy = (mouseY / Math.max(1, r.height) - .5) * 2;
    }, { passive: true }));
    if (host && !opts.noPointer) host.addEventListener('pointercancel', () => { mouseX = mouseY = -1e4; tpx = tpy = 0; }, { passive: true });
    if (host) host.addEventListener('pointerleave', () => { mouseX = mouseY = -1e4; tpx = tpy = 0; }, { passive: true });

    const api = {
      gl,
      start(){ if(!raf){ running = true; t0 = performance.now() - 1000; raf = requestAnimationFrame(frame);} },
      draw(){ if (!raf) { running = true; raf = requestAnimationFrame(frame); } },
      stop(){ running = false; if(raf) cancelAnimationFrame(raf); raf = 0; },
      once(){ running = true; resize(); frame(performance.now()); if(raf){cancelAnimationFrame(raf); raf=0;} },
      auto(on){ opts.auto = on; },
      objs
    };
    return api;
  }

  global.NeonHero = { initHero, initScene: initHero };
})(window);

window.CUTOUT_WEBP="assets/img-58.webp";

(function () {
  const root = document.documentElement;
  const fail = () => root.classList.add('no3d');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const coarse = matchMedia('(pointer:coarse)').matches;
  if (!window.NeonHero) return fail();
  try { const t = document.createElement('canvas'); if (!t.getContext('webgl')) return fail(); } catch (e) { return fail(); }
  const live = [];
  function mount(cv, o) {
    let H = null;
    try { H = NeonHero.initScene(cv, Object.assign({ maxDpr: coarse ? 1.25 : 2, fps: coarse ? 40 : 0, auto: coarse || o.auto, onLost: fail }, o)); } catch (e) { H = null; }
    if (!H) return null;
    let on = false;
    const sync = () => { if (on && !document.hidden) { reduce ? H.once() : H.start(); } else H.stop(); };
    new IntersectionObserver(es => { on = es[0].isIntersecting; sync(); }, { rootMargin: '120px' }).observe(cv);
    live.push(sync);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (on && reduce) H.once(); }, 150); }, { passive: true });
    if (reduce) { let n = 0; const iv = setInterval(() => { if (on) H.once(); if (++n > 8) clearInterval(iv); }, 350); }
    return H;
  }
  document.addEventListener('visibilitychange', () => live.forEach(f => f()));

  /* hero: centred cutout + neon props. Reacts to mouse and touch only, never to scroll */
  const cv = document.getElementById('hero3d'), hp = document.querySelector('.hero');
  if (cv && hp) {
    const wrapEl = hp.querySelector('.wrap'), stage = document.getElementById('card'), hats = hp.querySelector('.hats');
    const layout = () => {
      const c = cv.getBoundingClientRect();
      if (innerWidth > 980) {
        const w = wrapEl.getBoundingClientRect(), hr = hats.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(wrapEl).paddingLeft) || 0;
        const unit = Math.max(20, (w.width - pad * 2) / 24);
        return { x: w.left - c.left + w.width / 2, y: hr.top - c.top - 4.35 * unit, unit, sx: 1.28, av: [0, -.1, 14.2],
          hide: ['code', 'ring', 'octa', 'books', 'tetraL', 'cubeL'],
          off: { scrM: [10.4, 4.4], scrT: [-.6, 2.4], lap: [-3.0, 3.6], cam: [2.4, .6], ai: [-3.4, 1.8], pad: [-2.6, -.8], ae: [.3, .4] } };
      }
      const r = stage.getBoundingClientRect();
      return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2, unit: Math.min(r.width / 10.8, r.height / 12.6), sx: .62, av: [0, MOBAV[0], MOBAV[1]] };
    };
    const MOBAV = [-3.4, 15];
    const H = mount(cv, { scene: 'hero', S: .8, Sx: .62, Sy: 1, bulge: .16, cutout: window.CUTOUT_WEBP, avatarScale: 12.5, avatarPos: [.2, -3.2, 0],
      host: hp, blocked: () => true, layout, auto: false, noPointer: 1, avatarStatic: 1,
      onAvatar: ok => { if (ok) { hp.classList.add('av'); if (reduce && H) H.once(); } } });
    if (H) { cv.classList.add('on'); hp.classList.add('gl'); }
  }

})();
