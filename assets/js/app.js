
const NUTRI_RECIPES = [{"slug": "green-goddess-bowl", "name": "Green Goddess Power Bowl", "kcal": 520, "protein": 28, "carbs": 58, "fat": 21, "time": 25, "tag": "Vegetarian", "img": "green-goddess-bowl.svg"}, {"slug": "mediterranean-chicken", "name": "Mediterranean Chicken Plate", "kcal": 610, "protein": 49, "carbs": 54, "fat": 22, "time": 35, "tag": "High Protein", "img": "mediterranean-chicken.svg"}, {"slug": "salmon-avocado", "name": "Salmon Avocado Rice Bowl", "kcal": 640, "protein": 42, "carbs": 56, "fat": 27, "time": 30, "tag": "Omega-3", "img": "salmon-avocado.svg"}, {"slug": "berry-oats", "name": "Berry Protein Overnight Oats", "kcal": 420, "protein": 31, "carbs": 52, "fat": 10, "time": 10, "tag": "Breakfast", "img": "berry-oats.svg"}, {"slug": "lentil-soup", "name": "Roasted Tomato Lentil Soup", "kcal": 380, "protein": 24, "carbs": 56, "fat": 8, "time": 45, "tag": "Plant Based", "img": "lentil-soup.svg"}, {"slug": "turkey-wrap", "name": "Crunchy Turkey Hummus Wrap", "kcal": 460, "protein": 36, "carbs": 48, "fat": 14, "time": 15, "tag": "Lunch", "img": "turkey-wrap.svg"}, {"slug": "tofu-stir-fry", "name": "Ginger Tofu Stir-Fry", "kcal": 500, "protein": 30, "carbs": 62, "fat": 17, "time": 25, "tag": "Plant Based", "img": "tofu-stir-fry.svg"}, {"slug": "protein-pancakes", "name": "Banana Protein Pancakes", "kcal": 440, "protein": 34, "carbs": 55, "fat": 11, "time": 20, "tag": "Breakfast", "img": "protein-pancakes.svg"}];

const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => [...ctx.querySelectorAll(s)];

function toast(message) {
  let t = $('.toast');
  if(!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}

function setupTheme() {
  const saved = localStorage.getItem('nutriplan-theme') || 'light';
  document.documentElement.dataset.theme = saved;
  const btn = $('#themeToggle');
  if(btn) {
    btn.textContent = saved === 'dark' ? '☀' : '☾';
    btn.addEventListener('click',()=>{
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('nutriplan-theme', next);
      btn.textContent = next === 'dark' ? '☀' : '☾';
    });
  }
}

function setupMenu() {
  const btn = $('#menuBtn');
  const links = $('#navLinks');
  if(btn && links) btn.addEventListener('click',()=>links.classList.toggle('open'));
}

function setupReveal() {
  const obs = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  }), {threshold:.08});
  $$('.reveal').forEach(el=>obs.observe(el));
}

function setupAccordions() {
  $$('.accordion-btn').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.accordion-item').classList.toggle('open')));
}

function setupFavorites() {
  const set = new Set(JSON.parse(localStorage.getItem('nutriplan-favorites') || '[]'));
  $$('.fav-btn').forEach(btn=>{
    const slug = btn.dataset.slug;
    if(set.has(slug)) { btn.classList.add('is-favorite'); btn.textContent='♥'; }
    btn.addEventListener('click',()=>{
      if(set.has(slug)) {set.delete(slug); btn.classList.remove('is-favorite'); btn.textContent='♡';}
      else {set.add(slug); btn.classList.add('is-favorite'); btn.textContent='♥';}
      localStorage.setItem('nutriplan-favorites', JSON.stringify([...set]));
      toast(set.has(slug) ? 'Saved to favorites' : 'Removed from favorites');
      if(document.body.dataset.page === 'favorites') renderFavorites();
    });
  });
}

function recipeCard(r) {
  return `<article class="card recipe-card reveal visible" data-name="${r.name.toLowerCase()}" data-tag="${r.tag.toLowerCase()}">
    <img src="assets/images/${r.img}" alt="${r.name}">
    <div class="recipe-body">
      <div class="recipe-title-row"><div><span class="tag">${r.tag}</span><h3 style="margin-top:10px">${r.name}</h3></div><button class="fav-btn" data-slug="${r.slug}" aria-label="Favorite">♡</button></div>
      <div class="recipe-stats"><span>⏱ ${r.time} min</span><span>🔥 ${r.kcal} kcal</span><span>💪 ${r.protein}g protein</span></div>
      <div style="margin-top:18px"><a class="btn btn-secondary" href="recipe-${r.slug}.html">View recipe →</a></div>
    </div>
  </article>`;
}

function setupRecipeFilter() {
  const search = $('#recipeSearch');
  const tag = $('#recipeTag');
  if(!search || !tag) return;
  const cards = $$('.recipe-card');
  const filter = () => {
    const q = search.value.toLowerCase().trim();
    const t = tag.value.toLowerCase();
    cards.forEach(c=>{
      const ok = (!q || c.dataset.name.includes(q)) && (!t || c.dataset.tag === t);
      c.style.display = ok ? '' : 'none';
    });
  };
  search.addEventListener('input',filter); tag.addEventListener('change',filter);
}

function plannerRecipes(goal) {
  if(goal === 'High protein') return [...NUTRI_RECIPES].sort((a,b)=>b.protein-a.protein);
  if(goal === 'Plant forward') return [...NUTRI_RECIPES].sort((a,b)=>(b.tag.includes('Plant')||b.tag.includes('Vegetarian'))-(a.tag.includes('Plant')||a.tag.includes('Vegetarian')));
  return NUTRI_RECIPES;
}

function generatePlan() {
  const goal = $('#goalSelect')?.value || 'Balanced';
  const calories = Number($('#calorieTarget')?.value || 2000);
  const meals = Number($('#mealCount')?.value || 3);
  const pool = plannerRecipes(goal);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const plan = days.map((day,di)=>{
    const picks = [];
    for(let i=0;i<meals;i++) picks.push(pool[(di*2+i)%pool.length]);
    const kcal = picks.reduce((s,r)=>s+r.kcal,0);
    return {day, meals:picks.map(r=>r.slug), kcal};
  });
  localStorage.setItem('nutriplan-plan', JSON.stringify({goal, calories, meals, plan}));
  renderPlan();
  toast('Your 7-day plan is ready');
}

function renderPlan() {
  const out = $('#planOutput');
  if(!out) return;
  let data = JSON.parse(localStorage.getItem('nutriplan-plan') || 'null');
  if(!data) {
    out.innerHTML = `<div class="empty-state"><div style="font-size:2rem">🥗</div><h3>No plan yet</h3><p>Choose your goal and generate a personalized demo week.</p></div>`;
    return;
  }
  out.innerHTML = data.plan.map(d=>{
    const meals = d.meals.map(slug=>NUTRI_RECIPES.find(r=>r.slug===slug)).filter(Boolean);
    return `<div class="day-card reveal visible"><div style="display:flex;justify-content:space-between;gap:12px"><div><h3>${d.day}</h3><p>${Math.round(d.kcal)} kcal from planned meals</p></div><span class="tag">${data.goal}</span></div>
      ${meals.map(r=>`<div class="meal-row"><img src="assets/images/${r.img}" alt=""><div><strong>${r.name}</strong><div class="muted">${r.protein}g protein · ${r.time} min</div></div><strong>${r.kcal}</strong></div>`).join('')}
      <div style="margin-top:12px"><div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100,d.kcal/data.calories*100)}%"></div></div></div>
    </div>`;
  }).join('');
}

function setupPlanner() {
  const form = $('#plannerForm');
  if(!form) return;
  form.addEventListener('submit',e=>{e.preventDefault();generatePlan();});
  $('#resetPlan')?.addEventListener('click',()=>{localStorage.removeItem('nutriplan-plan');renderPlan();});
  renderPlan();
}

function setupShoppingList() {
  const wrap = $('#shoppingList');
  if(!wrap) return;
  const defaults = [
    ['Produce','Spinach'],['Produce','Avocados'],['Produce','Berries'],['Produce','Bell peppers'],
    ['Protein','Chicken breast'],['Protein','Salmon fillets'],['Protein','Greek yogurt'],['Protein','Firm tofu'],
    ['Pantry','Rolled oats'],['Pantry','Brown rice'],['Pantry','Quinoa'],['Pantry','Lentils']
  ];
  let items = JSON.parse(localStorage.getItem('nutriplan-shopping') || 'null') || defaults.map((x,i)=>({id:i+1,cat:x[0],name:x[1],done:false}));
  const save=()=>localStorage.setItem('nutriplan-shopping',JSON.stringify(items));
  function render() {
    const cats=[...new Set(items.map(i=>i.cat))];
    wrap.innerHTML = cats.map(cat=>`<div class="shopping-category"><h3>${cat}</h3>${items.filter(i=>i.cat===cat).map(i=>`<div class="shopping-item ${i.done?'done':''}" data-id="${i.id}"><input type="checkbox" ${i.done?'checked':''}><span class="shopping-text">${i.name}</span><button class="icon-btn delete-item" aria-label="Delete">×</button></div>`).join('')}</div>`).join('');
    $$('#shoppingList input[type=checkbox]').forEach(ch=>ch.addEventListener('change',()=>{
      const row=ch.closest('.shopping-item'); const item=items.find(i=>String(i.id)===row.dataset.id); item.done=ch.checked; save(); render();
    }));
    $$('.delete-item').forEach(b=>b.addEventListener('click',()=>{const id=b.closest('.shopping-item').dataset.id;items=items.filter(i=>String(i.id)!==id);save();render();}));
  }
  $('#addShoppingItem')?.addEventListener('submit',e=>{
    e.preventDefault(); const name=$('#newItem').value.trim(); const cat=$('#newCategory').value; if(!name)return;
    items.push({id:Date.now(),cat,name,done:false}); save(); render(); e.target.reset(); toast('Item added');
  });
  $('#clearChecked')?.addEventListener('click',()=>{items=items.filter(i=>!i.done);save();render();});
  render();
}

function macroCalculate() {
  const calories = Number($('#macroCalories')?.value||2000);
  const p = Number($('#proteinPct')?.value||30);
  const c = Number($('#carbPct')?.value||40);
  const f = Math.max(0,100-p-c);
  $('#fatPct').value = f;
  $('#proteinGrams').textContent = Math.round(calories*p/100/4)+'g';
  $('#carbGrams').textContent = Math.round(calories*c/100/4)+'g';
  $('#fatGrams').textContent = Math.round(calories*f/100/9)+'g';
  const ring = $('#macroRing');
  if(ring) ring.style.background=`conic-gradient(#22c55e 0 ${p}%,#2563eb ${p}% ${p+c}%,#f59e0b ${p+c}% 100%)`;
}
function setupMacro() {
  ['macroCalories','proteinPct','carbPct'].forEach(id=>$('#'+id)?.addEventListener('input',macroCalculate));
  if($('#macroRing')) macroCalculate();
}

function drawLineChart(canvas, values, labels, color='#22c55e') {
  if(!canvas) return;
  const dpr = devicePixelRatio || 1, w=canvas.clientWidth, h=canvas.clientHeight||260;
  canvas.width=w*dpr;canvas.height=h*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,w,h); const pad=36, max=Math.max(...values)*1.15, min=Math.min(...values)*.9;
  ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--border');ctx.lineWidth=1;
  for(let i=0;i<5;i++){let y=pad+(h-pad*2)*i/4;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();}
  ctx.strokeStyle=color;ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
  values.forEach((v,i)=>{const x=pad+(w-pad*2)*i/(values.length-1);const y=h-pad-(v-min)/(max-min)*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.stroke();
  ctx.fillStyle=color;values.forEach((v,i)=>{const x=pad+(w-pad*2)*i/(values.length-1);const y=h-pad-(v-min)/(max-min)*(h-pad*2);ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted');ctx.font='12px system-ui';ctx.textAlign='center';
  labels.forEach((l,i)=>{const x=pad+(w-pad*2)*i/(labels.length-1);ctx.fillText(l,x,h-10);});
}

function drawBarChart(canvas, values, labels) {
  if(!canvas)return; const dpr=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight||260;
  canvas.width=w*dpr;canvas.height=h*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const pad=36,max=Math.max(...values)*1.15,bw=(w-pad*2)/values.length*0.58;
  values.forEach((v,i)=>{const slot=(w-pad*2)/values.length,x=pad+i*slot+(slot-bw)/2,bh=(h-pad*2)*v/max,y=h-pad-bh;
    const g=ctx.createLinearGradient(0,y,0,h-pad);g.addColorStop(0,'#22c55e');g.addColorStop(1,'#2563eb');ctx.fillStyle=g;ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(x,y,bw,bh,10); else ctx.rect(x,y,bw,bh);ctx.fill();
    ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted');ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(labels[i],x+bw/2,h-10);
  });
}

function setupCharts() {
  const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  drawLineChart($('#weightChart'),[73.2,73.0,72.9,72.8,72.6,72.5,72.4],labels,'#7c3aed');
  drawBarChart($('#calorieChart'),[1920,2050,1980,1870,2010,2100,1940],labels);
  drawLineChart($('#proteinChart'),[118,132,125,140,134,128,138],labels,'#16a34a');
}
window.addEventListener('resize',()=>{clearTimeout(window.__resize);window.__resize=setTimeout(setupCharts,150);});

function setupGoals() {
  const form=$('#goalForm'); if(!form)return;
  const state=JSON.parse(localStorage.getItem('nutriplan-goals')||'{"calories":2000,"protein":130,"water":2.5,"workouts":4}');
  ['calories','protein','water','workouts'].forEach(k=>{if($('#goal-'+k)) $('#goal-'+k).value=state[k];});
  form.addEventListener('submit',e=>{e.preventDefault(); const out={};['calories','protein','water','workouts'].forEach(k=>out[k]=Number($('#goal-'+k).value));localStorage.setItem('nutriplan-goals',JSON.stringify(out));toast('Goals saved');});
}

function renderFavorites() {
  const wrap=$('#favoritesGrid'); if(!wrap)return;
  const set=new Set(JSON.parse(localStorage.getItem('nutriplan-favorites')||'[]'));
  const items=NUTRI_RECIPES.filter(r=>set.has(r.slug));
  wrap.innerHTML=items.length?items.map(recipeCard).join(''):`<div class="empty-state" style="grid-column:1/-1"><div style="font-size:2.2rem">♡</div><h3>No favorites yet</h3><p>Save recipes you want to cook again.</p><a class="btn btn-primary" href="recipes.html">Browse recipes</a></div>`;
  setupFavorites();
}

function setupContact() {
  const f=$('#contactForm');if(!f)return;f.addEventListener('submit',e=>{e.preventDefault();f.reset();toast('Demo message sent — no data leaves this site.');});
}

function setupSettings() {
  $$('.switch').forEach(sw=>sw.addEventListener('click',()=>{sw.classList.toggle('on');toast('Preference updated');}));
}

document.addEventListener('DOMContentLoaded',()=>{
  setupTheme();setupMenu();setupReveal();setupAccordions();setupFavorites();setupRecipeFilter();
  setupPlanner();setupShoppingList();setupMacro();setupCharts();setupGoals();renderFavorites();setupContact();setupSettings();
  const gen=$('#generatePlan'); if(gen) gen.addEventListener('click',generatePlan);
});
