require("dotenv").config({ path: "../.env" });

// Server
const express = require("express");
const app = express();
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
// Server

const { HtmlTelegramBot, userInfoToString } = require("./bot");
const ChatGptService = require("./gpt");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GPT_TOKEN = process.env.GPT_TOKEN;

class MyTelegramBot extends HtmlTelegramBot {
  constructor(token) {
    super(token);
    this.mode = null;
    this.list = [];
    this.user = {};
    this.count = 0;
  }

  async start() {
    this.mode = "main";
    const text = this.loadMessage("main");
    await this.sendImage("main");
    await this.sendText(text);

    //   Add menu
    await this.showMainMenu({
      "/start": "главное меню бота",
      "/profile": "генерация Tinder-профиля 😎",
      "/opener": "сообщение для знакомства 🥰",
      "/message": "переписка от вашего имени 😈",
      "/date": "переписка со звездами 🔥",
      "/gpt": "задать вопрос чату GPT 🧠",
      "/html": "Демо HTML",
    });
  }

  async html() {
    await this.sendHTML('<h3 style="color: #1558b0;"> Привет! </h3>');
    const html = this.loadHtml("main");
    await this.sendHTML(html, { theme: "dark" });
  }

  async gpt() {
    this.mode = "gpt";
    const text = this.loadMessage("gpt");
    await this.sendImage("gpt");
    await this.sendText(text);
  }

  async gptDialog(msg) {
    const text = msg.text;
    const myMessage = await this.sendText("Думает над ответом...");
    const answer = await chatgpt.sendQuestion("Ответь на вопрос:", text);
    await this.editText(myMessage, answer);
  }

  async date() {
    this.mode = "date";
    const text = this.loadMessage("date");
    await this.sendImage("date");
    await this.sendTextButtons(text, {
      date_grande: "Ариана Гранде",
      date_robbie: "Марго Робби",
      date_zendaya: "Зендея",
      date_gosling: "Райан Гослинг",
      date_hardy: "Том Харди",
    });
  }

  async dateButton(callbackQuery) {
    const query = callbackQuery.data;
    await this.sendImage(query);
    await this.sendText("Отличный выбор! Пригласи девушку/парня на свидание за 5 сообщений:");
    const prompt = this.loadPrompt(query);
    chatgpt.setPrompt(prompt);
  }

  async dateDialog(msg) {
    const text = msg.text;
    const myMessage = await this.sendText("Печатает...");
    const answer = await chatgpt.addMessage(text);
    // await this.sendText(answer);
    await this.editText(myMessage, answer);
  }

  async message() {
    this.mode = "message";
    this.list = [];
    const text = this.loadMessage("message");
    await this.sendImage("message");
    await this.sendTextButtons(text, {
      message_next: "Следующее сообщение",
      message_date: "Пригласить на свидание",
    });
  }

  async messageButton(callbackQuery) {
    const query = callbackQuery.data;
    const prompt = this.loadPrompt(query);
    const userChatHistory = this.list.join("\n\n");
    const myMessage = await this.sendText("Думает над ответом...");
    const answer = await chatgpt.sendQuestion(prompt, userChatHistory);
    await this.editText(myMessage, answer);
  }

  async messageDialog(msg) {
    const text = msg.text;
    this.list.push(text);
  }

  async profile() {
    this.mode = "profile";
    const text = this.loadMessage("profile");
    await this.sendImage("profile");
    await this.sendText(text);

    this.user = {};
    this.count = 0;
    await this.sendText("1. Сколько вам лет?");
  }

  async profileDialog(msg) {
    const text = msg.text;
    this.count += 1;

    if (this.count === 1) {
      this.user["age"] = text;
      await this.sendText("2. Кем вы работаете?");
    }

    if (this.count === 2) {
      this.user["occupation"] = text;
      await this.sendText("3. У вас есть хобби?");
    }

    if (this.count === 3) {
      this.user["hobby"] = text;
      await this.sendText("4. Что вам НЕ нравится в людях?");
    }

    if (this.count === 4) {
      this.user["annoys"] = text;
      await this.sendText("5. Какие цели вашего знакомства?");
    }

    if (this.count === 5) {
      this.user["goals"] = text;

      const prompt = this.loadPrompt("profile");
      const info = userInfoToString(this.user);

      const myMessage = await this.sendText("Генерирую ваш профиль...");
      const answer = await chatgpt.sendQuestion(prompt, info);
      await this.editText(myMessage, answer);
    }
  }

  async opener() {
    this.mode = "opener";
    const text = this.loadMessage("opener");
    await this.sendImage("opener");
    await this.sendText(text);

    this.user = {};
    this.count = 0;
    await this.sendText("1. Имя девушки?");
  }

  async openerDialog(msg) {
    const text = msg.text;
    this.count += 1;

    if (this.count === 1) {
      this.user["name"] = text;
      await this.sendText("2. Сколько ей лет?");
    }

    if (this.count === 2) {
      this.user["age"] = text;
      await this.sendText("3. Оцените её внешность по шкале от 1 до 10.");
    }

    if (this.count === 3) {
      this.user["handsome"] = text;
      await this.sendText("4. Кем она работает?");
    }

    if (this.count === 4) {
      this.user["occupation"] = text;
      await this.sendText("5. Цель знакомства?");
    }

    if (this.count === 5) {
      this.user["goals"] = text;

      const prompt = this.loadPrompt("opener");
      const info = userInfoToString(this.user);

      const myMessage = await this.sendText("Генерирую ваш opener...");
      const answer = await chatgpt.sendQuestion(prompt, info);
      await this.editText(myMessage, answer);
    }
  }

  async hello(msg) {
    if (this.mode === "gpt") await this.gptDialog(msg);
    else if (this.mode === "date") await this.dateDialog(msg);
    else if (this.mode === "message") await this.messageDialog(msg);
    else if (this.mode === "profile") await this.profileDialog(msg);
    else if (this.mode === "opener") await this.openerDialog(msg);
    else {
      const text = msg.text;
      await this.sendText(`<b>Привет!</b>`);
      await this.sendText("<i>Как дела?</i>");
      await this.sendText(`Вы писали: ${text}`);
      await this.sendImage("avatar_main");
      await this.sendTextButtons("Какая у вас тема в Telegram?", {
        theme_light: "Светлая",
        theme_dark: "Тёмная",
      });
    }
  }

  async helloButton(callbackQuery) {
    const query = callbackQuery.data;

    if (query === "theme_light") {
      await this.sendText(`Ваша тема Светлая`);
    } else if (query === "theme_dark") {
      await this.sendText(`Ваша тема Тёмная`);
    }
  }
}

const chatgpt = new ChatGptService(GPT_TOKEN);
const bot = new MyTelegramBot(TELEGRAM_BOT_TOKEN);

bot.onCommand(/\/start/, bot.start); //  Command  /start
bot.onCommand(/\/html/, bot.html); //  Command  /html
bot.onCommand(/\/gpt/, bot.gpt); //  Command  /gpt
bot.onCommand(/\/date/, bot.date); //  Command  /date
bot.onCommand(/\/message/, bot.message); //  Command  /message
bot.onCommand(/\/profile/, bot.profile); //  Command  /profile
bot.onCommand(/\/opener/, bot.opener); //  Command  /opener

bot.onTextMessage(bot.hello);
bot.onButtonCallback(/^date_.*/, bot.dateButton); // any string started with date_
bot.onButtonCallback(/^message_.*/, bot.messageButton); // any string started with message_
bot.onButtonCallback(/^.*/, bot.helloButton); // any string
