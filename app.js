
const state = {
  currentView: 'menu',
  plate: [],
  currentCategory: 'Все меню'
};

const categories = window.MENU_DATA.categories;
const menuItems = window.MENU_DATA.items;
const nav = document.getElementById('category-nav');
const sectionsWrap = document.getElementById('menu-sections');
const modal = document.getElementById('dish-modal');
const modalContent = document.getElementById('modal-content');
const plateList = document.getElementById('plate-list');
const plateEmpty = document.getElementById('plate-empty');
const plateSummary = document.getElementById('plate-summary');
const plateCount = document.getElementById('plate-count');

function allFoodCategories() {
  return categories.filter(c => c !== 'Все меню');
}

function hasMacros(item) {
  return [item.kcal, item.p, item.f, item.c].every(v => typeof v === 'number');
}

function renderCategoryNav() {
  nav.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-chip' + (state.currentCategory === cat ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      state.currentCategory = cat;
      updateActiveCategory();
      if (cat === 'Все меню') {
        window.scrollTo({top: 0, behavior: 'smooth'});
      } else {
        const target = document.getElementById('section-' + slug(cat));
        if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    };
    nav.appendChild(btn);
  });
}

function renderMenu() {
  sectionsWrap.innerHTML = '';
  allFoodCategories().forEach(category => {
    const section = document.createElement('section');
    section.className = 'menu-section';
    section.id = 'section-' + slug(category);

    const title = document.createElement('h2');
    title.className = 'menu-section-title';
    title.textContent = category;
    section.appendChild(title);

    const items = menuItems[category] || [];
    const foodItems = items.filter(i => i.photo);
    const textItems = items.filter(i => !i.photo);

    if (foodItems.length) {
      const grid = document.createElement('div');
      grid.className = 'food-grid';
      foodItems.forEach(item => {
        const card = document.createElement('button');
        card.className = 'food-card';
        card.innerHTML = `
          <img class="food-image" src="images/${item.photo}" alt="${item.name}">
          <div class="food-meta">
            <div class="food-name">${item.name}</div>
            ${typeof item.kcal === 'number' ? `<div class="food-kcal">${Math.round(item.kcal)} ккал</div>` : ''}
            ${hasMacros(item) ? `<div class="food-macros">Б ${fmt(item.p)} · Ж ${fmt(item.f)} · У ${fmt(item.c)}</div>` : ''}
          </div>`;
        card.onclick = () => openDish(item, category);
        grid.appendChild(card);
      });
      section.appendChild(grid);
    }

    if (textItems.length) {
      const list = document.createElement('div');
      list.className = 'text-list';
      textItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'text-item';
        row.innerHTML = `<div><div class="text-item-name">${item.name}</div>${item.description ? `<div class="text-item-sub">${item.description}</div>` : ''}</div>`;
        row.onclick = () => openDish(item, category);
        list.appendChild(row);
      });
      section.appendChild(list);
    }

    sectionsWrap.appendChild(section);
  });
}

function openDish(item, category) {
  modalContent.innerHTML = `
    <div class="detail-wrap">
      ${item.photo ? `<img class="detail-image" src="images/${item.photo}" alt="${item.name}">` : ''}
      <div class="detail-name">${item.name}</div>
      ${item.description ? `<div class="detail-description">${item.description}</div>` : ''}
      ${typeof item.kcal === 'number' ? `<div class="detail-kcal">${Math.round(item.kcal)} ккал</div>` : ''}
      ${hasMacros(item) ? `<div class="detail-macros">Б ${fmt(item.p)} · Ж ${fmt(item.f)} · У ${fmt(item.c)}</div>` : ''}
      <button class="primary-button" id="add-to-plate">Добавить в тарелку</button>
    </div>
  `;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  document.getElementById('add-to-plate').onclick = (e) => addToPlate(item, e);
}

function closeDish() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

function addToPlate(item, ev) {
  state.plate.push(item);
  renderPlate();
  animatePlateDrop(item.photo, ev);
  closeDish();
}

function renderPlate() {
  plateList.innerHTML = '';
  if (!state.plate.length) {
    plateEmpty.classList.remove('hidden');
    plateSummary.classList.add('hidden');
    plateCount.classList.add('hidden');
    return;
  }

  plateEmpty.classList.add('hidden');
  plateSummary.classList.remove('hidden');
  plateCount.classList.remove('hidden');
  plateCount.textContent = state.plate.length;

  state.plate.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'plate-item';
    row.innerHTML = `
      <div>
        <div class="plate-item-name">${item.name}</div>
        ${typeof item.kcal === 'number' ? `<div class="plate-item-sub">${Math.round(item.kcal)} ккал</div>` : ''}
      </div>
      <button class="plate-remove" data-index="${index}">Удалить</button>
    `;
    row.querySelector('.plate-remove').onclick = () => {
      state.plate.splice(index, 1);
      renderPlate();
    };
    plateList.appendChild(row);
  });

  const totals = state.plate.reduce((acc, item) => {
    acc.kcal += item.kcal || 0;
    acc.p += item.p || 0;
    acc.f += item.f || 0;
    acc.c += item.c || 0;
    return acc;
  }, {kcal:0,p:0,f:0,c:0});

  document.getElementById('summary-kcal').textContent = `${Math.round(totals.kcal)} ккал`;
  document.getElementById('summary-macros').textContent = `Б ${fmt(totals.p)} · Ж ${fmt(totals.f)} · У ${fmt(totals.c)}`;
}

function animatePlateDrop(photo, ev) {
  if (!photo) return;
  const fly = document.getElementById('plate-fly');
  fly.innerHTML = `<img src="images/${photo}" alt="">`;
  fly.classList.remove('hidden');

  const startX = ev?.clientX || window.innerWidth / 2;
  const startY = ev?.clientY || window.innerHeight / 2;
  const targetBtn = document.querySelector('[data-view="plate"]');
  const targetRect = targetBtn.getBoundingClientRect();
  const endX = targetRect.left + targetRect.width/2 - 36;
  const endY = targetRect.top - 10;

  fly.animate([
    { transform:`translate(${startX-36}px, ${startY-36}px) scale(1)`, opacity:1 },
    { transform:`translate(${endX}px, ${endY}px) scale(.35)`, opacity:.9 }
  ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });

  setTimeout(() => {
    fly.classList.add('hidden');
    targetBtn.animate([
      { transform:'scale(1)' },
      { transform:'scale(1.08)' },
      { transform:'scale(1)' }
    ], { duration: 220, easing: 'ease-out' });
  }, 420);
}

function slug(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-а-яё]/gi,'');
}
function fmt(n) {
  return Math.round(n * 10) / 10;
}

function switchView(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => switchView(btn.dataset.view);
});

document.getElementById('modal-close').onclick = closeDish;
modal.addEventListener('click', (e) => { if (e.target.dataset.close) closeDish(); });
document.getElementById('clear-plate').onclick = () => { state.plate = []; renderPlate(); };

const observer = new IntersectionObserver((entries) => {
  const visible = entries
    .filter(e => e.isIntersecting)
    .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const cat = visible.target.dataset.category;
  if (cat && state.currentCategory !== cat) {
    state.currentCategory = cat;
    updateActiveCategory();
  }
}, { rootMargin: '-35% 0px -55% 0px', threshold: [0.1, 0.3, 0.6] });

function updateActiveCategory() {
  document.querySelectorAll('.category-chip').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === state.currentCategory);
  });
}

function attachSectionObservers() {
  document.querySelectorAll('.menu-section').forEach(section => {
    section.dataset.category = section.querySelector('.menu-section-title').textContent;
    observer.observe(section);
  });
}

renderCategoryNav();
renderMenu();
renderPlate();
attachSectionObservers();
