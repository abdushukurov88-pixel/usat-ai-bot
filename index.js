const { Bot, Keyboard, InlineKeyboard, webhookCallback } = require("grammy");
const OpenAI = require("openai");
const pptxgen = require("pptxgenjs");
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require("docx");
const fs = require("fs");
const express = require("express");

const BOT_TOKEN = "8996760204:AAGYPitgLKDcig3YCCq-R4D7VK94drwLdi8"; 
const OPENAI_API_KEY = "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";

const bot = new Bot(BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const app = express();

app.use(express.json());

// Webhook marshruti
app.use("/webhook", webhookCallback(bot, "express"));

app.get("/", (req, res) => {
  res.send("USAT Bot Active!");
});

const userNodes = {};

// Asosiy Reply Keyboard
const mainKeyboard = new Keyboard()
  .text("🚀 Akademik AI").row()
  .text("💻 IT & Dasturlash").text("📚 Oliy Fanlar").row()
  .text("🗂 Fayl Konverter").text("📂 Mening Fayllarim").row()
  .text("💎 Balans & Referal").text("ℹ️ Yordam")
  .resized();

// /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🎓 **USAT Akademik AI Platformasiga Xush Kelibsiz!**\n\nKerakli bo'limni tanlang 👇",
    { reply_markup: mainKeyboard }
  );
});

// Matnli buyruqlarni tutish (Regex orqali moslashtirilgan)
bot.hears(/Akademik AI/i, async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("📊 Slayd / Taqdimot (.pptx)", "node_pptx").row()
    .text("📄 Referat Tayyorlash (.docx)", "node_referat").row()
    .text("📘 Kurs Ishi (.docx)", "node_kursishi").row()
    .text("🎓 BMI / Bitiruv Ishi", "node_bmi").row()
    .text("✍️ Akademik Insho / Essay", "node_essay");

  await ctx.reply("Qaysi turdagi akademik hujjatni tayyorlamoqchisiz? 👇", { reply_markup: inlineMenu });
});

bot.hears(/IT & Dasturlash/i, async (ctx) => {
  userNodes[ctx.from.id] = "dasturlash";
  await ctx.reply("💻 **IT VA DASTURLASH YORDAMCHISI FAOL!**\n\nManga kodingizni yuboring yoki savolingizni yozing:");
});

bot.hears(/Oliy Fanlar/i, async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("🏛 Oliy Matematika", "node_matematika")
    .text("📊 Iqtisodiyot", "node_iqtisodiyot").row()
    .text("⚖️ Huquqshunoslik", "node_huquq")
    .text("🌐 Ingliz Tili", "node_ingliz");

  await ctx.reply("📚 Qaysi fan bo'yicha yordam kerak? 👇", { reply_markup: inlineMenu });
});

bot.hears(/Fayl Konverter/i, async (ctx) => {
  await ctx.reply("🗂 Fayllaringizni yuboring:");
});

bot.hears(/Balans & Referal/i, async (ctx) => {
  await ctx.reply(`💎 **Balansingiz:** Cheksiz (USAT Talabasi)\n🔗 **Referal link:** https://t.me/USAT_Acade_mic_AI_bot?start=${ctx.from.id}`);
});

bot.hears(/Mening Fayllarim/i, async (ctx) => {
  await ctx.reply("📂 Fayllaringiz ro'yxati bo'sh.");
});

bot.hears(/Yordam/i, async (ctx) => {
  await ctx.reply("ℹ️ **USAT AI Yordam:** Dasturchi bilan aloqa -> @USAT_Support");
});

// Inline Tugmalar
bot.callbackQuery(/^node_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("node_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ Tanlandi: **${mode.toUpperCase()}**\n\nEndi savol yoki topshiriq matnini yuboring:`);
});

// AI va Hujjat Yaratish
bot.on("message:text", async (ctx) => {
  const promptText = ctx.message.text;

  // Menyu tugmalariga javob bermaslik
  if (promptText.startsWith("/") || promptText.includes("Akademik") || promptText.includes("Dasturlash") || promptText.includes("Fanlar") || promptText.includes("Balans") || promptText.includes("Yordam") || promptText.includes("Fayllar")) {
    return;
  }

  const mode = userNodes[ctx.from.id] || "referat";
  await ctx.reply("⏳ **USAT AI javob tayyorlamoqda...**");

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "Siz USAT universitetining akademik sun'iy intellektisiz." },
        { role: "user", content: promptText }
      ],
      model: "gpt-4o-mini",
    });

    const resultText = completion.choices[0]?.message?.content || "Javob olinmadi.";

    if (mode === "pptx") {
      const filePath = `./USAT_${ctx.from.id}.pptx`;
      let pptx = new pptxgen();
      let slides = resultText.split("Slayd:");

      slides.forEach((content) => {
        if (content.trim()) {
          let slide = pptx.addSlide();
          let lines = content.trim().split("\n");
          slide.addText(lines[0], { x: 0.5, y: 0.5, w: "90%", fontSize: 20, bold: true });
          slide.addText(lines.slice(1).join("\n"), { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 12 });
        }
      });

      await pptx.writeFile({ fileName: filePath });
      await ctx.replyWithDocument({ source: filePath }, { caption: "📊 Tayyor Slayd (.pptx)" });
      fs.unlinkSync(filePath);
    } 
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

      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 Tayyor Hujjat (${mode.toUpperCase()})` });
      fs.unlinkSync(filePath);
    } else {
      await ctx.reply(resultText);
    }

  } catch (error) {
    console.error("Xatolik:", error);
    await ctx.reply("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
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
