'use strict';

// Inject header and footer
async function injectPartials(){
  const headerContainer = document.getElementById('site-header');
  const footerContainer = document.getElementById('site-footer');
  if(headerContainer){
    const res = await fetch('/fcb/header.html');
    headerContainer.innerHTML = await res.text();
  }
  if(footerContainer){
    const res = await fetch('/fcb/footer.html');
    footerContainer.innerHTML = await res.text();
    const yearEl = footerContainer.querySelector('[data-year]');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
  }
}

// Load athletes data
async function loadAthletes(){
  const res = await fetch('/fcb/data/athletes.js');
  const text = await res.text();
  // Evaluate module-like export
  const module = {exports:{}};
  // eslint-disable-next-line no-new-func
  const fn = new Function('module','exports', text + '\n;return module.exports;');
  return fn(module, module.exports);
}

function createAthleteCard(a){
  const el = document.createElement('div');
  el.className = 'card-dark p-3 h-100 shadow-soft';
  el.innerHTML = `
    <div class="ratio ratio-16x9 mb-3">
      <img src="${a.imageURL}" class="rounded w-100 h-100 object-fit-cover" alt="${a.name}">
    </div>
    <div class="d-flex justify-content-between align-items-start mb-2">
      <h6 class="mb-0 title">${a.name}</h6>
      <span class="badge badge-role rounded-pill px-3 py-2">${a.role}</span>
    </div>
    <div class="muted small">${a.sport}</div>
  `;
  return el;
}

// Homepage: build carousels
async function initHome(){
  const list = await loadAthletes();
  const football = list.filter(a => a.sport === 'Football');
  const basket = list.filter(a => a.sport === 'Basketball');

  const sections = [
    { id: 'splide-football', data: football },
    { id: 'splide-basket', data: basket },
  ];

  sections.forEach(section => {
    const root = document.getElementById(section.id);
    if(!root) return;

    const track = root.querySelector('.splide__list');
    section.data.forEach(a => {
      const li = document.createElement('li');
      li.className = 'splide__slide';
      const card = createAthleteCard(a);
      li.appendChild(card);
      track.appendChild(li);
    });

    new Splide(`#${section.id}`, {
      type: 'loop',
      perPage: 3,
      gap: '1rem',
      autoplay: true,
      breakpoints: {
        992: { perPage: 2 },
        576: { perPage: 1 },
      }
    }).mount();
  });
}

// Talents page: Isotope grid and filters
async function initTalents(){
  const gridEl = document.querySelector('.grid');
  if(!gridEl) return;
  const list = await loadAthletes();

  list.forEach(a => {
    const wrap = document.createElement('div');
    wrap.className = `grid-item mb-4`;
    wrap.setAttribute('data-sport', a.sport);
    wrap.setAttribute('data-role', a.role);
    wrap.innerHTML = '';
    wrap.appendChild(createAthleteCard(a));
    gridEl.appendChild(wrap);
  });

  const iso = new Isotope(gridEl, {
    itemSelector: '.grid-item',
    layoutMode: 'fitRows',
    percentPosition: true,
    getSortData: { name: '.title' }
  });

  // filtering
  const filterBar = document.getElementById('filter-bar');
  if(filterBar){
    filterBar.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-filter]');
      if(!btn) return;
      [...filterBar.querySelectorAll('button')].forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      if(filter === '*') iso.arrange({ filter: '*' });
      else iso.arrange({ filter: (itemElem)=> itemElem.matches(filter) });
    });
  }

  // role filters
  const roleBar = document.getElementById('role-bar');
  if(roleBar){
    roleBar.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-role]');
      if(!btn) return;
      [...roleBar.querySelectorAll('button')].forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.getAttribute('data-role');
      iso.arrange({ filter: role === '*' ? '*' : `[data-role="${role}"]` });
    });
  }
}

// Utility: detect page
function currentPage(){
  const p = document.body.getAttribute('data-page');
  return p || '';
}

// Initialize after DOM ready
window.addEventListener('DOMContentLoaded', async ()=>{
  await injectPartials();
  const page = currentPage();
  if(page === 'home') await initHome();
  if(page === 'talents') await initTalents();
});
