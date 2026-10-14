const { Bot, Keyboard, InlineKeyboard, webhookCallback } = require("grammy");
const OpenAI = require("openai");
const pptxgen = require("pptxgenjs");
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require("docx");
const fs = require("fs");
const express = require("express");

// Token va API Kalit
const BOT_TOKEN = "8996760204:AAGYPitgLKDcig3YCCq-R4D7VK94drwLdi8"; 
const OPENAI_API_KEY = "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";

const bot = new Bot(BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const app = express();

app.use(express.json());

// Webhook marshruti
app.use("/webhook", webhookCallback(bot, "express"));

app.get("/", (req, res) => {
  res.send("USAT Premium Academic AI Bot — Active!");
});

const userNodes = {};

// 📱 Asosiy Doimiy Menyu (Reply Keyboard)
const mainKeyboard = new Keyboard()
  .text("🚀 Akademik AI (Slayd va Hujjat)").row()
  .text("💻 IT & Dasturlash").text("📚 Oliy Fanlar").row()
  .text("🗂 Fayl Konverter").text("📂 Mening Fayllarim").row()
  .text("💎 Balans & Referal").text("ℹ️ Yordam & Sozlamalar")
  .resized();

// /start buyrug'i
bot.command("start", async (ctx) => {
  const welcomeText = `✨ **USAT PREMIUM ACADEMIC AI PLATFORMASIGA XUSH KELIBSIZ!**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🎓 Siz bu bot orqali akademik topshiriqlar, slaydlar, referat va IT dasturlash bo'yicha sun'iy intellekt yordamini olishingiz mumkin.\n\n` +
    `👇 **Kerakli bo'limni pastdagi menyudan tanlang:**`;

  await ctx.reply(welcomeText, {
    parse_mode: "Markdown",
    reply_markup: mainKeyboard
  });
});

// 🚀 Akademik AI Bo'limi
bot.hears("🚀 Akademik AI (Slayd va Hujjat)", async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("📊 Slayd / Taqdimot (.pptx)", "node_pptx").row()
    .text("📄 Referat Tayyorlash (.docx)", "node_referat").row()
    .text("📘 Kurs Ishi (.docx)", "node_kursishi").row()
    .text("🎓 BMI / Bitiruv Ishi", "node_bmi").row()
    .text("✍️ Akademik Insho / Essay", "node_essay");

  const msg = `✨ **AKADEMIK HUJJAT YARATISH BO'LIMI**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Qaysi turdagi akademik hujjatni tayyorlamoqchisiz?\n` +
    `Kerakli formatni tanlang 👇`;

  await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: inlineMenu });
});

// 💻 IT va Dasturlash
bot.hears("💻 IT & Dasturlash", async (ctx) => {
  userNodes[ctx.from.id] = "dasturlash";
  const msg = `💻 **IT VA DASTURLASH YORDAMCHISI FAOL!**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Manga istalgan dasturlash tili (Python, C++, JavaScript va b.) bo'yicha kodingizni yuboring yoki algoritmlar bo'yicha savolingizni yozing:`;

  await ctx.reply(msg, { parse_mode: "Markdown" });
});

// 📚 Oliy Fanlar
bot.hears("📚 Oliy Fanlar", async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("🏛 Oliy Matematika", "node_matematika")
    .text("📊 Iqtisodiyot & Moliya", "node_iqtisodiyot").row()
    .text("⚖️ Huquqshunoslik", "node_huquq")
    .text("🌐 Ingliz Tili Akademik", "node_ingliz");

  const msg = `📚 **OLIY FANLAR BO'YICHA PROFESSOR AI**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Qaysi fan bo'yicha chuqur tahlil va yordam kerak? 👇`;

  await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: inlineMenu });
});

// 🗂 Fayl Konverter
bot.hears("🗂 Fayl Konverter", async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("📄 Word / PPT -> PDF", "conv_pdf").row()
    .text("🖼 Rasmlarni PDF ga aylantirish", "conv_imgpdf").row()
    .text("📦 Fayllarni ZIP qilish", "conv_zip");

  const msg = `🗂 **UNIVERSAL FAYL KONVERTER**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Fayllaringizni tez va sifatli qayta ishlash uchun xizmatni tanlang 👇`;

  await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: inlineMenu });
});

// 💎 Balans & Referal
bot.hears("💎 Balans & Referal", async (ctx) => {
  const msg = `💎 **SIZNING SHAXSIY BALANSINGIZ**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 **Foydalanuvchi:** ${ctx.from.first_name}\n` +
    `💳 **Hisobingiz:** Unlimited (USAT Talabasi)\n` +
    `🎁 **Aktiv referallaringiz:** 0 ta\n\n` +
    `🔗 **Sizning taklif havolangiz:**\n` +
    `\`https://t.me/USAT_Acade_mic_AI_bot?start=${ctx.from.id}\``;

  await ctx.reply(msg, { parse_mode: "Markdown" });
});

// 📂 Mening Fayllarim
bot.hears("📂 Mening Fayllarim", async (ctx) => {
  await ctx.reply("📁 **Sizning saqlangan fayllaringiz ro'yxati bo'sh.**", { parse_mode: "Markdown" });
});

// ℹ️ Yordam
bot.hears("ℹ️ Yordam & Sozlamalar", async (ctx) => {
  const msg = `ℹ️ **USAT AI YORDAM MARKAZI**\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Ushbu bot USAT universiteti talabalari uchun akademik va amaliy yordam berish uchun yaratilgan.\n\n` +
    `⚙️ **Sozlama:** Til — O'zbek tili (Lotin)\n` +
    `👨‍💻 **Dasturchi va Qo'llab-quvvatlash:** @USAT_Support`;

  await ctx.reply(msg, { parse_mode: "Markdown" });
});

// Inline Tugmalar uchun Ishlovchi
bot.callbackQuery(/^node_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("node_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();

  await ctx.reply(`✅ Tanlandi: **${mode.toUpperCase()}**\n\n✍️ Endi ushbu mavzu yoki topshiriq bo'yicha batafsil ma'lumot/savol yuboring:`, {
    parse_mode: "Markdown"
  });
});

bot.callbackQuery(/^conv_/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("📥 **Faylingizni yuboring:**", { parse_mode: "Markdown" });
});

// Matnlarni AI orqali tahlil qilish va Hujjat Yaratish
bot.on("message:text", async (ctx) => {
  const mode = userNodes[ctx.from.id] || "referat";
  const promptText = ctx.message.text;

  // Menyu tugmalari bo'lsa AI ga yubormaslik
  const systemButtons = [
    "🚀 Akademik AI (Slayd va Hujjat)", "💻 IT & Dasturlash", "📚 Oliy Fanlar",
    "🗂 Fayl Konverter", "📂 Mening Fayllarim", "💎 Balans & Referal", "ℹ️ Yordam & Sozlamalar"
  ];
  if (systemButtons.includes(promptText)) return;

  await ctx.reply("⏳ **USAT AI akademik ma'lumotlarni tahlil qilmoqda va hujjatni tayyorlamoqda...**", { parse_mode: "Markdown" });

  try {
    let systemInstruction = "Siz USAT universitetining yuqori darajali akademik sun'iy intellektisiz.";

    if (mode === "dasturlash") {
      systemInstruction = "Siz Senior IT Dasturchisiz. Kodingizni toza, xatosiz va tushuntirishlar bilan taqdim eting.";
    } else if (mode === "matematika") {
      systemInstruction = "Siz Oliy Matematika professorisiz. Formula va yechimlarni bosqichma-bosqich ko'rsating.";
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ],
      model: "gpt-4o-mini",
    });

    const resultText = completion.choices[0]?.message?.content || "Javob olinmadi.";

    // Slayd (.pptx)
    if (mode === "pptx") {
      const filePath = `./USAT_${ctx.from.id}.pptx`;
      let pptx = new pptxgen();
      let slides = resultText.split("Slayd:");

      slides.forEach((content) => {
        if (content.trim()) {
          let slide = pptx.addSlide();
          let lines = content.trim().split("\n");
          slide.addText(lines[0], { x: 0.5, y: 0.5, w: "90%", fontSize: 20, bold: true, color: "003366" });
          slide.addText(lines.slice(1).join("\n"), { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 13 });
        }
      });

      await pptx.writeFile({ fileName: filePath });
      await ctx.replyWithDocument({ source: filePath }, { caption: "📊 **USAT AI tomonidan tayyorlangan slayd!**" });
      fs.unlinkSync(filePath);
    } 
    // Word (.docx) Hujjatlar
    else if (["referat", "kursishi", "essay", "bmi"].includes(mode)) {
      const filePath = `./USAT_${mode.toUpperCase()}_${ctx.from.id}.docx`;
      let doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: promptText.toUpperCase(), heading: HeadingLevel.TITLE }),
            new Paragraph({ children: [new TextRun({ text: resultText, size: 24 })] })
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);

      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 **Tayyor Akademik Hujjat (${mode.toUpperCase()})**` });
      fs.unlinkSync(filePath);
    } else {
      await ctx.reply(resultText, { parse_mode: "Markdown" });
    }

  } catch (error) {
    console.error("Xatolik:", error);
    await ctx.reply("❌ **Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.**");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  if (renderUrl) {
    try {
      await bot.api.setWebhook(`${renderUrl}/webhook`);
      console.log(`Webhook set to: ${renderUrl}/webhook`);
    } catch (err) {
      console.error("Webhook error:", err);
    }
  }
});
