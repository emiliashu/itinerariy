const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

let users = [
    { id: 1, name: 'Мила Шео', email: 'emiliashushu@yandex.ru', avatar: '', articlesCount: 3, countriesCount: 3, subscribers: 17 },
    { id: 2, name: 'Анна Петрова', email: 'anna@travel.ru', avatar: '', articlesCount: 5, countriesCount: 7, subscribers: 42 },
    { id: 3, name: 'Дмитрий Иванов', email: 'dima@travel.ru', avatar: '', articlesCount: 2, countriesCount: 2, subscribers: 8 }
];

let articles = [
    { id: 1, title: 'Мое любимое место', country: 'Черногория', price: 90000, authorId: 1, authorName: 'Мила Шео', content: 'Невероятные пляжи Адриатики. Горы, море, вкусная еда. Обязательно посетите Котор и Будву.', likes: 12, views: 45, createdAt: '2026-06-01', photos: [] },
    { id: 2, title: 'Без ЭТОГО даже не думайте ехать в Китай', country: 'Китай', price: 200000, authorId: 1, authorName: 'Мила Шео', content: 'Виза, приложения, транспорт - все что нужно знать перед поездкой в Поднебесную.', likes: 8, views: 32, createdAt: '2026-06-02', photos: [] },
    { id: 3, title: 'Продвинутая статья про треккинг', country: 'Непал', price: 150000, authorId: 1, authorName: 'Мила Шео', content: 'Как подготовиться к треккингу в Гималаях. Снаряжение, маршруты, высотная болезнь.', likes: 5, views: 18, createdAt: '2026-06-03', photos: [] },
    { id: 4, title: 'Таиланд для начинающих', country: 'Таиланд', price: 120000, authorId: 2, authorName: 'Анна Петрова', content: 'Пхукет, Краби, Самуи - выбираем остров для идеального отдыха.', likes: 34, views: 120, createdAt: '2026-05-28', photos: [] },
    { id: 5, title: 'Грузия: вино и горы', country: 'Грузия', price: 80000, authorId: 2, authorName: 'Анна Петрова', content: 'Тбилиси, Казбек, винные погреба Кахетии.', likes: 23, views: 89, createdAt: '2026-05-25', photos: [] },
    { id: 6, title: 'Япония: что нужно знать', country: 'Япония', price: 300000, authorId: 3, authorName: 'Дмитрий Иванов', content: 'Токио, Киото, Осака - маршрут на 14 дней.', likes: 45, views: 210, createdAt: '2026-05-20', photos: [] },
    { id: 7, title: 'Италия для гурманов', country: 'Италия', price: 180000, authorId: 3, authorName: 'Дмитрий Иванов', content: 'Паста, пицца, вино и лучшие рестораны Рима и Флоренции.', likes: 31, views: 97, createdAt: '2026-05-18', photos: [] }
];

let favorites = [];
let subscriptions = [
    { id: 1, followerId: 1, followingId: 2 },
    { id: 2, followerId: 1, followingId: 3 }
];

app.get('/api/users', (req, res) => res.json(users));
app.get('/api/users/:id', (req, res) => {
    const user = users.find(u => u.id == req.params.id);
    user ? res.json(user) : res.status(404).json({ error: 'User not found' });
});

app.get('/api/articles', (req, res) => res.json(articles));
app.get('/api/articles/:id', (req, res) => {
    const article = articles.find(a => a.id == req.params.id);
    if (article) {
        article.views++;
        res.json(article);
    } else {
        res.status(404).json({ error: 'Article not found' });
    }
});

app.post('/api/articles', (req, res) => {
    const { title, country, price, content, authorId, authorName, photos } = req.body;
    if (!title || !country || !price) {
        return res.status(400).json({ error: 'Fill required fields' });
    }
    const newArticle = {
        id: Date.now(),
        title,
        country,
        price: parseInt(price),
        authorId,
        authorName,
        content: content || '',
        likes: 0,
        views: 0,
        createdAt: new Date().toISOString().split('T')[0],
        photos: photos || []
    };
    articles.unshift(newArticle);
    const user = users.find(u => u.id == authorId);
    if (user) {
        user.articlesCount = articles.filter(a => a.authorId == authorId).length;
        const userCountries = [...new Set(articles.filter(a => a.authorId == authorId).map(a => a.country))];
        user.countriesCount = userCountries.length;
    }
    res.status(201).json(newArticle);
});

app.post('/api/articles/:id/like', (req, res) => {
    const article = articles.find(a => a.id == req.params.id);
    if (article) {
        article.likes++;
        res.json({ likes: article.likes });
    } else {
        res.status(404).json({ error: 'Article not found' });
    }
});

app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (req.file) {
        res.json({ url: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).json({ error: 'No file' });
    }
});

app.get('/api/favorites/:userId', (req, res) => {
    const userFavs = favorites.filter(f => f.userId == req.params.userId);
    const favArticles = userFavs.map(fav => articles.find(a => a.id == fav.articleId)).filter(a => a);
    res.json(favArticles);
});

app.post('/api/favorites', (req, res) => {
    const exists = favorites.some(f => f.userId == req.body.userId && f.articleId == req.body.articleId);
    if (!exists) {
        favorites.push({ id: Date.now(), userId: req.body.userId, articleId: req.body.articleId });
    }
    res.status(201).json({ success: true });
});

app.delete('/api/favorites/:userId/:articleId', (req, res) => {
    favorites = favorites.filter(f => !(f.userId == req.params.userId && f.articleId == req.params.articleId));
    res.json({ success: true });
});

app.get('/api/subscriptions/:userId', (req, res) => {
    const userSubs = subscriptions.filter(s => s.followerId == req.params.userId);
    const followedUsers = userSubs.map(s => users.find(u => u.id == s.followingId)).filter(u => u);
    res.json(followedUsers);
});

app.post('/api/subscriptions', (req, res) => {
    const exists = subscriptions.some(s => s.followerId == req.body.followerId && s.followingId == req.body.followingId);
    if (!exists && req.body.followerId != req.body.followingId) {
        subscriptions.push({ id: Date.now(), followerId: req.body.followerId, followingId: req.body.followingId });
        const followedUser = users.find(u => u.id == req.body.followingId);
        if (followedUser) {
            followedUser.subscribers = subscriptions.filter(s => s.followingId == req.body.followingId).length;
        }
    }
    res.status(201).json({ success: true });
});

app.delete('/api/subscriptions/:followerId/:followingId', (req, res) => {
    subscriptions = subscriptions.filter(s => !(s.followerId == req.params.followerId && s.followingId == req.params.followingId));
    const followedUser = users.find(u => u.id == req.params.followingId);
    if (followedUser) {
        followedUser.subscribers = subscriptions.filter(s => s.followingId == req.params.followingId).length;
    }
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log('');
    console.log('=================================');
    console.log('        ИТИНЕРАРИЙ');
    console.log('=================================');
    console.log(`Сервер: http://localhost:${PORT}`);
    console.log('');
});