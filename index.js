const { Bot, Keyboard, InlineKeyboard, webhookCallback } = require("grammy");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pptxgen = require("pptxgenjs");
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require("docx");
const fs = require("fs");
const express = require("express");

// Bot Token va Google Gemini API Kalit
const BOT_TOKEN = "8996760204:AAGYPitgLKDcig3YCCq-R4D7VK94drwLdi8"; 
const GEMINI_API_KEY = "AQ.Ab8RN6JL8kN0wJzsiduLwyVnRXYg76ApxZIrCZbMvutXLJjc4g";

const bot = new Bot(BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const app = express();

app.use(express.json());

// Webhook marshruti
app.use("/webhook", webhookCallback(bot, "express"));

app.get("/", (req, res) => {
  res.send("USAT Gemini Academic AI Active!");
});

const userNodes = {};

// 🧠 HAR BIR FAN UCHUN MAXSUS UNIKAL SUN'IY INTELLEKT ROLLARI
const AGENT_SYSTEM_PROMPTS = {
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
    "✨ **USAT GOOGLE GEMINI ACADEMIC PLATFORMASI**\n\n" +
    "━━━━━━━━━━━━━━━━━━━━━━\n" +
    "Tezkor va aqlli **Google Gemini AI** sun'iy intellekti faollashtirildi!\n\n" +
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
  await ctx.reply("💻 **GOOGLE GEMINI IT MENTOR FAOL!**\n\nKodingizni yuboring yoki dasturlash bo'yicha savolingizni yozing:");
});

bot.hears(/Oliy Fanlar/i, async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("🏛 Oliy Matematika", "node_matematika")
    .text("📊 Iqtisodiyot", "node_iqtisodiyot").row()
    .text("⚖️ Huquqshunoslik", "node_huquq")
    .text("🌐 Ingliz Tili", "node_ingliz");

  await ctx.reply("📚 **Qaysi fan bo'yicha Gemini Professor yordami kerak?** 👇", { reply_markup: inlineMenu });
});

bot.hears(/Balans & Referal/i, async (ctx) => {
  await ctx.reply(`💎 **Balansingiz:** Cheksiz (USAT Student)\n🔗 **Referal link:** https://t.me/USAT_Acade_mic_AI_bot?start=${ctx.from.id}`);
});

bot.hears(/Mening Fayllarim/i, async (ctx) => {
  await ctx.reply("📂 Fayllaringiz ro'yxati bo'sh.");
});

bot.hears(/Yordam/i, async (ctx) => {
  await ctx.reply("ℹ️ **USAT Gemini AI Yordam:** @USAT_Support");
});

// Inline Tugmalar
bot.callbackQuery(/^node_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("node_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ **${mode.toUpperCase()} GEMINI AGENTI ULANDI!**\n\nEndi mavzu yoki topshiriq matnini yuboring:`);
});

// Google Gemini AI orqali Javob Yaratish
bot.on("message:text", async (ctx) => {
  const promptText = ctx.message.text;

  if (promptText.startsWith("/") || promptText.includes("Akademik") || promptText.includes("Dasturlash") || promptText.includes("Fanlar") || promptText.includes("Balans") || promptText.includes("Yordam") || promptText.includes("Fayllar")) {
    return;
  }

  const mode = userNodes[ctx.from.id] || "referat";
  const systemPrompt = AGENT_SYSTEM_PROMPTS[mode] || "Siz USAT universitetining akademik sun'iy intellekt yordamchisiz.";

  await ctx.reply(`⏳ **Google Gemini (${mode.toUpperCase()}) tahlil qilmoqda...**`);

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent(promptText);
    const resultText = result.response.text();

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

      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 **Tayyor Hujjat (${mode.toUpperCase()})**` });
      fs.unlinkSync(filePath);
    } else {
      await ctx.reply(resultText);
    }

  } catch (error) {
    console.error("Gemini Error:", error);
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
