const API_URL = 'http://localhost:3000/api';

let currentUser = { id: 1, name: 'Мила Шео', email: 'emiliashushu@yandex.ru', avatar: '', articlesCount: 3, countriesCount: 3, subscribers: 17 };
let allArticles = [];
let allUsers = [];
let favoritesSet = new Set();
let subscriptionsSet = new Set();
let articleBlocks = [];
let currentPage = 'home';
let previousPage = 'home';
let currentEditingArticleId = null;

function saveToLocalStorage() {
    localStorage.setItem('itinerarium_users', JSON.stringify(allUsers));
    localStorage.setItem('itinerarium_articles', JSON.stringify(allArticles));
    localStorage.setItem('itinerarium_favorites', JSON.stringify([...favoritesSet]));
    localStorage.setItem('itinerarium_subscriptions', JSON.stringify([...subscriptionsSet]));
    localStorage.setItem('itinerarium_currentUser', JSON.stringify({ 
        name: currentUser.name, 
        avatar: currentUser.avatar 
    }));
}

function loadFromLocalStorage() {
    const savedUsers = localStorage.getItem('itinerarium_users');
    const savedArticles = localStorage.getItem('itinerarium_articles');
    const savedFavorites = localStorage.getItem('itinerarium_favorites');
    const savedSubscriptions = localStorage.getItem('itinerarium_subscriptions');
    
    if (savedUsers) allUsers = JSON.parse(savedUsers);
    if (savedArticles) allArticles = JSON.parse(savedArticles);
    if (savedFavorites) favoritesSet = new Set(JSON.parse(savedFavorites));
    if (savedSubscriptions) subscriptionsSet = new Set(JSON.parse(savedSubscriptions));
    
    const savedCurrentUser = localStorage.getItem('itinerarium_currentUser');
    if (savedCurrentUser) {
        const saved = JSON.parse(savedCurrentUser);
        currentUser.name = saved.name;
        currentUser.avatar = saved.avatar;
    }
}

function showSplash() {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        const app = document.getElementById('app');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            app.classList.remove('hidden');
        }, 600);
    }, 2000);
}

async function loadData() {
    loadFromLocalStorage();
    
    if (allUsers.length === 0) {
        try {
            const [articlesRes, usersRes] = await Promise.all([
                fetch(`${API_URL}/articles`),
                fetch(`${API_URL}/users`)
            ]);
            allArticles = await articlesRes.json();
            allUsers = await usersRes.json();
        } catch (error) {
            console.error('Error loading from server:', error);
        }
    }
    
    const currentUserData = allUsers.find(u => u.id == currentUser.id);
    if (currentUserData) {
        currentUser.articlesCount = currentUserData.articlesCount;
        currentUser.countriesCount = currentUserData.countriesCount;
        currentUser.subscribers = currentUserData.subscribers;
        if (!currentUser.avatar && currentUserData.avatar) currentUser.avatar = currentUserData.avatar;
    }
    
    saveToLocalStorage();
    
    if (currentPage === 'home') renderHome();
    else if (currentPage === 'profile') renderProfile();
    else if (currentPage === 'subscriptions') renderSubscriptions();
    else if (currentPage === 'viewProfile') renderViewProfile();
}

function renderHome() {
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('article-page').classList.add('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    document.getElementById('subscriptions-section').classList.add('hidden');
    document.getElementById('view-profile-section').classList.add('hidden');
    document.getElementById('page-title').classList.remove('hidden');
    document.getElementById('page-title').innerHTML = 'Подобрали статьи, которые могут вам понравиться';
    
    const grid = document.getElementById('articles-grid');
    grid.innerHTML = allArticles.map(article => {
        const author = allUsers.find(u => u.id == article.authorId);
        const avatarHtml = author && author.avatar ? `<img src="${author.avatar}">` : `<span>👤</span>`;
        return `
        <div class="article-card" onclick="openArticle(${article.id})">
            <div class="article-top">
                <div class="article-author-avatar">${avatarHtml}</div>
                <div class="article-title">${escapeHtml(article.title)}</div>
            </div>
            <div class="article-bottom">
                <div class="article-bottom-left">
                    <div class="article-author-name">${escapeHtml(article.authorName)}</div>
                    <div class="article-country">${escapeHtml(article.country)}</div>
                    <div class="article-price">до ${article.price.toLocaleString()} ₽</div>
                </div>
                <button class="fav-btn ${favoritesSet.has(article.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${article.id})">♡</button>
            </div>
        </div>
    `}).join('');
    setActiveNav('nav-home');
}

function renderSearchResults(filteredArticles) {
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('article-page').classList.add('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    document.getElementById('subscriptions-section').classList.add('hidden');
    document.getElementById('view-profile-section').classList.add('hidden');
    document.getElementById('page-title').classList.remove('hidden');
    document.getElementById('page-title').innerHTML = 'Вот что мы нашли';
    
    const grid = document.getElementById('articles-grid');
    grid.innerHTML = filteredArticles.map(article => {
        const author = allUsers.find(u => u.id == article.authorId);
        const avatarHtml = author && author.avatar ? `<img src="${author.avatar}">` : `<span>👤</span>`;
        return `
        <div class="article-card" onclick="openArticle(${article.id})">
            <div class="article-top">
                <div class="article-author-avatar">${avatarHtml}</div>
                <div class="article-title">${escapeHtml(article.title)}</div>
            </div>
            <div class="article-bottom">
                <div class="article-bottom-left">
                    <div class="article-author-name">${escapeHtml(article.authorName)}</div>
                    <div class="article-country">${escapeHtml(article.country)}</div>
                    <div class="article-price">до ${article.price.toLocaleString()} ₽</div>
                </div>
                <button class="fav-btn ${favoritesSet.has(article.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${article.id})">♡</button>
            </div>
        </div>
    `}).join('');
    setActiveNav('nav-search');
}

async function toggleFavorite(articleId) {
    if (favoritesSet.has(articleId)) {
        favoritesSet.delete(articleId);
    } else {
        favoritesSet.add(articleId);
    }
    saveToLocalStorage();
    loadData();
}

async function toggleSubscribe(authorId) {
    if (authorId == currentUser.id) {
        alert('Нельзя подписаться на себя');
        return;
    }
    if (subscriptionsSet.has(authorId)) {
        subscriptionsSet.delete(authorId);
    } else {
        subscriptionsSet.add(authorId);
    }
    saveToLocalStorage();
    loadData();
}

function openArticle(id) {
    const article = allArticles.find(a => a.id == id);
    if (!article) return;
    
    previousPage = currentPage;
    currentPage = 'article';
    window.lastArticleId = id;
    currentEditingArticleId = id;
    
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('article-page').classList.remove('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    document.getElementById('subscriptions-section').classList.add('hidden');
    document.getElementById('view-profile-section').classList.add('hidden');
    document.getElementById('page-title').classList.add('hidden');
    
    const author = allUsers.find(u => u.id == article.authorId);
    const authorAvatarHtml = author && author.avatar ? `<img src="${author.avatar}">` : `<span>👤</span>`;
    
    document.getElementById('single-article-content').innerHTML = `
        <div class="single-article-card">
            <div class="single-article-top">
                <div class="single-article-left">
                    <div class="single-article-avatar" onclick="openViewProfile(${author.id})">${authorAvatarHtml}</div>
                    <div class="single-article-title">${escapeHtml(article.title)}</div>
                </div>
            </div>
            <div class="single-article-country">${escapeHtml(article.country)}</div>
            <div class="single-article-price">до ${article.price.toLocaleString()} ₽</div>
            <div class="single-article-content">${escapeHtml(article.content)}</div>
            <div class="single-article-author" onclick="openViewProfile(${author.id})">
                <div class="single-author-avatar">${authorAvatarHtml}</div>
                <div class="single-author-name">${escapeHtml(author.name)}</div>
            </div>
        </div>
    `;
    
    const editPanel = document.getElementById('edit-article-panel');
    if (article.authorId == currentUser.id) {
        editPanel.classList.remove('hidden');
    } else {
        editPanel.classList.add('hidden');
    }
    document.getElementById('edit-article-form').classList.add('hidden');
    document.getElementById('edit-article-btn').classList.remove('hidden');
}

function openViewProfile(userId) {
    window.viewProfileUserId = userId;
    previousPage = currentPage;
    currentPage = 'viewProfile';
    renderViewProfile();
}

function renderViewProfile() {
    const userId = window.viewProfileUserId;
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;
    
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('article-page').classList.add('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    document.getElementById('subscriptions-section').classList.add('hidden');
    document.getElementById('view-profile-section').classList.remove('hidden');
    document.getElementById('page-title').classList.add('hidden');
    
    const avatarHtml = user && user.avatar ? `<img src="${user.avatar}">` : `<span>👤</span>`;
    const avatarContainer = document.getElementById('view-profile-avatar');
    avatarContainer.innerHTML = avatarHtml;
    document.getElementById('view-profile-name').innerText = user.name;
    document.getElementById('view-stat-articles').innerText = user.articlesCount;
    document.getElementById('view-stat-countries').innerText = user.countriesCount;
    document.getElementById('view-stat-subs').innerText = user.subscribers;
    
    const userArticles = allArticles.filter(a => a.authorId == userId);
    const container = document.getElementById('view-articles-list');
    container.innerHTML = userArticles.map(article => {
        const author = allUsers.find(u => u.id == article.authorId);
        const avatarHtmlInner = author && author.avatar ? `<img src="${author.avatar}">` : `<span>👤</span>`;
        return `
        <div class="article-card" onclick="openArticle(${article.id})">
            <div class="article-top">
                <div class="article-author-avatar">${avatarHtmlInner}</div>
                <div class="article-title">${escapeHtml(article.title)}</div>
            </div>
            <div class="article-bottom">
                <div class="article-bottom-left">
                    <div class="article-author-name">${escapeHtml(article.authorName)}</div>
                    <div class="article-country">${escapeHtml(article.country)}</div>
                    <div class="article-price">до ${article.price.toLocaleString()} ₽</div>
                </div>
                <button class="fav-btn ${favoritesSet.has(article.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${article.id})">♡</button>
            </div>
        </div>
    `}).join('');
    if (userArticles.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Нет статей</div>';
    }
}

function renderProfile() {
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('article-page').classList.add('hidden');
    document.getElementById('profile-section').classList.remove('hidden');
    document.getElementById('subscriptions-section').classList.add('hidden');
    document.getElementById('view-profile-section').classList.add('hidden');
    document.getElementById('page-title').classList.add('hidden');
    
    const avatarHtml = currentUser.avatar ? `<img src="${currentUser.avatar}">` : `<span>👤</span>`;
    document.getElementById('profile-avatar').innerHTML = avatarHtml;
    document.getElementById('profile-name').innerText = currentUser.name;
    document.getElementById('stat-articles').innerText = currentUser.articlesCount;
    document.getElementById('stat-countries').innerText = currentUser.countriesCount;
    document.getElementById('stat-subs').innerText = currentUser.subscribers;
    
    renderMyArticles();
    renderProfileStats();
    renderPhotoalbum();
    setActiveNav('nav-profile');
    
    const firstTab = document.querySelector('#profile-section .tab-btn');
    if (firstTab && !firstTab.classList.contains('active')) {
        document.querySelectorAll('#profile-section .tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#profile-section .tab-content').forEach(t => t.classList.remove('active'));
        firstTab.classList.add('active');
        const tabId = firstTab.dataset.tab;
        document.getElementById(tabId).classList.add('active');
    }
}

function renderMyArticles() {
    const myArticles = allArticles.filter(a => a.authorId == currentUser.id);
    const container = document.getElementById('my-articles-list');
    container.innerHTML = myArticles.map(article => {
        const author = allUsers.find(u => u.id == article.authorId);
        const avatarHtml = author && author.avatar ? `<img src="${author.avatar}">` : `<span>👤</span>`;
        return `
        <div class="article-card" onclick="openArticle(${article.id})">
            <div class="article-top">
                <div class="article-author-avatar">${avatarHtml}</div>
                <div class="article-title">${escapeHtml(article.title)}</div>
            </div>
            <div class="article-bottom">
                <div class="article-bottom-left">
                    <div class="article-author-name">${escapeHtml(article.authorName)}</div>
                    <div class="article-country">${escapeHtml(article.country)}</div>
                    <div class="article-price">до ${article.price.toLocaleString()} ₽</div>
                </div>
                <button class="fav-btn ${favoritesSet.has(article.id) ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${article.id})">♡</button>
            </div>
        </div>
    `}).join('');
    if (myArticles.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Нет статей</div>';
    }
}

function renderProfileStats() {
    const userArticles = allArticles.filter(a => a.authorId == currentUser.id);
    const totalLikes = userArticles.reduce((sum, a) => sum + a.likes, 0);
    const totalViews = userArticles.reduce((sum, a) => sum + a.views, 0);
    const maxValue = Math.max(totalLikes, totalViews, 100);
    
    document.getElementById('profile-views').innerText = totalViews;
    document.getElementById('profile-views-fill').style.width = `${(totalViews / maxValue) * 100}%`;
    document.getElementById('audience-count').innerText = currentUser.subscribers;
    document.getElementById('audience-fill').style.width = `${(currentUser.subscribers / 50) * 100}%`;
    document.getElementById('total-likes').innerText = totalLikes;
    document.getElementById('likes-fill').style.width = `${(totalLikes / maxValue) * 100}%`;
    document.getElementById('total-views').innerText = totalViews;
    document.getElementById('views-fill').style.width = `${(totalViews / maxValue) * 100}%`;
}

function renderPhotoalbum() {
    const userArticles = allArticles.filter(a => a.authorId == currentUser.id);
    const photosByCountry = {};
    userArticles.forEach(article => {
        if (article.photos && article.photos.length > 0) {
            if (!photosByCountry[article.country]) photosByCountry[article.country] = [];
            photosByCountry[article.country].push(...article.photos);
        }
    });
    const container = document.getElementById('photoalbum-grid');
    if (Object.keys(photosByCountry).length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Нет загруженных фото</div>';
        return;
    }
    container.innerHTML = Object.entries(photosByCountry).map(([country, photos]) => `
        <div class="photoalbum-category">
            <h4>${escapeHtml(country)}</h4>
            <div class="photos">
                ${photos.map(photo => `<img src="${photo}" alt="${country}">`).join('')}
            </div>
        </div>
    `).join('');
}

function renderSubscriptions() {
    currentPage = 'subscriptions';
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('article-page').classList.add('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    document.getElementById('subscriptions-section').classList.remove('hidden');
    document.getElementById('view-profile-section').classList.add('hidden');
    document.getElementById('page-title').classList.add('hidden');
    
    renderAllProfiles();
    renderFavorites();
    setActiveNav('nav-subs');
    
    const firstSubsTab = document.querySelector('#subscriptions-section .subs-tab-btn');
    if (firstSubsTab && !firstSubsTab.classList.contains('active')) {
        document.querySelectorAll('#subscriptions-section .subs-tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#subscriptions-section .subs-tab-content').forEach(t => t.classList.remove('active'));
        firstSubsTab.classList.add('active');
        const tabId = firstSubsTab.dataset.subsTab;
        document.getElementById(tabId + '-tab').classList.add('active');
    }
}

function renderAllProfiles() {
    const container = document.getElementById('all-profiles-list');
    const otherUsers = allUsers.filter(u => u.id != currentUser.id);
    container.innerHTML = otherUsers.map(user => {
        const avatarHtml = user && user.avatar ? `<img src="${user.avatar}">` : `<span>👤</span>`;
        return `
        <div class="profile-item">
            <div class="profile-item-info" onclick="openViewProfile(${user.id})">
                <div class="profile-item-avatar">${avatarHtml}</div>
                <div>
                    <strong>${escapeHtml(user.name)}</strong>
                    <div style="font-size: 12px; color: #6EBCF7;">${user.articlesCount} статей · ${user.subscribers} подписчиков</div>
                </div>
            </div>
            <button class="sub-unsub-btn ${subscriptionsSet.has(user.id) ? 'unsubscribe' : ''}" onclick="event.stopPropagation(); toggleSubscribe(${user.id})">
                ${subscriptionsSet.has(user.id) ? 'Отписаться' : 'Подписаться'}
            </button>
        </div>
    `}).join('');
}

function renderFavorites() {
    const favArticles = allArticles.filter(a => favoritesSet.has(a.id));
    const container = document.getElementById('favorites-grid');
    container.innerHTML = favArticles.map(article => {
        const author = allUsers.find(u => u.id == article.authorId);
        const avatarHtml = author && author.avatar ? `<img src="${author.avatar}">` : `<span>👤</span>`;
        return `
        <div class="article-card" onclick="openArticle(${article.id})">
            <div class="article-top">
                <div class="article-author-avatar">${avatarHtml}</div>
                <div class="article-title">${escapeHtml(article.title)}</div>
            </div>
            <div class="article-bottom">
                <div class="article-bottom-left">
                    <div class="article-author-name">${escapeHtml(article.authorName)}</div>
                    <div class="article-country">${escapeHtml(article.country)}</div>
                    <div class="article-price">до ${article.price.toLocaleString()} ₽</div>
                </div>
                <button class="fav-btn active" onclick="event.stopPropagation(); toggleFavorite(${article.id})">♡</button>
            </div>
        </div>
    `}).join('');
    if (favArticles.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Нет избранных статей</div>';
    }
}

function editArticle() {
    const article = allArticles.find(a => a.id == currentEditingArticleId);
    if (!article) return;
    
    document.getElementById('edit-title').value = article.title;
    document.getElementById('edit-country').value = article.country;
    document.getElementById('edit-price').value = article.price;
    document.getElementById('edit-content').value = article.content;
    document.getElementById('edit-article-form').classList.remove('hidden');
    document.getElementById('edit-article-btn').classList.add('hidden');
}

function saveArticleEdit() {
    const articleIndex = allArticles.findIndex(a => a.id == currentEditingArticleId);
    if (articleIndex === -1) return;
    
    allArticles[articleIndex] = {
        ...allArticles[articleIndex],
        title: document.getElementById('edit-title').value,
        country: document.getElementById('edit-country').value,
        price: parseInt(document.getElementById('edit-price').value),
        content: document.getElementById('edit-content').value
    };
    
    saveToLocalStorage();
    document.getElementById('edit-article-form').classList.add('hidden');
    document.getElementById('edit-article-btn').classList.remove('hidden');
    openArticle(currentEditingArticleId);
    loadData();
}

function cancelArticleEdit() {
    document.getElementById('edit-article-form').classList.add('hidden');
    document.getElementById('edit-article-btn').classList.remove('hidden');
}

let currentBlockCallback = null;

function showBlockModal(callback) {
    currentBlockCallback = callback;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

document.getElementById('modal-text-btn').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    if (currentBlockCallback) currentBlockCallback('text');
};
document.getElementById('modal-photo-btn').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    if (currentBlockCallback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('photo', file);
                const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
                const data = await res.json();
                currentBlockCallback('photo', data.url);
            }
        };
        input.click();
    }
};
document.getElementById('modal-map-btn').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    if (currentBlockCallback) {
        const coords = prompt('Введите координаты или адрес:');
        if (coords) currentBlockCallback('map', coords);
    }
};
document.getElementById('modal-close').onclick = () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    currentBlockCallback = null;
};

function addBlockToConstructor() {
    showBlockModal((type, value) => {
        const blockId = Date.now();
        articleBlocks.push({ id: blockId, type, value: value || '' });
        renderBlocksList();
    });
}

function renderBlocksList() {
    const container = document.getElementById('blocks-list');
    container.innerHTML = articleBlocks.map(block => `
        <div style="background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 8px;">
            <strong>${block.type === 'text' ? 'Текст' : block.type === 'photo' ? 'Фото' : 'Точка на карте'}</strong>
            ${block.type === 'text' ? `<div>${escapeHtml(block.value)}</div>` : block.type === 'photo' ? `<img src="${block.value}" style="max-width: 100px; border-radius: 8px;">` : `<div>${escapeHtml(block.value)}</div>`}
            <button onclick="removeBlock(${block.id})" style="margin-top: 5px; background: #ff6b6b; color: white; border: none; padding: 3px 8px; border-radius: 5px;">Удалить</button>
        </div>
    `).join('');
}

function removeBlock(id) {
    articleBlocks = articleBlocks.filter(b => b.id !== id);
    renderBlocksList();
}

async function publishArticle() {
    const title = document.getElementById('new-title').value;
    const priceTo = document.getElementById('new-price-to').value;
    const country = document.getElementById('new-country').value;
    const content = document.getElementById('new-content').value;
    
    if (!title || !country || !priceTo) {
        alert('Заполните заголовок, страну и цену');
        return;
    }
    
    const finalPrice = parseInt(priceTo);
    const blocksContent = articleBlocks.map(b => b.type === 'text' ? b.value : b.type === 'photo' ? `<img src="${b.value}">` : `<div>📍 ${b.value}</div>`).join('');
    const fullContent = content + (blocksContent ? '\n\n' + blocksContent : '');
    
    const newArticle = {
        id: Date.now(),
        title,
        country,
        price: finalPrice,
        content: fullContent,
        authorId: currentUser.id,
        authorName: currentUser.name,
        likes: 0,
        views: 0,
        createdAt: new Date().toISOString().split('T')[0],
        photos: articleBlocks.filter(b => b.type === 'photo').map(b => b.value)
    };
    
    allArticles.unshift(newArticle);
    currentUser.articlesCount = allArticles.filter(a => a.authorId == currentUser.id).length;
    const userCountries = [...new Set(allArticles.filter(a => a.authorId == currentUser.id).map(a => a.country))];
    currentUser.countriesCount = userCountries.length;
    
    const userIndex = allUsers.findIndex(u => u.id == currentUser.id);
    if (userIndex !== -1) {
        allUsers[userIndex].articlesCount = currentUser.articlesCount;
        allUsers[userIndex].countriesCount = currentUser.countriesCount;
    }
    
    saveToLocalStorage();
    
    document.getElementById('new-title').value = '';
    document.getElementById('new-price-from').value = '';
    document.getElementById('new-price-to').value = '';
    document.getElementById('new-country').value = '';
    document.getElementById('new-content').value = '';
    articleBlocks = [];
    renderBlocksList();
    loadData();
    alert('Статья опубликована!');
}

function searchAndFilter() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase();
    const countryFilter = document.getElementById('filter-country').value;
    const budgetFrom = parseInt(document.getElementById('budget-from').value) || 0;
    const budgetTo = parseInt(document.getElementById('budget-to').value) || Infinity;
    
    let filtered = allArticles;
    
    if (searchTerm) {
        filtered = filtered.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.country.toLowerCase().includes(searchTerm) ||
            article.authorName.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm)
        );
    }
    
    if (countryFilter) {
        filtered = filtered.filter(article => article.country === countryFilter);
    }
    
    if (budgetFrom > 0 || budgetTo < Infinity) {
        filtered = filtered.filter(article => article.price >= budgetFrom && article.price <= budgetTo);
    }
    
    renderSearchResults(filtered);
    document.getElementById('search-panel').classList.add('hidden');
}

function showHome() {
    currentPage = 'home';
    renderHome();
}

function showProfilePage() {
    currentPage = 'profile';
    renderProfile();
}

function showSubscriptionsPage() {
    currentPage = 'subscriptions';
    renderSubscriptions();
}

function goBack() {
    if (currentPage === 'article') {
        if (previousPage === 'home') showHome();
        else if (previousPage === 'profile') showProfilePage();
        else if (previousPage === 'subscriptions') showSubscriptionsPage();
        else if (previousPage === 'viewProfile') renderViewProfile();
        else showHome();
    } else if (currentPage === 'viewProfile') {
        if (previousPage === 'article') {
            const articleId = window.lastArticleId;
            if (articleId) openArticle(articleId);
            else showHome();
        } else if (previousPage === 'subscriptions') showSubscriptionsPage();
        else showHome();
    } else {
        showHome();
    }
}

function setActiveNav(activeId) {
    ['nav-home', 'nav-search', 'nav-subs', 'nav-profile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const activeEl = document.getElementById(activeId);
    if (activeEl) activeEl.classList.add('active');
}

function checkFilterActive() {
    const searchTerm = document.getElementById('global-search').value;
    const countryFilter = document.getElementById('filter-country').value;
    const budgetFrom = document.getElementById('budget-from').value;
    const budgetTo = document.getElementById('budget-to').value;
    const applyBtn = document.getElementById('apply-filter');
    
    const isActive = searchTerm !== '' || countryFilter !== '' || budgetFrom !== '' || budgetTo !== '';
    if (isActive) {
        applyBtn.classList.add('active');
    } else {
        applyBtn.classList.remove('active');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
}

document.getElementById('edit-profile-btn').onclick = () => {
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-modal').classList.remove('hidden');
};

document.getElementById('save-profile-btn').onclick = async () => {
    const newName = document.getElementById('edit-name').value;
    const avatarFile = document.getElementById('edit-avatar').files[0];
    
    if (newName) {
        currentUser.name = newName;
        const userIndex = allUsers.findIndex(u => u.id == currentUser.id);
        if (userIndex !== -1) allUsers[userIndex].name = newName;
    }
    
    if (avatarFile) {
        const formData = new FormData();
        formData.append('photo', avatarFile);
        const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        currentUser.avatar = data.url;
        const userIndex = allUsers.findIndex(u => u.id == currentUser.id);
        if (userIndex !== -1) allUsers[userIndex].avatar = data.url;
    }
    
    saveToLocalStorage();
    document.getElementById('edit-modal').classList.add('hidden');
    loadData();
};

document.getElementById('cancel-edit-modal-btn').onclick = () => {
    document.getElementById('edit-modal').classList.add('hidden');
};

document.addEventListener('DOMContentLoaded', () => {
    showSplash();
    loadData();
    
    document.getElementById('nav-home').onclick = showHome;
    document.getElementById('nav-profile').onclick = showProfilePage;
    document.getElementById('nav-subs').onclick = showSubscriptionsPage;
    document.getElementById('article-back-btn').onclick = goBack;
    document.getElementById('view-profile-back-btn').onclick = goBack;
    
    const searchLink = document.getElementById('nav-search');
    const searchPanel = document.getElementById('search-panel');
    const closeSearch = document.getElementById('close-search');
    const applyFilter = document.getElementById('apply-filter');
    
    searchLink.onclick = (e) => {
        e.preventDefault();
        searchPanel.classList.toggle('hidden');
        setActiveNav('nav-search');
    };
    closeSearch.onclick = () => searchPanel.classList.add('hidden');
    applyFilter.onclick = () => {
        if (applyFilter.classList.contains('active')) {
            searchAndFilter();
        }
    };
    
    const searchInputs = ['global-search', 'filter-country', 'budget-from', 'budget-to'];
    searchInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', checkFilterActive);
            el.addEventListener('change', checkFilterActive);
        }
    });
    
    document.getElementById('publish-article-btn').onclick = publishArticle;
    document.getElementById('add-block-btn').onclick = addBlockToConstructor;
    document.getElementById('edit-article-btn').onclick = editArticle;
    document.getElementById('save-article-btn').onclick = saveArticleEdit;
    document.getElementById('cancel-article-edit-btn').onclick = cancelArticleEdit;
    
    const profileTabs = document.querySelectorAll('#profile-section .tab-btn');
    profileTabs.forEach(tab => {
        tab.onclick = (e) => {
            e.preventDefault();
            const tabId = tab.dataset.tab;
            document.querySelectorAll('#profile-section .tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#profile-section .tab-content').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        };
    });
    
    const subsTabs = document.querySelectorAll('#subscriptions-section .subs-tab-btn');
    subsTabs.forEach(tab => {
        tab.onclick = (e) => {
            e.preventDefault();
            const tabId = tab.dataset.subsTab;
            document.querySelectorAll('#subscriptions-section .subs-tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#subscriptions-section .subs-tab-content').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tabId + '-tab').classList.add('active');
        };
    });
    
    window.openArticle = openArticle;
    window.toggleFavorite = toggleFavorite;
    window.toggleSubscribe = toggleSubscribe;
    window.openViewProfile = openViewProfile;
    window.removeBlock = removeBlock;
});