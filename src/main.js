import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PrimeSieve } from '@danhouseman/prime-engine';
import { buildPrimeAlignmentSegments } from './cubic-ulam.js';
import { buildArithmetic, factorList } from './arithmetic.js';
import { generateLayout } from './layouts.js';

const $ = (id) => document.getElementById(id);
const canvas=$('scene'), tooltip=$('tooltip'), busy=$('busy');
const ids=['themeToggle','panelToggle','palette','resetPalette','colorModeDescription','limit','layout','morph','sphereScale','spacing','sizeMode','showComposites','highlyCompositeBoost','colorEnabled','colorMode','modulus','luminance','showLines','lineMode','axisX','axisY','axisZ','factorEdges','divisibilityEdges','collatzEdges','cunninghamEdges','goldbachEdges','clipX','clipY','clipZ','fogDensity','progress','speed','autoRotate','forcePulse','rebuild','resetCamera','play','pause','screenshot','exportData'];
const ui=Object.fromEntries(ids.map(id=>[id,$(id)]));

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
renderer.localClippingEnabled=true;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x05070b,0.009);
const camera=new THREE.PerspectiveCamera(55,1,.01,5000);
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.065;orbit.screenSpacePanning=true;
// Spheres use an unlit material so instance colors are exact and independent of scene lighting.
scene.add(new THREE.HemisphereLight(0xffffff,0x101525,1.1));const key=new THREE.DirectionalLight(0xffffff,1.2);key.position.set(8,14,10);scene.add(key);
const root=new THREE.Group();scene.add(root);
const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2(), tempObject=new THREE.Object3D(), tempColor=new THREE.Color();
const clipPlanes=[new THREE.Plane(new THREE.Vector3(-1,0,0),1e6),new THREE.Plane(new THREE.Vector3(0,-1,0),1e6),new THREE.Plane(new THREE.Vector3(0,0,-1),1e6)];
let mesh=null,edges=null,state=null,token=0,playing=false,lastFrame=performance.now();
let theme=localStorage.getItem('prime-universe-theme')||'dark';
const disabledTau=new Set();

const PALETTES={
  golden:null,
  tableau:['4e79a7','f28e2b','e15759','76b7b2','59a14f','edc949','af7aa1','ff9da7','9c755f','bab0ab'],
  viridis:['440154','482878','3e4989','31688e','26828e','1f9e89','35b779','6ece58','b5de2b','fde725'],
  turbo:['30123b','4662d7','35abf8','1ae4b6','72fe5e','c8ef34','faba39','f66b19','c92903','7a0403'],
  spectral:['9e0142','d53e4f','f46d43','fdae61','fee08b','ffffbf','e6f598','abdda4','66c2a5','3288bd','5e4fa2'],
  pastel:['aec6cf','ffb347','ff9aa2','b5ead7','c7ceea','fdfd96','cdb4db','ffc8dd','bde0fe','a2d2ff'],
  neon:['ff00ff','00ffff','39ff14','ff3131','fff01f','bc13fe','ff5f1f','00ff7f','1f51ff','ff1493'],
  monochrome:['111827','374151','4b5563','6b7280','9ca3af','d1d5db','e5e7eb','f3f4f6']
};
const COLOR_MODE_DESCRIPTIONS={
  tau:'Each color represents τ(n), the number of positive divisors of n. Numbers with the same divisor count always share a color. Use the checkboxes to hide a family and click its color square to customize it.',
  prime:'White identifies primes; the palette color identifies composite numbers.',
  primePower:'Highlights numbers of the form pᵏ. Primes remain white, prime powers receive a palette color, and other composites use a subdued category color.',
  abundance:'Colors classify numbers by the sum of proper divisors: deficient, perfect, or abundant.',
  mobius:'Colors represent the Möbius function μ(n): −1, 0, or +1. Zero indicates a repeated prime factor.',
  liouville:'Two colors represent λ(n)=−1 or +1, determined by whether the total number of prime factors is odd or even.',
  phi:'Color is keyed by Euler’s totient φ(n), the count of positive integers up to n that are coprime to n.',
  spf:'Color is keyed by the smallest prime factor. Shared colors reveal divisibility planes and bands.',
  lpf:'Color is keyed by the largest prime factor, making smooth versus rough numbers visually distinct.',
  primeGap:'Each prime is colored by the gap from the preceding prime; composites use the base category.',
  constellation:'Different colors identify twin, cousin, sexy, and Cunningham-chain primes.',
  residue:'Color represents n mod m. Change m to explore modular residue structures.',
  quadratic:'Two colors indicate whether n mod m is or is not a quadratic residue modulo m.',
  popcount:'Color represents the number of 1 bits in n’s binary representation.',
  gray:'Color represents n after Gray-code transformation, useful for exposing binary adjacency patterns.',
  gaussian:'Colors indicate whether the projected coordinate x+zi is a Gaussian prime.',
  eisenstein:'Colors indicate an Eisenstein-prime proxy based on the norm x²−xz+z².',
  shellDensity:'Color represents local prime density among nearby values on the same cubic shell.'
};
const CONTROL_HELP={
  panelToggle:'Collapse or expand the entire control panel.',themeToggle:'Switch the interface and 3D scene between light and dark themes.',
  limit:'Largest integer included in the universe. Higher limits use more memory and GPU time.',layout:'Select the target spatial arrangement of consecutive integers.',morph:'Blend continuously between cubic-shell coordinates and the selected target layout.',sphereScale:'Multiply every sphere radius without changing the underlying arithmetic sizing.',spacing:'Distance between neighboring lattice coordinates.',sizeMode:'Choose which arithmetic quantity controls sphere radius.',showComposites:'Show or hide composite numbers while retaining primes and the number 1.',highlyCompositeBoost:'Enlarge record-setting highly composite numbers so they become visual landmarks.',
  colorEnabled:'Enable arithmetic-function colors. When disabled, primes stay white and composites use a neutral color.',colorMode:'Choose the arithmetic property represented by sphere color.',palette:'Choose the ordered color set used to map category values. Custom changes are stored separately.',resetPalette:'Delete all custom color overrides and return to the selected palette defaults.',modulus:'Modulus used by residue and quadratic-residue color modes.',luminance:'Adjust overall brightness of generated palette colors.',
  showLines:'Draw lines between primes that share two coordinates and therefore align on an axis.',lineMode:'Adjacent connects neighboring aligned primes; all pairs connects every pair; rays extend the detected direction.',axisX:'Enable prime alignment lines parallel to the X axis.',axisY:'Enable prime alignment lines parallel to the Y axis.',axisZ:'Enable prime alignment lines parallel to the Z axis.',factorEdges:'Connect each sampled composite to its distinct prime factors.',divisibilityEdges:'Draw a sampled directed-like lattice where n connects to small multiples.',collatzEdges:'Connect n to its next Collatz value when that value is in range.',cunninghamEdges:'Connect primes related by p → 2p+1.',goldbachEdges:'For sampled even numbers, connect one prime pair whose sum is the even number.',
  clipX:'Hide geometry beyond the selected positive X clipping plane.',clipY:'Hide geometry beyond the selected positive Y clipping plane.',clipZ:'Hide geometry beyond the selected positive Z clipping plane.',fogDensity:'Increase depth fog to emphasize nearby structures and reduce distant clutter.',progress:'Show only numbers up to this value, enabling construction playback.',play:'Animate the visible progression from the current number toward Maximum N.',pause:'Pause progression animation.',speed:'Numbers revealed per second during progression playback.',autoRotate:'Continuously rotate the camera around the visualization.',forcePulse:'Animate sphere radii with a subtle number-dependent pulse.',
  rebuild:'Recompute coordinates, arithmetic arrays, spheres, colors, and graph overlays.',resetCamera:'Fit and center the camera around the current universe.',screenshot:'Save the current canvas as a PNG image.',exportData:'Export coordinates and arithmetic properties as CSV.'
};
const customColors=new Map(Object.entries(JSON.parse(localStorage.getItem('prime-universe-custom-colors')||'{}')));
let panelCollapsed=localStorage.getItem('prime-universe-panel-collapsed')==='true';



function applyTheme(nextTheme=theme){
  theme=nextTheme==='light'?'light':'dark';
  document.documentElement.dataset.theme=theme;
  localStorage.setItem('prime-universe-theme',theme);
  const light=theme==='light';
  const background=light?0xf4f7fb:0x05070b;
  renderer.setClearColor(background,1);
  scene.background=new THREE.Color(background);
  scene.fog.color.setHex(background);
  if(edges){
    edges.material.color.setHex(light?0x1f2937:0xffffff);
    edges.material.opacity=light?.34:.25;
    edges.material.needsUpdate=true;
  }
  if(ui.themeToggle) ui.themeToggle.textContent=light?'Dark mode':'Light mode';
}


function createInstanceColorMaterial(){
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog
    ]),
    vertexShader: `
      // Three.js injects the instanceColor attribute automatically for InstancedMesh.
      varying vec3 vInstanceColor;
      #include <common>
      #include <fog_pars_vertex>
      #include <clipping_planes_pars_vertex>
      void main() {
        vInstanceColor = instanceColor;
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        #include <clipping_planes_vertex>
      }
    `,
    fragmentShader: `
      varying vec3 vInstanceColor;
      #include <common>
      #include <fog_pars_fragment>
      #include <clipping_planes_pars_fragment>
      void main() {
        #include <clipping_planes_fragment>
        gl_FragColor = vec4(vInstanceColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
    clipping: true,
    clippingPlanes: clipPlanes,
    fog: true,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    toneMapped: false
  });
}

function paletteColor(key,l=.52,s=.86,mode=ui.colorMode?.value||'tau'){
  const custom=customColors.get(`${mode}:${key}`);
  if(custom)return new THREE.Color(custom);
  const paletteName=ui.palette?.value||'golden';
  const palette=PALETTES[paletteName];
  if(palette){const hex=palette[Math.abs(Math.trunc(Number(key)))%palette.length];const c=new THREE.Color(`#${hex}`);if(paletteName!=='monochrome')c.offsetHSL(0,0,THREE.MathUtils.clamp(l-.52,-.28,.28));return c}
  const h=((Number(key)*0.61803398875)%1+1)%1;return new THREE.Color().setHSL(h,s,l)
}
function saveCustomColors(){localStorage.setItem('prime-universe-custom-colors',JSON.stringify(Object.fromEntries(customColors)))}
function fitCamera(extent){extent=Math.max(3,extent);camera.position.set(extent*2.2,extent*1.7,extent*2.2);camera.near=Math.max(.01,extent/2000);camera.far=extent*30+100;camera.updateProjectionMatrix();orbit.target.set(0,0,0);orbit.minDistance=.5;orbit.maxDistance=extent*15;orbit.update()}
function radiusFor(n,a){let v=1;switch(ui.sizeMode.value){case'popcount':v=Math.sqrt(Math.max(1,a.popcount[n]));break;case'phi':v=1+Math.log1p(a.phi[n])*.18;break;case'value':v=1+Math.log1p(n)*.12;break;case'fixed':v=1;break;default:v=Math.sqrt(a.tau[n]);}if(n===1)v*=.55;if(ui.highlyCompositeBoost.checked&&a.highlyComposite[n])v*=1.35;return Number(ui.sphereScale.value)*v}
function gaussianPrime(x,z,isPrime){const a=Math.abs(Math.round(x)),b=Math.abs(Math.round(z));if(a===0&&b===0)return false;if(a===0||b===0)return isPrime(Math.max(a,b))&&Math.max(a,b)%4===3;return isPrime(a*a+b*b)}
function eisensteinProxy(x,z,isPrime){const a=Math.round(x),b=Math.round(z);const norm=Math.abs(a*a-a*b+b*b);return norm>1&&isPrime(norm)}
function shellDensity(n,coords,a){const i=(n-1)*3,r=Math.max(Math.abs(coords[i]),Math.abs(coords[i+1]),Math.abs(coords[i+2]));let p=0,t=0;const lo=Math.max(1,n-30),hi=Math.min(state?.limit||n+30,n+30);for(let k=lo;k<=hi;k++){const j=(k-1)*3;if(Math.max(Math.abs(coords[j]),Math.abs(coords[j+1]),Math.abs(coords[j+2]))===r){t++;if(a.isPrime(k))p++;}}return t?p/t:0}
function colorFor(n,a,coords,maxTau){
 const prime=a.isPrime(n),mode=ui.colorMode.value;
 if(!ui.colorEnabled.checked)return prime||n===1?new THREE.Color(0xffffff):new THREE.Color(0x667085);
 if((prime||n===1)&&mode==='tau')return new THREE.Color(0xffffff);
 const l=Number(ui.luminance.value),m=Math.max(2,Number(ui.modulus.value)||7);let key=0,light=l;
 switch(mode){
  case'prime':return prime?new THREE.Color(0xffffff):paletteColor(0,l,.86,mode);
  case'tau':key=a.tau[n];light=THREE.MathUtils.clamp(l*(.65+a.tau[n]/Math.max(2,maxTau)),.16,.82);break;
  case'primePower':return a.primePower[n]?paletteColor(2,l,.86,mode):prime?new THREE.Color(0xffffff):paletteColor(0,.28,.5,mode);
  case'abundance':return paletteColor(a.abundantClass[n]+1,l,.82,mode);
  case'mobius':return paletteColor(a.mobius[n]+1,l,.82,mode);
  case'liouville':return paletteColor(a.liouville[n]>0?1:0,l,.82,mode);
  case'phi':key=a.phi[n]%61;break;case'spf':key=a.spf[n]||1;break;case'lpf':key=a.lpf[n]||1;break;
  case'primeGap':key=prime?a.primeGap[n]:0;break;
  case'constellation':if(a.twin[n])return paletteColor(1,l,.9,mode);if(a.cousin[n])return paletteColor(2,l,.9,mode);if(a.sexy[n])return paletteColor(3,l,.9,mode);if(a.cunningham[n])return paletteColor(4,l,.9,mode);return prime?new THREE.Color(0xffffff):paletteColor(0,.25,.45,mode);
  case'residue':key=n%m;break;
  case'quadratic':return paletteColor(quadraticResidue(n,m)?1:0,l,.86,mode);
  case'popcount':key=a.popcount[n];break;case'gray':key=a.gray[n]%31;break;
  case'gaussian':{const i=(n-1)*3;return paletteColor(gaussianPrime(coords[i],coords[i+2],a.isPrime)?1:0,l,.86,mode)}
  case'eisenstein':{const i=(n-1)*3;return paletteColor(eisensteinProxy(coords[i],coords[i+2],a.isPrime)?1:0,l,.86,mode)}
  case'shellDensity':key=Math.round(shellDensity(n,coords,a)*20);light=.3+Math.min(.5,key/30);break;
 }
 return paletteColor(key,light,.86,mode)
}
function quadraticResidue(n,m){const r=((n%m)+m)%m;for(let x=0;x<m;x++)if((x*x)%m===r)return true;return false}

function buildLegend(a,maxTau){
 const host=$('colorLegend');host.innerHTML='';
 $('colorModeDescription').textContent=COLOR_MODE_DESCRIPTIONS[ui.colorMode.value]||'';
 if(ui.colorMode.value!=='tau'){host.innerHTML='<div class="help">Palette colors are assigned deterministically from the selected arithmetic value. Divisor-family mode additionally supports per-value visibility and color editing.</div>';return}
 const counts=new Map();for(let n=1;n<=state.limit;n++)counts.set(a.tau[n],(counts.get(a.tau[n])||0)+1);
 const values=[...counts.keys()].sort((x,y)=>x-y);
 for(const t of values){
  const row=document.createElement('label');row.className='legend-row';
  const c=paletteColor(t,THREE.MathUtils.clamp(Number(ui.luminance.value)*(.65+t/Math.max(2,maxTau)),.16,.82),.86,'tau');
  row.innerHTML=`<input type="checkbox" ${disabledTau.has(t)?'':'checked'} data-tau="${t}"><input class="color-picker" type="color" value="#${c.getHexString()}" data-color-key="tau:${t}" aria-label="Choose color for divisor count ${t}"><span>τ(n) = ${t}</span><b>${counts.get(t)}</b>`;
  host.append(row)
 }
 host.querySelectorAll('[data-tau]').forEach(el=>el.addEventListener('change',()=>{const t=Number(el.dataset.tau);el.checked?disabledTau.delete(t):disabledTau.add(t);updateInstances()}));
 host.querySelectorAll('[data-color-key]').forEach(el=>el.addEventListener('input',()=>{customColors.set(el.dataset.colorKey,el.value);saveCustomColors();ui.palette.value='custom';updateInstances()}));
}

function installHelpTooltips(){
 const tip=document.createElement('div');tip.className='control-tooltip';tip.hidden=true;document.body.append(tip);
 const show=(el,event)=>{tip.textContent=el.dataset.help;tip.hidden=false;const r=el.getBoundingClientRect();let left=(event?.clientX??r.right)+10,top=(event?.clientY??r.top)+8;tip.style.left=`${Math.min(innerWidth-tip.offsetWidth-10,left)}px`;tip.style.top=`${Math.min(innerHeight-tip.offsetHeight-10,top)}px`};
 const hide=()=>tip.hidden=true;
 for(const [id,help] of Object.entries(CONTROL_HELP)){
  const control=$(id);if(!control)continue;control.title=help;control.dataset.help=help;
  control.addEventListener('mouseenter',e=>show(control,e));control.addEventListener('mousemove',e=>show(control,e));control.addEventListener('mouseleave',hide);control.addEventListener('focus',e=>show(control,e));control.addEventListener('blur',hide);
  const label=control.closest('label');
  if(label&&!label.querySelector('.help-icon')){const icon=document.createElement('button');icon.type='button';icon.className='help-icon';icon.textContent='?';icon.dataset.help=help;icon.setAttribute('aria-label',help);label.insertBefore(icon,control);icon.addEventListener('mouseenter',e=>show(icon,e));icon.addEventListener('mousemove',e=>show(icon,e));icon.addEventListener('mouseleave',hide);icon.addEventListener('focus',e=>show(icon,e));icon.addEventListener('blur',hide)}
 }
 for(const option of ui.colorMode.options){option.title=COLOR_MODE_DESCRIPTIONS[option.value]||option.textContent}
 document.querySelectorAll('details>summary').forEach(summary=>{const text=summary.textContent.trim();const help=`Expand or collapse the ${text.toLowerCase()} controls.`;summary.title=help});
}
function applyPanelState(){const panel=$('panel');panel.classList.toggle('collapsed',panelCollapsed);ui.panelToggle.textContent=panelCollapsed?'▶':'◀';ui.panelToggle.setAttribute('aria-expanded',String(!panelCollapsed));ui.panelToggle.setAttribute('aria-label',panelCollapsed?'Expand control panel':'Collapse control panel')}

function makeEdgePositions(a,coords,spacing){const out=[];const add=(u,v)=>{if(u<1||v<1||u>state.limit||v>state.limit)return;const i=(u-1)*3,j=(v-1)*3;out.push(coords[i]*spacing,coords[i+1]*spacing,coords[i+2]*spacing,coords[j]*spacing,coords[j+1]*spacing,coords[j+2]*spacing)};
 if(ui.showLines.checked){const seg=buildPrimeAlignmentSegments({primeNumbers:a.primes,coordinates:coords,spacing,mode:ui.lineMode.value==='all'?'all':'adjacent',axes:{x:ui.axisX.checked,y:ui.axisY.checked,z:ui.axisZ.checked}});for(let q=0;q<seg.length;q++)out.push(seg[q]);if(ui.lineMode.value==='rays'){for(let i=0;i<seg.length;i+=6){const ax=seg[i],ay=seg[i+1],az=seg[i+2],bx=seg[i+3],by=seg[i+4],bz=seg[i+5],dx=bx-ax,dy=by-ay,dz=bz-az;out.push(ax-dx*3,ay-dy*3,az-dz*3,bx+dx*3,by+dy*3,bz+dz*3)}}}
 const cap=Math.min(state.limit,5000);
 if(ui.factorEdges.checked)for(let n=4;n<=cap;n++){const fs=[...new Set(factorList(n,a.spf))];for(const p of fs)add(n,p)}
 if(ui.divisibilityEdges.checked)for(let n=2;n<=Math.min(cap,1800);n++)for(let k=2;k<=4&&n*k<=state.limit;k++)add(n,n*k)
 if(ui.collatzEdges.checked)for(let n=2;n<=cap;n++){const v=n%2===0?n/2:3*n+1;if(v<=state.limit)add(n,v)}
 if(ui.cunninghamEdges.checked)for(const p of a.primes){if(2*p+1<=state.limit&&a.isPrime(2*p+1))add(p,2*p+1)}
 if(ui.goldbachEdges.checked)for(let n=4;n<=Math.min(state.limit,1000);n+=2){for(const p of a.primes){if(p>n/2)break;if(a.isPrime(n-p)){add(p,n-p);break}}}
 return new Float32Array(out)}

async function rebuild(){const my=++token;busy.hidden=false;await new Promise(r=>requestAnimationFrame(r));const start=performance.now();const limit=THREE.MathUtils.clamp(Number(ui.limit.value)||12000,8,250000);ui.progress.max=limit;ui.progress.value=limit;$('progressValue').value=limit;const layout=ui.layout.value;const cubic=generateLayout(limit,'cubic'), target=generateLayout(limit,layout);const coords=new Float32Array(limit*3),morph=Number(ui.morph.value);for(let i=0;i<coords.length;i++)coords[i]=cubic[i]+(target[i]-cubic[i])*morph;const sieve=new PrimeSieve(limit);const isPrime=n=>n>=2&&n<=limit?sieve.has(n):false;const a=buildArithmetic(limit,isPrime);a.isPrime=isPrime;let maxTau=1;for(let n=1;n<=limit;n++)maxTau=Math.max(maxTau,a.tau[n]);if(my!==token)return;disposeRoot();const geo=new THREE.IcosahedronGeometry(1,limit<=25000?2:1);const mat=createInstanceColorMaterial();mesh=new THREE.InstancedMesh(geo,mat,limit);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(limit*3),3,false);mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);state={limit,coords,cubic,target,a,maxTau,spacing:Number(ui.spacing.value),extent:1};updateInstances();root.add(mesh);const ep=makeEdgePositions(a,coords,state.spacing);const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.BufferAttribute(ep,3));const em=new THREE.LineBasicMaterial({color:theme==='light'?0x1f2937:0xffffff,transparent:true,opacity:theme==='light'?.34:.25,depthWrite:false,clippingPlanes:clipPlanes});edges=new THREE.LineSegments(eg,em);root.add(edges);let extent=1;for(let i=0;i<coords.length;i++)extent=Math.max(extent,Math.abs(coords[i])*state.spacing);state.extent=extent;fitCamera(extent);buildLegend(a,maxTau);$('primeCount').textContent=a.primes.length.toLocaleString();$('shellRadius').textContent=Math.ceil(extent/state.spacing).toLocaleString();$('lineCount').textContent=(ep.length/6).toLocaleString();$('buildTime').textContent=`${(performance.now()-start).toFixed(0)} ms`;applyClipping();busy.hidden=true}
function disposeRoot(){root.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});root.clear();mesh=null;edges=null}
function updateInstances(){if(!state||!mesh)return;const {limit,coords,a,maxTau,spacing}=state,visible=Number(ui.progress.value);for(let n=1;n<=limit;n++){const i=(n-1)*3,show=n<=visible&&(ui.showComposites.checked||a.isPrime(n)||n===1)&&!(ui.colorMode.value==='tau'&&disabledTau.has(a.tau[n]));tempObject.position.set(coords[i]*spacing,coords[i+1]*spacing,coords[i+2]*spacing);let r=show?radiusFor(n,a):0;if(ui.forcePulse.checked)r*=1+.08*Math.sin(performance.now()*.002+n*.13);tempObject.scale.setScalar(r);tempObject.updateMatrix();mesh.setMatrixAt(n-1,tempObject.matrix);const color=colorFor(n,a,coords,maxTau);mesh.setColorAt(n-1,color)}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.material.needsUpdate=true;mesh.count=limit}
function applyClipping(){if(!state)return;const e=state.extent;clipPlanes[0].constant=e*Number(ui.clipX.value);clipPlanes[1].constant=e*Number(ui.clipY.value);clipPlanes[2].constant=e*Number(ui.clipZ.value);scene.fog.density=Number(ui.fogDensity.value)}
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}
function animate(now=performance.now()){resize();if(playing&&state){const delta=(now-lastFrame)/1000;ui.progress.value=Math.min(state.limit,Number(ui.progress.value)+delta*Number(ui.speed.value));$('progressValue').value=Math.floor(Number(ui.progress.value));if(Number(ui.progress.value)>=state.limit)playing=false;updateInstances()}if(ui.forcePulse.checked&&mesh)updateInstances();orbit.autoRotate=ui.autoRotate.checked;orbit.autoRotateSpeed=.7;orbit.update();renderer.render(scene,camera);lastFrame=now;requestAnimationFrame(animate)}

canvas.addEventListener('pointermove',e=>{if(!mesh||!state)return;const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(mesh,false)[0];if(!hit||hit.instanceId==null){tooltip.hidden=true;return}const n=hit.instanceId+1,i=hit.instanceId*3,a=state.a,fs=factorList(n,a.spf);tooltip.innerHTML=`<b>${n.toLocaleString()}</b><span>${a.isPrime(n)?'prime':n===1?'unit':'composite'}</span><span>τ=${a.tau[n]} · σ=${a.sigma[n]} · φ=${a.phi[n]}</span><span>μ=${a.mobius[n]} · λ=${a.liouville[n]} · Ω=${a.bigOmega[n]}</span><span>factors: ${fs.join(' × ')||'none'}</span><span>(${state.coords[i].toFixed(2)}, ${state.coords[i+1].toFixed(2)}, ${state.coords[i+2].toFixed(2)})</span>`;tooltip.style.left=`${e.clientX+14}px`;tooltip.style.top=`${e.clientY+14}px`;tooltip.hidden=false});canvas.addEventListener('pointerleave',()=>tooltip.hidden=true);

for(const [id,digits] of [['morph',2],['sphereScale',2],['spacing',2],['luminance',2],['clipX',2],['clipY',2],['clipZ',2],['fogDensity',3],['speed',0]])ui[id].addEventListener('input',()=>{$(`${id}Value`).value=Number(ui[id].value).toFixed(digits);if(id.startsWith('clip')||id==='fogDensity')applyClipping();else if(['sphereScale','spacing','morph'].includes(id)){}else updateInstances()});
ui.progress.addEventListener('input',()=>{$('progressValue').value=Math.floor(Number(ui.progress.value));updateInstances()});
for(const id of ['showComposites','highlyCompositeBoost','colorEnabled','colorMode','palette','modulus','sizeMode'])ui[id].addEventListener('change',()=>{if(state){buildLegend(state.a,state.maxTau);updateInstances()}});
for(const id of ['showLines','lineMode','axisX','axisY','axisZ','factorEdges','divisibilityEdges','collatzEdges','cunninghamEdges','goldbachEdges','layout'])ui[id].addEventListener('change',rebuild);
ui.rebuild.addEventListener('click',rebuild);ui.resetCamera.addEventListener('click',()=>state&&fitCamera(state.extent));ui.play.addEventListener('click',()=>playing=true);ui.pause.addEventListener('click',()=>playing=false);
ui.screenshot.addEventListener('click',()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='prime-universe.png';a.href=canvas.toDataURL('image/png');a.click()});
ui.exportData.addEventListener('click',()=>{if(!state)return;const rows=['n,x,y,z,prime,tau,sigma,phi,mobius,liouville,spf,lpf'];for(let n=1;n<=state.limit;n++){const i=(n-1)*3,a=state.a;rows.push([n,state.coords[i],state.coords[i+1],state.coords[i+2],a.isPrime(n),a.tau[n],a.sigma[n],a.phi[n],a.mobius[n],a.liouville[n],a.spf[n],a.lpf[n]].join(','))}const blob=new Blob([rows.join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='prime-universe.csv';link.click();URL.revokeObjectURL(url)});
ui.themeToggle.addEventListener('click',()=>applyTheme(theme==='dark'?'light':'dark'));
ui.panelToggle.addEventListener('click',()=>{panelCollapsed=!panelCollapsed;localStorage.setItem('prime-universe-panel-collapsed',String(panelCollapsed));applyPanelState()});
ui.resetPalette.addEventListener('click',()=>{customColors.clear();saveCustomColors();if(ui.palette.value==='custom')ui.palette.value='golden';if(state){buildLegend(state.a,state.maxTau);updateInstances()}});
applyTheme(theme);applyPanelState();installHelpTooltips();$('colorModeDescription').textContent=COLOR_MODE_DESCRIPTIONS[ui.colorMode.value];
window.addEventListener('resize',resize);rebuild();animate();
