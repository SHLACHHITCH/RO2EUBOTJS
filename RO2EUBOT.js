const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GameDig } = require('gamedig');
const keep_alive = require('./keep_alive.js');
const cron = require('node-cron');

// Создаем новый экземпляр клиента Discord с указанием намерений
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Токен вашего бота
const TOKEN = process.env.DISCORD_TOKEN;

// Функция для запроса информации о сервере игры
async function queryGameServer(game, address, port) {
    return GameDig.query({
        type: game,
        host: address,
        port: port,
    });
}

// Функция для обновления статуса бота с использованием метода setPresence
async function updateStatus() {
    const game = 'redorchestra2';
    const address = '31.186.250.228';
    const port = '7777';

    try {
        const gameInfo = await queryGameServer(game, address, port);
        if (gameInfo) {
            let mapName = gameInfo.map;
            if (mapName.startsWith('TE-')) {
                mapName = mapName.substring(3); // Удаляем "TE-" из начала названия карты
            }
            const numPlayers = gameInfo.numplayers;

            // Обновляем статус с использованием метода setPresence
            client.user.setPresence({
                activities: [{
                    name: `${mapName} with ${numPlayers} players`,
                    type: ActivityType.PLAYING
                }],
                status: 'online'
            });
        } else {
            // Если не удалось получить информацию о сервере игры, устанавливаем статус "Не удалось получить информацию"
            client.user.setPresence({
                activities: [{
                    name: 'Не удалось получить информацию',
                    type: ActivityType.PLAYING
                }],
                status: 'online'
            });
        }
    } catch (error) {
        console.error('Ошибка при запросе информации о сервере игры:', error);
        client.user.setPresence({
            activities: [{
                name: 'Ошибка при запросе информации о сервере игры',
                type: ActivityType.PLAYING
            }],
            status: 'online'
        });
    }
}

// Функция для отправки keep-alive запроса к серверу
async function sendKeepAliveRequest() {
    try {
        // Отправляем keep-alive запрос на ваш URL на Render
        await fetch('https://ro2eubotjs.onrender.com');
        console.log('Keep-alive request sent.');
    } catch (error) {
        console.error('Ошибка при отправке keep-alive запроса:', error);
    }
}

// Событие при успешном запуске бота
client.once('ready', () => {
    console.log('Бот запущен!');
    // Вызываем функцию обновления статуса
    updateStatus();
    // Обновляем статус каждые 1 минуту (60 000 миллисекунд)
    setInterval(updateStatus, 60000);

    // Запускаем cron job для отправки keep-alive запроса каждые 5 минут
    cron.schedule('*/5 * * * *', () => {
        sendKeepAliveRequest();
    });
});

// Запускаем бота
client.login(TOKEN);
