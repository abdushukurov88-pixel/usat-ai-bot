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
  res.send("USAT Academic AI Bot — Webhook Active!");
});

const userNodes = {};

// Asosiy Pastki Menyuni Yaratish (Reply Keyboard)
const mainKeyboard = new Keyboard()
  .text("✨ Slayd va hujjat yaratish").row()
  .text("🎁 Namuna").text("🗂 Universal konverter").row()
  .text("💸 Narxlar").text("💰 Balans & Referal").row()
  .text("📁 Mening fayllarim").text("⚙️ Sozlamalar")
  .resized();

// /start buyrug'i
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🎓 **USAT Mukammal Akademik AI Platformasiga Xush Kelibsiz!**\n\nKerakli bo'limni pastdagi menyudan tanlang 👇",
    { reply_markup: mainKeyboard }
  );
});

// Asosiy Menyudagi Tugmalar Reaksiyasi
bot.hears("✨ Slayd va hujjat yaratish", async (ctx) => {
  const inlineMenu = new InlineKeyboard()
    .text("💻 Dasturlash & Kod", "node_dasturlash").row()
    .text("🏛 Oliy Matematika", "node_matematika").text("📊 Iqtisodiyot", "node_iqtisodiyot").row()
    .text("📄 Referat (.docx)", "node_referat").text("📘 Kurs ishi (.docx)", "node_kursishi").row()
    .text("✍️ Essay", "node_essay").text("📊 Slayd (.pptx)", "node_pptx");

  await ctx.reply("Nima yaratmoqchisiz? Kerakli formatni tanlang 👇", {
    reply_markup: inlineMenu,
  });
});

bot.hears("🗂 Universal konverter", async (ctx) => {
  const converterMenu = new InlineKeyboard()
    .text("📄 Word/PPT dan PDF", "conv_doc2pdf").row()
    .text("🖼 Rasmlardan PDF", "conv_img2pdf").row()
    .text("🔗 PDF larni birlashtirish", "conv_mergepdf").row()
    .text("📦 Fayllarni arxivlash (ZIP)", "conv_zip");

  await ctx.reply("Fayllaringizni bir formatdan boshqasiga o'g'iraman. Nima qilmoqchisiz? 👇", {
    reply_markup: converterMenu,
  });
});

bot.hears("🎁 Namuna", async (ctx) => {
  await ctx.reply("📚 **Namuna bo'limi:**\nBot orqali tayyorlangan namunaviy Referat, Kurs ishi va Taqdimotlarni yuklab olishingiz mumkin.");
});

bot.hears("💸 Narxlar", async (ctx) => {
  await ctx.reply("💳 **Xizmat narxlari:**\n- AI Referat / Kurs ishi: Bepul\n- AI Slayd (.pptx): Bepul");
});

bot.hears("💰 Balans & Referal", async (ctx) => {
  await ctx.reply("👤 **Sizning balansingiz:** 0 so'm\n🔗 **Referal havolangiz:** `https://t.me/USAT_Acade_mic_AI_bot?start=" + ctx.from.id + "`");
});

bot.hears("📁 Mening fayllarim", async (ctx) => {
  await ctx.reply("📁 Siz hali hech qanday hujjat yaratmadingiz.");
});

bot.hears("⚙️ Sozlamalar", async (ctx) => {
  await ctx.reply("⚙️ **Sozlamalar:** Til: O'zbek tili");
});

// Inline Tugmalar Boshqaruvi
bot.callbackQuery(/^node_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("node_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ Tanlandi: **${mode.toUpperCase()}**\n\nEndi mavzu yoki topshiriq matnini yuboring:`);
});

bot.callbackQuery(/^conv_/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("📥 Ushbu amal uchun fayllaringizni yuboring:");
});

// Matnli Xabar Tahlili va Hujjat Generatsiyasi
bot.on("message:text", async (ctx) => {
  const mode = userNodes[ctx.from.id] || "referat";
  const promptText = ctx.message.text;

  // Agar bosilgan tekst menyu tugmasi bo'lsa, AI ga so'rov yubormaymiz
  const systemButtons = [
    "✨ Slayd va hujjat yaratish", "🎁 Namuna", "🗂 Universal konverter",
    "💸 Narxlar", "💰 Balans & Referal", "📁 Mening fayllarim", "⚙️ Sozlamalar"
  ];
  if (systemButtons.includes(promptText)) return;

  await ctx.reply("⏳ USAT AI tahlil qilmoqda va hujjat tayyorlamoqda...");

  try {
    let systemInstruction = "Siz USAT akademiyasining mutaxassis yordamchisiz.";

    if (mode === "dasturlash") {
      systemInstruction = "Siz IT va Dasturlash professorisiz. Aniq kod va tushuntirishlar bering.";
    } else if (mode === "matematika") {
      systemInstruction = "Siz Oliy Matematika professorisiz. Masalalarni bosqichma-bosqich yeching.";
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
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

      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 Tayyor hujjat (${mode.toUpperCase()})` });
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
  console.log(`Server running on port ${PORT}`);
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  if (renderUrl) {
    try {
      await bot.api.setWebhook(`${renderUrl}/webhook`);
      console.log(`Webhook successfully set to: ${renderUrl}/webhook`);
    } catch (err) {
      console.error("Webhook o'rnatishda xatolik:", err);
    }
  }
});
