const { Bot, webhookCallback } = require("grammy");
const OpenAI = require("openai");
const pptxgen = require("pptxgenjs");
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require("docx");
const fs = require("fs");
const express = require("express");

// Yangi Bot Tokeni va OpenAI Kaliti
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

// /start buyrug'i
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🎓 **USAT Mukammal Akademik AI Platformasi**\n\nKerakli yo'nalish yoki formatni tanlang:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💻 Dasturlash & Algoritmlar", callback_data: "node_dasturlash" }],
          [
            { text: "🏛 Oliy Matematika", callback_data: "node_matematika" },
            { text: "📊 Iqtisodiyot & Moliya", callback_data: "node_iqtisodiyot" }
          ],
          [
            { text: "⚖️ Huquqshunoslik", callback_data: "node_huquq" },
            { text: "🌐 Ingliz tili", callback_data: "node_ingliz" }
          ],
          [
            { text: "📄 Referat (.docx)", callback_data: "node_referat" },
            { text: "📘 Kurs ishi (.docx)", callback_data: "node_kursishi" }
          ],
          [
            { text: "✍️ Essay", callback_data: "node_essay" },
            { text: "📊 Slayd (.pptx)", callback_data: "node_pptx" }
          ]
        ]
      }
    }
  );
});

bot.callbackQuery(/^node_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("node_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ Tanlandi: **${mode.toUpperCase()}**\n\nMavzu yoki savolingizni yuboring:`);
});

bot.on("message:text", async (ctx) => {
  const mode = userNodes[ctx.from.id] || "referat";
  const promptText = ctx.message.text;

  await ctx.reply("⏳ USAT AI tahlil qilmoqda...");

  try {
    let systemInstruction = "Siz USAT universiteti uchun akademik yordamchisiz.";

    if (mode === "dasturlash") {
      systemInstruction = "Siz IT va Dasturlash professorisiz. Aniq kod va tushuntirishlar bering.";
    } else if (mode === "matematika") {
      systemInstruction = "Siz Oliy Matematika professorisiz. Masalalarni bosqichma-bosqich yeching.";
    } else if (mode === "iqtisodiyot") {
      systemInstruction = "Siz Iqtisodiyot va Moliya bo'yicha ekspertsiz.";
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
          let lines = content.trim().splitynth = content.trim().split("\n");
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
