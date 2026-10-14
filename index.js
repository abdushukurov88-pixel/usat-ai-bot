const { Bot, Keyboard, InlineKeyboard, webhookCallback } = require("grammy");
const OpenAI = require("openai");
const pptxgen = require("pptxgenjs");
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require("docx");
const fs = require("fs");
const express = require("express");

// Bot va API Kalitlari
const BOT_TOKEN = "8996760204:AAGYPitgLKDcig3YCCq-R4D7VK94drwLdi8"; 
const OPENAI_API_KEY = "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";

const bot = new Bot(BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const app = express();

app.use(express.json());

// Webhook marshruti
app.use("/webhook", webhookCallback(bot, "express"));

app.get("/", (req, res) => {
  res.send("USAT Custom Academic AI Active!");
});

const userNodes = {};

// 🧠 HAR BIR FAN UCHUN MAXSUS UNIKAL SUN'IY INTELLEKT ROLLARI
const ADVANCED_AI_AGENTS = {
  dasturlash: `Siz USAT universitetining Senior IT Mentorisiz. 
Sizning vazifangiz:
1. Talabaga xatosiz, toza va zamonaviy kod (Python, C++, JS, va h.k.) yozib berish.
2. Koddagi har bir muhim mantiqiy qatorga qisqa va tushunarli izohlar berish.
3. Hech qanday OpenAI yoki ChatGPT reklamasini ishlatmang. Faqat USAT IT platformasi nomidan gapiring.`,

  matematika: `Siz Oliy Matematika va Matematik Tahlil professorisiz.
Sizning vazifangiz:
1. Matematik masalalar, integrallar va differensial tenglamalarni bosqichma-bosqich yechish.
2. Har bir qadam va formulani xuddi doskada tushuntirgandek aniq bayon qilish.
3. Javob oxirida masalaning amaliy ma'nosi haqida qisqa xulosa berish.`,

  iqtisodiyot: `Siz Moliya va Iqtisodiy Tahlil bo'yicha yetakchi ekspertsiz.
Sizning vazifangiz:
1. Iqtisodiy nazariyalar, hisob-kitoblar va formulalarni akademik va real bozor misollarida tushuntirish.
2. Talabaga mantiqiy va professional xulosalar taqdim etish.`,

  huquq: `Siz Oliy Huquqshunos va yurist professorigiz.
Sizning vazifangiz:
1. Huquqiy vaziyatlar va qonunchilik moddalarini mantiqiy va rasmiy akademik uslubda tahlil qilish.
2. Tahlilni aniq faktlar va huquqiy asoslarga tayangan holda berish.`,

  ingliz: `You are a High-Level Academic English Professor and IELTS Master Coach.
Your task:
1. Help students with Academic Writing, Essay structuring, and advanced vocabulary (C1/C2 level).
2. Correct grammar mistakes and explain why they were wrong.`,

  referat: `Siz Akademik Referat va Ilmiy Ishlar Ekspertisiz.
Sizning vazifangiz:
1. Berilgan mavzu bo'yicha Kirish, Asosiy Reja (2-3 ta punkt), Xulosa va Adabiyotlar ro'yxatidan iborat mukammal va boyitilgan akademik matn tuzish.`,

  pptx: `Siz Taqdimot va Slayd Dizaynerisiz.
Sizning vazifangiz:
1. Slayd matnlarini tayyorlashda har bir slaydni 'Slayd: [Sarlavha]' va matn ko'rinishida aniq ajratib berish.`
};

// 📱 Asosiy Menyu
const mainKeyboard = new Keyboard()
  .text("🚀 Akademik AI (Slayd & Hujjat)").row()
  .text("💻 IT & Dasturlash").text("📚 Oliy Fanlar").row()
  .text("🗂 Fayl Konverter").text("📂 Mening Fayllarim").row()
  .text("💎 Balans & Referal").text("ℹ️ Yordam")
  .resized();

// /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🎓 **USAT NUKAMMAL MULTI-AI AKADEMIK PLATFORMASI**\n\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n" +
    "Har bir fan bo'yicha alohida moslashtirilgan Sun'iy Intellekt Agenti xizmatingizda!\n\n" +
    "👇 Kerakli bo'limni tanlang:",
    { parse_mode: "Markdown", reply_markup: mainKeyboard }
  );
});

// Bo'limlar
bot.hears(/Akademik AI/i, async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("📊 Slayd / Taqdimot (.pptx)", "node_pptx").row()
    .text("📄 Referat (.docx)", "node_referat").row()
    .text("📘 Kurs Ishi (.docx)", "node_kursishi").row()
    .text("✍️ Akademik Insho / Essay", "node_essay");

  await ctx.reply("🎓 **Qaysi akademik hujjatni tayyorlaymiz?** 👇", { reply_markup: inlineMenu });
});

bot.hears(/IT & Dasturlash/i, async (ctx) => {
  userNodes[ctx.from.id] = "dasturlash";
  await ctx.reply("💻 **IT MENTOR AI FAOL!**\n\nKodingizni yuboring yoki dasturlash bo'yicha savolingizni yozing:");
});

bot.hears(/Oliy Fanlar/i, async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("🏛 Oliy Matematika", "node_matematika")
    .text("📊 Iqtisodiyot", "node_iqtisodiyot").row()
    .text("⚖️ Huquqshunoslik", "node_huquq")
    .text("🌐 Ingliz Tili", "node_ingliz");

  await ctx.reply("📚 **Qaysi fan bo'yicha AI Professor yordami kerak?** 👇", { reply_markup: inlineMenu });
});

bot.hears(/Balans & Referal/i, async (ctx) => {
  await ctx.reply(`💎 **Balansingiz:** Cheksiz (USAT Talabasi)\n🔗 **Referal link:** https://t.me/USAT_Acade_mic_AI_bot?start=${ctx.from.id}`);
});

bot.hears(/Mening Fayllarim/i, async (ctx) => {
  await ctx.reply("📂 Fayllaringiz ro'yxati bo'sh.");
});

bot.hears(/Yordam/i, async (ctx) => {
  await ctx.reply("ℹ️ **USAT AI Yordam:** @USAT_Support");
});

// Inline Tugmalar
bot.callbackQuery(/^node_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("node_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ **${mode.toUpperCase()} AI AGENTI ULANDI!**\n\nEndi mavzu yoki topshiriq matnini yuboring:`);
});

// Sun'iy Intellekt Tahlili va Javob Berish
bot.on("message:text", async (ctx) => {
  const promptText = ctx.message.text;

  if (promptText.startsWith("/") || promptText.includes("Akademik") || promptText.includes("Dasturlash") || promptText.includes("Fanlar") || promptText.includes("Balans") || promptText.includes("Yordam") || promptText.includes("Fayllar")) {
    return;
  }

  const mode = userNodes[ctx.from.id] || "referat";
  const systemInstruction = ADVANCED_AI_AGENTS[mode] || "Siz USAT universitetining akademik AI yordamchisiz.";

  await ctx.reply(`⏳ **USAT AI (${mode.toUpperCase()}) tahlil qilmoqda...**`);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ],
      model: "gpt-4o-mini",
    });

    const resultText = completion.choices[0]?.message?.content || "Javob olinmadi.";

    // PPTX Slayd
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
      await ctx.replyWithDocument({ source: filePath }, { caption: "📊 **Tayyor Taqdimot (.pptx)**" });
      fs.unlinkSync(filePath);
    } 
    // Word Hujjat (.docx)
    else if (["referat", "kursishi", "essay"].includes(mode)) {
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
