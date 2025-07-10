// Initialize the Telegram Web App
const tg = window.Telegram.WebApp;

// This tells Telegram that your app is ready to be shown
tg.ready();

// Get user info and display it
const userInfo = document.getElementById('user-info');
if (tg.initDataUnsafe.user) {
    userInfo.innerText = `Hello, ${tg.initDataUnsafe.user.first_name}!`;
} else {
    userInfo.innerText = 'Hello, mysterious user!';
}