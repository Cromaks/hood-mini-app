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

modal.classList.add('hidden');
modal.setAttribute('aria-hidden', 'true');

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

function slug(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-а-яё]/gi, '');
}

function fmt(n) {
  return Math.round(n * 10) / 10;
}

function getStickyOffset() {
  const masthead = document.querySelector('.masthead');
  const categoryNav = document.querySelector('.category-nav');
  const mastheadHeight = masthead ? masthead.offsetHeight : 0;
  const navHeight = categoryNav ? categoryNav.offsetHeight : 0;
  return mastheadHeight + navHeight + 12;
}

function scrollToCategory(category) {
  if (category === 'Все меню') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    return;
  }

  const target = document.getElementById('section-' + slug(category));
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - getStickyOffset();

  window.scrollTo({
    top,
    behavior: 'smooth'
  });
}

function renderCategoryNav() {
  nav.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-chip' + (state.currentCategory === cat ? ' active' : '');
    btn.textContent = cat;
    btn.type = 'button';

    btn.onclick = () => {
      state.currentCategory = cat;
      updateActiveCategory();
      lockCategoryObserver();
      scrollToCategory(cat);
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
    section.dataset.category = category;

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
        card.type = 'button';

        card.innerHTML = `
          <img class="food-image" src="images/${item.photo}" alt="${item.name}">
          <div class="food-meta">
            <div class="food-name">${item.name}</div>
            ${typeof item.kcal === 'number' ? `<div class="food-kcal">${Math.round(item.kcal)} ккал</div>` : ''}
            ${hasMacros(item) ? `<div class="food-macros">Б ${fmt(item.p)} · Ж ${fmt(item.f)} · У ${fmt(item.c)}</div>` : ''}
          </div>
        `;

        card.onclick = () => openDish(item);
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

        row.innerHTML = `
          <div>
            <div class="text-item-name">${item.name}</div>
            ${item.description ? `<div class="text-item-sub">${item.description}</div>` : ''}
          </div>
        `;

        row.onclick = () => openDish(item);
        list.appendChild(row);
      });

      section.appendChild(list);
    }

    sectionsWrap.appendChild(section);
  });
}

function openDish(item) {
  modalContent.innerHTML = `
    <div class="detail-wrap">
      ${item.photo ? `<img class="detail-image" src="images/${item.photo}" alt="${item.name}">` : ''}
      <div class="detail-name">${item.name}</div>
      ${item.description ? `<div class="detail-description">${item.description}</div>` : ''}
      ${typeof item.kcal === 'number' ? `<div class="detail-kcal">${Math.round(item.kcal)} ккал</div>` : ''}
      ${hasMacros(item) ? `<div class="detail-macros">Б ${fmt(item.p)} · Ж ${fmt(item.f)} · У ${fmt(item.c)}</div>` : ''}
      <button class="primary-button" id="add-to-plate" type="button">Добавить в тарелку</button>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  const addBtn = document.getElementById('add-to-plate');
  if (addBtn) {
    addBtn.onclick = (e) => addToPlate(item, e);
  }
}

function closeDish() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
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
    plateCount.textContent = '0';
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
      <button class="plate-remove" data-index="${index}" type="button">Удалить</button>
    `;

    const removeBtn = row.querySelector('.plate-remove');
    if (removeBtn) {
      removeBtn.onclick = () => {
        state.plate.splice(index, 1);
        renderPlate();
      };
    }

    plateList.appendChild(row);
  });

  const totals = state.plate.reduce((acc, item) => {
    acc.kcal += item.kcal || 0;
    acc.p += item.p || 0;
    acc.f += item.f || 0;
    acc.c += item.c || 0;
    return acc;
  }, { kcal: 0, p: 0, f: 0, c: 0 });

  const summaryKcal = document.getElementById('summary-kcal');
  const summaryMacros = document.getElementById('summary-macros');

  if (summaryKcal) {
    summaryKcal.textContent = `${Math.round(totals.kcal)} ккал`;
  }

  if (summaryMacros) {
    summaryMacros.textContent = `Б ${fmt(totals.p)} · Ж ${fmt(totals.f)} · У ${fmt(totals.c)}`;
  }
}

function animatePlateDrop(photo, ev) {
  if (!photo) return;

  const fly = document.getElementById('plate-fly');
  if (!fly) return;

  fly.innerHTML = `<img src="images/${photo}" alt="">`;
  fly.classList.remove('hidden');

  const startX = ev?.clientX || window.innerWidth / 2;
  const startY = ev?.clientY || window.innerHeight / 2;

  const targetBtn = document.querySelector('[data-view="plate"]');
  if (!targetBtn) return;

  const targetRect = targetBtn.getBoundingClientRect();

  const endX = targetRect.left + targetRect.width / 2 - 36;
  const endY = targetRect.top - 10;

  fly.animate(
    [
      { transform: `translate(${startX - 36}px, ${startY - 36}px) scale(1)`, opacity: 1 },
      { transform: `translate(${endX}px, ${endY}px) scale(.35)`, opacity: .9 }
    ],
    { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }
  );

  setTimeout(() => {
    fly.classList.add('hidden');

    targetBtn.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.08)' },
        { transform: 'scale(1)' }
      ],
      { duration: 220, easing: 'ease-out' }
    );
  }, 420);
}

function switchView(view) {
  state.currentView = view;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const activeView = document.getElementById(`view-${view}`);
  if (activeView) activeView.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
}

function updateActiveCategory() {
  document.querySelectorAll('.category-chip').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === state.currentCategory);
  });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => switchView(btn.dataset.view);
});

const modalClose = document.getElementById('modal-close');
if (modalClose) {
  modalClose.onclick = closeDish;
}

modal.addEventListener('click', (e) => {
  if (e.target.dataset.close) closeDish();
});

const clearPlateBtn = document.getElementById('clear-plate');
if (clearPlateBtn) {
  clearPlateBtn.onclick = () => {
    state.plate = [];
    plateList.innerHTML = '';
    plateEmpty.classList.remove('hidden');
    plateSummary.classList.add('hidden');
    plateCount.classList.add('hidden');
    plateCount.textContent = '0';

    const summaryKcal = document.getElementById('summary-kcal');
    const summaryMacros = document.getElementById('summary-macros');

    if (summaryKcal) {
      summaryKcal.textContent = '0 ккал';
    }

    if (summaryMacros) {
      summaryMacros.textContent = 'Б 0 · Ж 0 · У 0';
    }
  };
}

let isManualCategoryScroll = false;
let manualCategoryScrollTimer = null;

function lockCategoryObserver() {
  isManualCategoryScroll = true;
  clearTimeout(manualCategoryScrollTimer);
  manualCategoryScrollTimer = setTimeout(() => {
    isManualCategoryScroll = false;
  }, 700);
}

const observer = new IntersectionObserver((entries) => {
  if (isManualCategoryScroll) return;

  const visibleEntries = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (!visibleEntries.length) {
    if (window.scrollY < 120 && state.currentCategory !== 'Все меню') {
      state.currentCategory = 'Все меню';
      updateActiveCategory();
    }
    return;
  }

  const visible = visibleEntries[0];
  const cat = visible.target.dataset.category;

  if (cat && state.currentCategory !== cat) {
    state.currentCategory = cat;
    updateActiveCategory();
  }
}, {
  rootMargin: '-20% 0px -60% 0px',
  threshold: [0.12, 0.25, 0.45, 0.65]
});

function attachSectionObservers() {
  document.querySelectorAll('.menu-section').forEach(section => {
    observer.observe(section);
  });
}

window.addEventListener('scroll', () => {
  if (window.scrollY < 120 && !isManualCategoryScroll && state.currentCategory !== 'Все меню') {
    state.currentCategory = 'Все меню';
    updateActiveCategory();
  }
}, { passive: true });

renderCategoryNav();
renderMenu();
renderPlate();
attachSectionObservers();
updateActiveCategory();