/*
 * Simulador del cardanol — reconstrucción funcional e independiente.
 * No recupera ni reproduce el código original del artefacto de clase.
 * Heurística de priorización y cálculo detallada en README.md.
 * JavaScript puro, sin bibliotecas ni servicios externos.
 */
(() => {
  'use strict';
  const D = window.SIM_DATA;
  if (!D) { document.body.textContent = 'Error: no se cargó data.js'; return; }

  const $ = (selector) => document.querySelector(selector);
  const clone = (object) => JSON.parse(JSON.stringify(object));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
  const round = (x) => Math.round(x);
  const fmt = (v, digits = 0) => Number(v).toLocaleString('es-CO', {minimumFractionDigits:digits, maximumFractionDigits:digits});
  const actorIds = new Set(D.actors.map(a => a.id));
  const assumptionIds = new Set(D.assumptions.map(a => a.id));
  const postureNames = {'-2':'Oposición activa','-1':'Oposición pasiva','0':'Neutral','1':'Apoyo pasivo','2':'Apoyo activo'};
  const engageNames = {0:'Sin gestión',1:'Informar',2:'Consultar',3:'Involucrar',4:'Colaborar'};

  function makeActors(overrides = {}) {
    return D.actors.map(a => ({...a, ...(overrides[a.id] || {}), excluded: Boolean(overrides[a.id]?.excluded)}));
  }
  const defaults = {
    pi1: {
      name:'PI-1 · Primera versión',
      actors:makeActors({
        uni:{e:1},empresa:{e:1},fondo:{e:1},vichada:{e:1},lab:{e:1},
        reg:{e:0,excluded:true},usuarios:{e:1},otri:{e:0,excluded:true},comunidad:{e:0,excluded:true}
      }),
      links:clone(D.links)
    },
    pi2:{name:'PI-2 · Condición inicial',actors:makeActors(),links:clone(D.links)},
    plan:{name:'PI-2 · Plan de vinculación',actors:makeActors({
      uni:{e:4},empresa:{e:4},fondo:{e:3},vichada:{e:3},lab:{e:3},
      reg:{e:4,a:0},usuarios:{e:2},otri:{e:2},comunidad:{e:2}
    }),links:clone(D.links)}
  };
  const state = {
    scenarioKey:'pi2',
    actors:clone(defaults.pi2.actors),
    links:clone(defaults.pi2.links),
    food:false,
    reference:'pi1',
    saved:[],
    options:{k:15,beta:.5,high:70,low:40,excluded:'zero'},
    detail:'C1',
    timerRemaining:900,
    timerInterval:null,
    timerDeadline:null,
    decision:''
  };

  function activeAssumptions() {
    return D.assumptions.filter(a => a.id !== (state.food ? 'C4' : 'C4b'));
  }
  function levelRequired(a) {
    return clamp(1 + Number(a.p>=4 || a.i>=4) + Number(a.p>=4 && a.i>=4) + Number(a.p>=4 && a.a<0),1,4);
  }
  function gapFor(a) { return Math.max(0, levelRequired(a) - (a.excluded ? 0 : a.e)); }
  function priorityStatus(value) {
    if (value >= state.options.high) return {label:'Reforzado',css:'strong'};
    if (value >= state.options.low) return {label:'Frágil',css:'fragile'};
    return {label:'Debilitado',css:'weak'};
  }
  function calculate(assumptionId, actors=state.actors, links=state.links) {
    const mapped = links[assumptionId] || [];
    const parts = actors.filter(a=>mapped.includes(a.id)).map(a=>{
      const r=levelRequired(a);
      const e=a.excluded?0:a.e;
      const gap=Math.max(0,r-e);
      const ignored=a.excluded&&state.options.excluded==='ignore';
      const attitudeFactor=.25+.20*(2-a.a);
      const impact = ignored?0:state.options.k*(a.p/5)*attitudeFactor*(1+state.options.beta*gap);
      return {actor:a,r,e,gap,attitudeFactor,impact,ignored};
    });
    const raw=clamp(100-parts.reduce((sum,r)=>sum+r.impact,0),0,100);
    // SOLO PARA EL EJEMPLO DE CLASE: barrera independiente de la gestión de actores.
    const final=assumptionId==='C4b'?Math.min(25,raw):raw;
    return {score:round(final),raw:round(raw),parts};
  }
  function scenarioByKey(key) {
    if (defaults[key]) return defaults[key];
    return state.saved.find(s=>s.key===key) || defaults.pi1;
  }
  function changed(a) {
    const base=defaults[state.scenarioKey].actors.find(x=>x.id===a.id);
    return ['p','i','a','e','excluded'].some(k=>a[k]!==base[k]);
  }
  function allScoreRecords(actors=state.actors,links=state.links) {
    return activeAssumptions().map(a=>({...a, ...calculate(a.id,actors,links)}));
  }
  function notify(message) {
    const box=$('#toast'); box.textContent=message; box.classList.add('show');
    clearTimeout(notify._t); notify._t=setTimeout(()=>box.classList.remove('show'),3000);
  }
  function renderIntro() {
    $('#case-description').textContent=D.meta.context;
    $('#case-detail').textContent=D.meta.detail;
    $('#metric-grid').innerHTML=D.meta.metrics.map(m=>`<div class="metric"><span class="metric-label">${esc(m.label)}</span><strong class="metric-value">${esc(m.value)}</strong></div>`).join('');
  }
  function renderScenarioControls() {
    document.querySelectorAll('[data-scenario]').forEach(btn=>{
      const isActive=btn.dataset.scenario===state.scenarioKey;
      btn.classList.toggle('active',isActive);
      btn.setAttribute('aria-pressed',String(isActive));
    });
    $('#food-variant').checked=state.food;
    const possible=[...Object.entries(defaults).map(([key,obj])=>({key,name:obj.name})),...state.saved];
    $('#compare-select').innerHTML=possible.map(x=>`<option value="${esc(x.key)}">${esc(x.name)}</option>`).join('');
    if (!possible.some(x=>x.key===state.reference)) state.reference='pi1';
    $('#compare-select').value=state.reference;
  }
  function numberOptions(first,last,current) {return Array.from({length:last-first+1},(_,i)=>i+first).map(n=>`<option value="${n}" ${n===current?'selected':''}>${n}</option>`).join('');}
  function namedOptions(labels,current) {return Object.entries(labels).map(([key,name])=>`<option value="${key}" ${Number(key)===current?'selected':''}>${key} · ${esc(name)}</option>`).join('');}
  function renderActors() {
    const excluded=state.actors.filter(a=>a.excluded).length;
    $('#actor-count').textContent=`${state.actors.length-excluded} mapeados · ${excluded} excluidos`;
    $('#actor-rows').innerHTML=state.actors.map(a=>{
      const r=levelRequired(a),gap=gapFor(a),modified=changed(a);
      const original=defaults[state.scenarioKey].actors.find(x=>x.id===a.id);
      const select=(field,values,extraClass='')=>`<select data-actor="${a.id}" data-field="${field}" class="${extraClass} ${original[field]!==a[field]?'modified':''}" aria-label="${field} de ${esc(a.name)}" ${a.excluded?'disabled':''}>${values}</select>`;
      return `<tr class="${a.excluded?'is-excluded':''} ${modified?'changed-row':''}"><td><span class="actor-name">${esc(a.name)} ${modified?'✳':''}</span><span class="actor-sector">${esc(a.sector)}</span></td><td>${select('p',numberOptions(1,5,a.p))}</td><td>${select('i',numberOptions(1,5,a.i))}</td><td>${select('a',namedOptions(postureNames,a.a),'posture-select')}</td><td>${select('e',namedOptions(engageNames,a.e),'engagement-select')}</td><td><span class="pill-num good" title="Nivel requerido">${r}</span></td><td><span class="pill-num ${gap?'bad':'good'}">${gap}</span></td><td><div class="actor-actions"><button class="icon-button" data-action="toggle" data-id="${a.id}" type="button">${a.excluded?'Incluir':'Excluir'}</button><button class="icon-button" data-action="reset" data-id="${a.id}" type="button" title="Volver al escenario base" ${!modified?'disabled':''}>↺</button></div></td></tr>`;
    }).join('');
  }
  function svg(tag, attrs={}, text=null) {
    const elem=document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.entries(attrs).forEach(([k,v])=>elem.setAttribute(k,String(v)));
    if(text!==null)elem.textContent=String(text);
    return elem;
  }
  function renderMap() {
    const target=$('#stakeholder-map'); target.replaceChildren();
    const plot={l:76,r:744,t:30,b:362};
    const pos=(a,index)=>({x:plot.l+((a.i-1)/4)*(plot.r-plot.l)+(index%3-1)*7,
      y:plot.b-((a.p-1)/4)*(plot.b-plot.t)+(Math.floor(index/3)%3-1)*6});
    target.appendChild(svg('rect',{x:plot.l,y:plot.t,width:plot.r-plot.l,height:plot.b-plot.t,fill:'#101d31',rx:8}));
    for(let n=1;n<=5;n++){
      const y=plot.b-((n-1)/4)*(plot.b-plot.t);
      const x=plot.l+((n-1)/4)*(plot.r-plot.l);
      target.append(svg('line',{x1:plot.l,y1:y,x2:plot.r,y2:y,stroke:'#2b3e58','stroke-width':1}),svg('line',{x1:x,y1:plot.t,x2:x,y2:plot.b,stroke:'#2b3e58','stroke-width':1}));
      target.append(svg('text',{x:plot.l-18,y:y+4,fill:'#92a5c2','text-anchor':'middle','font-size':12},n),svg('text',{x,y:plot.b+22,fill:'#92a5c2','text-anchor':'middle','font-size':12},n));
    }
    target.append(svg('text',{x:410,y:417,class:'axislabel','text-anchor':'middle'},'INTERÉS'),svg('text',{x:18,y:194,class:'axislabel',transform:'rotate(-90 18 194)','text-anchor':'middle'},'PODER'));
    target.append(svg('text',{x:90,y:50,class:'quadrant-label'},'GESTIONAR CUIDADOSAMENTE'),svg('text',{x:532,y:50,class:'quadrant-label'},'GESTIONAR DE CERCA'),svg('text',{x:94,y:343,class:'quadrant-label'},'MONITOREAR'),svg('text',{x:572,y:343,class:'quadrant-label'},'MANTENER INFORMADOS'));
    const ref=scenarioByKey(state.reference);
    let painted=0;
    state.actors.forEach((a,index)=>{
      if(a.excluded) return;
      painted++;
      const point=pos(a,index),prior=ref.actors.find(x=>x.id===a.id)||a;
      if(!prior.excluded){const prev=pos(prior,index);target.append(svg('circle',{cx:prev.x,cy:prev.y,r:12+levelRequired(prior)*3,class:'ref-circle'}));}
      const r=11+levelRequired(a)*3, gap=gapFor(a);
      const color=a.a>0?'#40c7a8':a.a<0?'#e58490':'#91a7c1';
      const g=svg('g',{});
      const circle=svg('circle',{cx:point.x,cy:point.y,r,fill:color+'b5',stroke:gap?'#ffbb62':color,'stroke-width':gap?3:1.5,class:'bubble',tabindex:'0',role:'img','aria-label':`${a.name}. Poder ${a.p}, interés ${a.i}, postura ${a.a}, brecha ${gap}`});
      circle.appendChild(svg('title',{},`${a.name}: P=${a.p}, I=${a.i}, A=${a.a}, E=${a.e}, R=${levelRequired(a)}, brecha=${gap}`));
      const label=svg('text',{x:point.x,y:point.y+r+14,'text-anchor':'middle',class:'bubble-label'},a.short);
      g.append(circle,label);target.appendChild(g);
    });
    $('#map-summary').textContent=`${painted} interesados visibles · ${state.actors.filter(a=>!a.excluded&&gapFor(a)>0).length} con brecha`;
  }
  function renderAssumptions() {
    const current=allScoreRecords();const ref=scenarioByKey(state.reference);
    $('#assumption-count').textContent=`${current.length} supuestos activos`;
    $('#assumption-grid').innerHTML=current.map(a=>{
      const baseline=calculate(a.id,ref.actors,ref.links).score;
      const status=priorityStatus(a.score);
      const diff=a.score-baseline;
      return `<article class="assumption-card"><div class="assump-title"><span>${esc(a.id)}</span><small>${esc(a.block)}</small></div><h3>${esc(a.title)}</h3><p>${esc(a.detail)}</p><div class="bar-line" role="img" aria-label="Solidez actual ${a.score} sobre 100, referencia ${baseline}"><span class="bar-fill ${status.css}" style="width:${a.score}%"></span><span class="threshold-line" style="left:${state.options.low}%"></span><span class="threshold-line" style="left:${state.options.high}%"></span><span class="bar-ref" style="left:${baseline}%"></span></div><div class="assump-foot"><span class="assump-state ${status.css}">${status.label}</span><span class="assump-score">${a.score}<small class="${diff>0?'positive':diff<0?'negative':''}">${diff>0?'+':''}${diff} vs ref.</small></span></div></article>`;
    }).join('');
  }
  function renderCanvas() {
    const scores=new Map(allScoreRecords().map(x=>[x.id,x.score]));
    $('#canvas-grid').innerHTML=D.canvas.map((block,index)=>{
      const linked=block.links.filter(a=>scores.has(a));
      return `<div class="canvas-card"><span class="canvas-index">${String(index+1).padStart(2,'0')}</span><h3>${esc(block.title)}</h3><p>${esc(block.text)}</p><div class="canvas-tags">${linked.map(id=>`<span class="tag ${priorityStatus(scores.get(id)).css}">${esc(id)} · ${scores.get(id)}</span>`).join('')||'<span class="tag">Sin vínculo activo</span>'}</div></div>`;
    }).join('');
  }
  function renderInsights() {
    const records=allScoreRecords().sort((a,b)=>a.score-b.score);
    const weak=records[0];
    const important=state.actors.filter(a=>!a.excluded&&gapFor(a)>0).sort((a,b)=>gapFor(b)-gapFor(a)||b.p-a.p);
    const reinforced=records.filter(a=>priorityStatus(a.score).css==='strong').length;
    let items=[`<li><strong>Supuesto más expuesto · ${esc(weak.id)}</strong>${esc(weak.title)}: ${weak.score}/100 (${priorityStatus(weak.score).label.toLowerCase()}). Debe priorizarse su validación.</li>`,
    `<li><strong>Cobertura del modelo</strong>${reinforced} de ${records.length} supuestos reforzados según los umbrales actualmente definidos.</li>`];
    if(important.length){const a=important[0];items.push(`<li><strong>Mayor brecha de involucramiento</strong>${esc(a.name)}: R=${levelRequired(a)}, E=${a.e}, brecha=${gapFor(a)}. Revisar estrategia y evidencia de relacionamiento.</li>`);}
    else items.push('<li><strong>Gestión de actores</strong>Sin brechas visibles entre los actores mapeados; confirme también los excluidos y los riesgos técnicos.</li>');
    items.push(state.food?'<li><strong>Alerta de variante alimentaria</strong>La simulación aplica un límite didáctico por evidencia de seguridad no resuelta. Un mejor mapa de actores no acredita inocuidad.</li>':'<li><strong>Decisión para el Canvas</strong>Conecte el supuesto más expuesto con el actor que puede validarlo, un entregable y un hito verificable.</li>');
    $('#insights').innerHTML='<h3>Implicaciones de sus decisiones</h3><ul>'+items.join('')+'</ul>';
  }
  function renderOptions() {
    const fields={k:'opt-k',beta:'opt-beta',high:'opt-high',low:'opt-low'};
    Object.entries(fields).forEach(([field,id])=>{ $(`#${id}`).value=state.options[field];$(`#val-${field}`).textContent=fmt(state.options[field],field==='beta'?2:0); });
    document.querySelectorAll('input[name="excluded"]').forEach(radio=>radio.checked=radio.value===state.options.excluded);
    $('#opt-low').max=String(Math.min(60,state.options.high-1));
    $('#opt-high').min=String(Math.max(45,state.options.low+1));
  }
  function renderRelations() {
    const assumptions=activeAssumptions();
    $('#relation-table').innerHTML=`<table class="relation-table"><thead><tr><th>Supuesto / actor</th>${state.actors.map(a=>`<th><span title="${esc(a.name)}">${esc(a.short)}</span></th>`).join('')}</tr></thead><tbody>${assumptions.map(s=>`<tr><td><strong>${esc(s.id)}</strong> ${esc(s.title)}</td>${state.actors.map(a=>`<td><input type="checkbox" data-link-assumption="${s.id}" data-link-actor="${a.id}" aria-label="Vínculo ${esc(s.id)} con ${esc(a.name)}" ${(state.links[s.id]||[]).includes(a.id)?'checked':''}></td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function renderCalculation() {
    const assumptions=activeAssumptions();
    if(!assumptions.some(a=>a.id===state.detail))state.detail=assumptions[0].id;
    $('#detail-select').innerHTML=assumptions.map(a=>`<option value="${a.id}" ${a.id===state.detail?'selected':''}>${a.id} · ${esc(a.title)}</option>`).join('');
    const calc=calculate(state.detail), s=priorityStatus(calc.score),assumption=assumptions.find(a=>a.id===state.detail);
    const excluded=calc.parts.filter(part=>part.ignored).length;
    $('#calc-details').innerHTML=`<div class="calc-summary"><strong class="assump-state ${s.css}">${calc.score}/100</strong><span class="badge ${s.css==='weak'?'amber':'purple'}">${s.label.toUpperCase()}</span><p>${esc(assumption.note)}</p></div><div class="table-scroller"><table class="detail-table"><thead><tr><th>Actor vinculado</th><th>P</th><th>A</th><th>R</th><th>E</th><th>Brecha</th><th>Penalidad d</th></tr></thead><tbody>${calc.parts.map(part=>`<tr><td>${esc(part.actor.name)}${part.ignored?' · ignorado':''}</td><td>${part.actor.p}</td><td>${part.actor.a}</td><td>${part.r}</td><td>${part.e}</td><td>${part.gap}</td><td>${fmt(part.impact,2)}</td></tr>`).join('')||'<tr><td colspan="7">No hay actores relacionados. Vincúlelos en la matriz.</td></tr>'}</tbody></table></div><p class="calc-explainer">Resultado antes de un posible techo didáctico: ${calc.raw}/100. Penalidad total = ${fmt(calc.parts.reduce((sum,r)=>sum+r.impact,0),2)} puntos.${excluded?' '+excluded+' actor(es) excluido(s) ignorado(s) por configuración.':''}</p>`;
  }
  function renderComparison() {
    const columns=[{name:'Actual',actors:state.actors,links:state.links,current:true},...Object.values(defaults),...state.saved];
    $('#comparison-table').innerHTML=`<table class="comp-table"><thead><tr><th>Indicador</th>${columns.map(c=>`<th>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${activeAssumptions().map(a=>`<tr><td>${esc(a.id)} · ${esc(a.title)}</td>${columns.map(c=>{const score=calculate(a.id,c.actors,c.links).score;return `<td class="${c.current?'current-cell':''} ${score>=state.options.high?'good-cell':score<state.options.low?'weak-cell':''}">${score} / 100</td>`;}).join('')}</tr>`).join('')}<tr><td><strong>Supuestos reforzados</strong></td>${columns.map(c=>`<td>${allScoreRecords(c.actors,c.links).filter(a=>a.score>=state.options.high).length}</td>`).join('')}</tr><tr><td><strong>Actores mapeados</strong></td>${columns.map(c=>`<td>${c.actors.filter(a=>!a.excluded).length} / ${c.actors.length}</td>`).join('')}</tr></tbody></table>`;
  }
  function renderAll() {
    renderScenarioControls();renderActors();renderMap();renderAssumptions();renderCanvas();renderInsights();renderOptions();renderRelations();renderCalculation();renderComparison();
  }
  function useScenario(key) {
    if(!defaults[key])return;
    state.scenarioKey=key;state.actors=clone(defaults[key].actors);state.links=clone(defaults[key].links);renderAll();
    notify('Cargado: '+defaults[key].name);
  }
  function resetActor(id) {
    const i=state.actors.findIndex(a=>a.id===id),original=defaults[state.scenarioKey].actors.find(a=>a.id===id);
    if(i<0||!original)return;state.actors[i]=clone(original);renderAll();
  }
  function updateActor(id,field,value) {
    const actor=state.actors.find(a=>a.id===id);if(!actor || !['p','i','a','e'].includes(field))return;
    const limits={p:[1,5],i:[1,5],a:[-2,2],e:[0,4]};
    const v=Number(value);if(!Number.isInteger(v))return;
    actor[field]=clamp(v,...limits[field]);renderAll();
  }
  function toggleActor(id) {
    const actor=state.actors.find(a=>a.id===id);if(!actor)return;
    if(!actor.excluded){actor.previousE=actor.e;actor.e=0;actor.excluded=true;}
    else {actor.excluded=false;actor.e=clamp(actor.previousE??defaults[state.scenarioKey].actors.find(a=>a.id===id)?.e??1,0,4);delete actor.previousE;}
    renderAll();
  }
  function saveCurrent() {
    if(state.saved.length>=4){notify('Máximo de cuatro escenarios guardados.');return;}
    const number=state.saved.length+1;
    state.saved.push({key:'saved'+number+'_'+Date.now(),name:'Guardado '+number,actors:clone(state.actors),links:clone(state.links)});
    renderAll();notify('Escenario guardado para comparación.');
  }
  function downloadScenario() {
    const exportObj={format:'simulador-cardanol-pi2',version:1,exportedAt:new Date().toISOString(),scenarioKey:state.scenarioKey,actors:state.actors,links:state.links,options:state.options,food:state.food,reference:state.reference,decision:$('#decision').value,saved:state.saved};
    const blob=new Blob([JSON.stringify(exportObj,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='escenario-cardanol-pi2.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('Archivo JSON preparado.');
  }
  function validateImport(content) {
    if(!content||content.format!=='simulador-cardanol-pi2'||content.version!==1||!Array.isArray(content.actors))throw new Error('Formato o versión no compatible.');
    if(content.actors.length!==D.actors.length||!content.actors.every(a=>actorIds.has(a.id)))throw new Error('Listado de actores no compatible.');
    const normalizedActors=D.actors.map(b=>{
      const a=content.actors.find(x=>x.id===b.id);const x={...b};
      for(const [k,min,max] of [['p',1,5],['i',1,5],['a',-2,2],['e',0,4]]){
        if(!Number.isInteger(a[k]) || a[k]<min||a[k]>max)throw new Error('Valor fuera de escala: '+k);x[k]=a[k];
      }
      x.excluded=Boolean(a.excluded);if(x.excluded)x.e=0;
      if(Number.isInteger(a.previousE))x.previousE=clamp(a.previousE,0,4);
      return x;
    });
    function cleanLinks(o){const result={};for(const s of D.assumptions){const arr=o?.[s.id];if(!Array.isArray(arr)||arr.some(v=>!actorIds.has(v)))throw new Error('Matriz de vínculos no válida.');result[s.id]=[...new Set(arr)];}return result;}
    const links=cleanLinks(content.links);
    const scenarioKey=Object.hasOwn(defaults,content.scenarioKey)?content.scenarioKey:'pi2';
    const saved=(Array.isArray(content.saved)?content.saved:[]).slice(0,4).map((s,i)=>({key:'saved'+(i+1)+'_imported',name:'Importado '+(i+1),actors:validateSavedActors(s.actors),links:cleanLinks(s.links)}));
    function validateSavedActors(values){if(!Array.isArray(values)||values.length!==D.actors.length)throw new Error('Escenario guardado incompatible.');return D.actors.map(b=>{const a=values.find(v=>v.id===b.id);if(!a)throw new Error('Actor guardado incompatible.');const obj={...b};for(const [k,min,max] of [['p',1,5],['i',1,5],['a',-2,2],['e',0,4]]){if(!Number.isInteger(a[k])||a[k]<min||a[k]>max)throw new Error('Dato guardado fuera de escala.');obj[k]=a[k];}obj.excluded=Boolean(a.excluded);if(obj.excluded)obj.e=0;return obj;});}
    const opts={k:15,beta:.5,high:70,low:40,excluded:'zero'};
    for(const [key,min,max] of [['k',0,30],['beta',0,2],['high',45,95],['low',5,60]]){if(Number.isFinite(content.options?.[key]))opts[key]=clamp(content.options[key],min,max);}
    if(opts.low>=opts.high)opts.low=opts.high-1;
    if(['zero','ignore'].includes(content.options?.excluded))opts.excluded=content.options.excluded;
    return {actors:normalizedActors,links,scenarioKey,saved,options:opts,food:Boolean(content.food),decision:String(content.decision||'').slice(0,2000)};
  }
  async function importScenario(file) {
    try {
      if(file.size>300000)throw new Error('Archivo demasiado grande (límite 300 KB).');
      const parsed=validateImport(JSON.parse(await file.text()));
      Object.assign(state,parsed);state.reference='pi1';$('#decision').value=parsed.decision;
      renderAll();updateDecisionCount();notify('Escenario importado correctamente.');
    } catch(e) {notify('No se pudo importar: '+e.message);}
  }
  function copyExit() {
    const summary=allScoreRecords().map(a=>`${a.id} ${a.title}: ${a.score}/100 (${priorityStatus(a.score).label})`).join('\n');
    const biggest=state.actors.filter(a=>!a.excluded).sort((a,b)=>gapFor(b)-gapFor(a))[0];
    const text=`TARJETA DE SALIDA — SIMULADOR DEL CARDANOL\nEscenario: ${defaults[state.scenarioKey].name}\nUso: ${state.food?'variante alimentaria':'cosmética y lubricantes'}\nReferencia: ${scenarioByKey(state.reference).name}\n\nSOLIDEZ DE SUPUESTOS\n${summary}\n\nACTOR CON MAYOR BRECHA\n${biggest?`${biggest.name}: R=${levelRequired(biggest)}, E=${biggest.e}, brecha=${gapFor(biggest)}`:'No hay actores mapeados'}\n\nDECISIÓN Y JUSTIFICACIÓN\n${$('#decision').value.trim()||'Sin diligenciar'}\n\nNota: puntuaciones procedentes de un modelo demostrativo, no validado técnicamente.`;
    if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>notify('Tarjeta copiada al portapapeles.')).catch(()=>fallbackCopy(text));}
    else fallbackCopy(text);
  }
  function fallbackCopy(text){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();try{document.execCommand('copy');notify('Tarjeta copiada al portapapeles.');}catch(_){notify('No se pudo copiar automáticamente.');}t.remove();}
  function updateDecisionCount(){$('#decision-count').textContent=`${$('#decision').value.length} / 2000 caracteres`;}
  function renderTimer(){const time=state.timerRemaining;$('#timer-display').textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`;$('#timer-start').textContent=state.timerInterval?'Ⅱ Pausar':'▶ Iniciar';}
  function stopTimer(){clearInterval(state.timerInterval);state.timerInterval=null;state.timerDeadline=null;renderTimer();}
  function startPauseTimer(){if(state.timerInterval){state.timerRemaining=Math.max(0,Math.ceil((state.timerDeadline-Date.now())/1000));stopTimer();return;}if(state.timerRemaining<=0)state.timerRemaining=900;state.timerDeadline=Date.now()+state.timerRemaining*1000;state.timerInterval=setInterval(()=>{state.timerRemaining=Math.max(0,Math.ceil((state.timerDeadline-Date.now())/1000));renderTimer();if(state.timerRemaining===0){stopTimer();notify('Finalizó el tiempo del taller.');}},250);renderTimer();}
  function initEvents() {
    document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>useScenario(b.dataset.scenario)));
    $('#undo-changes').addEventListener('click',()=>useScenario(state.scenarioKey));
    $('#food-variant').addEventListener('change',e=>{state.food=e.target.checked;renderAll();});
    $('#compare-select').addEventListener('change',e=>{state.reference=e.target.value;renderAll();});
    $('#actor-rows').addEventListener('change',e=>{if(e.target.matches('select[data-actor]'))updateActor(e.target.dataset.actor,e.target.dataset.field,e.target.value);});
    $('#actor-rows').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;if(b.dataset.action==='toggle')toggleActor(b.dataset.id);if(b.dataset.action==='reset')resetActor(b.dataset.id);});
    $('#relation-table').addEventListener('change',e=>{const el=e.target;if(!el.matches('[data-link-assumption]'))return;const s=el.dataset.linkAssumption,a=el.dataset.linkActor;if(!assumptionIds.has(s)||!actorIds.has(a))return;const set=new Set(state.links[s]);if(el.checked)set.add(a);else set.delete(a);state.links[s]=[...set];renderAll();});
    $('#reset-links').addEventListener('click',()=>{state.links=clone(defaults[state.scenarioKey].links);renderAll();notify('Vínculos restablecidos.');});
    $('#detail-select').addEventListener('change',e=>{state.detail=e.target.value;renderCalculation();});
    ['k','beta','high','low'].forEach(key=>{$(`#opt-${key}`).addEventListener('input',e=>{state.options[key]=Number(e.target.value);if(state.options.low>=state.options.high){if(key==='low')state.options.high=state.options.low+1;else state.options.low=state.options.high-1;}renderOptions();renderAssumptions();renderCanvas();renderInsights();renderCalculation();renderComparison();});});
    document.querySelectorAll('[name="excluded"]').forEach(x=>x.addEventListener('change',e=>{if(!e.target.checked)return;state.options.excluded=e.target.value;renderAssumptions();renderCanvas();renderInsights();renderCalculation();renderComparison();}));
    $('#reset-options').addEventListener('click',()=>{state.options={k:15,beta:.5,high:70,low:40,excluded:'zero'};renderAll();});
    $('#save-scenario').addEventListener('click',saveCurrent);
    $('#download-json').addEventListener('click',downloadScenario);
    $('#import-json').addEventListener('click',()=>$('#import-file').click());
    $('#import-file').addEventListener('change',e=>{const file=e.target.files[0];if(file)importScenario(file);e.target.value='';});
    $('#copy-exit').addEventListener('click',copyExit);
    $('#decision').addEventListener('input',updateDecisionCount);
    $('#timer-start').addEventListener('click',startPauseTimer);
    $('#timer-reset').addEventListener('click',()=>{stopTimer();state.timerRemaining=900;renderTimer();});
    document.querySelectorAll('.side-nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.side-nav a').forEach(x=>x.classList.remove('active'));a.classList.add('active');}));
  }
  renderIntro();renderAll();renderTimer();initEvents();updateDecisionCount();
})();
