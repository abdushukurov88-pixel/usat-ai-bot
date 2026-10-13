const { Bot } = require("grammy");
const OpenAI = require("openai");
const pptxgen = require("pptxgenjs");
const { Document, Paragraph, TextRun, Packer, HeadingLevel } = require("docx");
const fs = require("fs");
const http = require("http");

// Web server (Render keep-alive)
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("USAT AI Bot is running!\n");
}).listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

// Telegram va OpenAI Kalitlari
const BOT_TOKEN = "8742220662:AAEOOAAuOEcSCU9jeHJqD_hriW8LVElHnHA"; 
const OPENAI_API_KEY = "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";

const bot = new Bot(BOT_TOKEN);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const userNodes = {};

// /start buyrug'i
bot.command("start", async (ctx) => {
  await ctx.reply(
    "🎓 **USAT Mukammal Akademik AI Platformasi**\n\nKerakli fan yoki akademik formatni tanlang:",
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
            { text: "📄 Referat", callback_data: "node_referat" },
            { text: "📘 Kurs ishi", callback_data: "node_kursishi" }
          ],
          [
            { text: "✍️ Essay", callback_data: "node_essay" },
            { text: "📊 Slayd (.pptx)", callback_data: "node_pptx" }
          ],
          [
            { text: "🧪 Laboratoriya", callback_data: "node_laboratoriya" },
            { text: "❓ Test & Quiz", callback_data: "node_quiz" }
          ],
          [
            { text: "🎓 BMI / Bitiruv", callback_data: "node_bmi" },
            { text: "📚 Glossariy", callback_data: "node_glossariy" }
          ]
        ]
      }
    }
  );
});

// Tugmalar uchun ishlovchi
bot.callbackQuery(/^node_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("node_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ Tanlandi: **${mode.toUpperCase()}**\n\nEndi ushbu fan yoki mavzu bo'yicha o'z savolingizni yuboring:`);
});

// Matnli xabarlarni ChatGPT orqali tahlil qilish
bot.on("message:text", async (ctx) => {
  const mode = userNodes[ctx.from.id] || "referat";
  const promptText = ctx.message.text;

  await ctx.reply("⏳ USAT sun'iy intellekti tahlil qilmoqda...");

  try {
    let systemInstruction = "Siz USAT universiteti uchun akademik yordamchisiz.";

    if (mode === "dasturlash") {
      systemInstruction = "Siz Senior Dasturchi va IT professorisiz. Dasturlash, kod va algoritmlar bo'yicha mukammal akademik yordam bering.";
    } else if (mode === "matematika") {
      systemInstruction = "Siz Oliy Matematika professorisiz. Masalalarni qadamma-qadam va aniq formulalar bilan yechib bering.";
    } else if (mode === "iqtisodiyot") {
      systemInstruction = "Siz Iqtisodiyot va Moliya professorisiz. Moliyaviy va iqtisodiy tahlillarni akademik tilda tushuntiring.";
    } else if (mode === "huquq") {
      systemInstruction = "Siz Huquqshunoslik professorisiz. Qonunchilik va huquqiy mantiq bo'yicha tahlil bering.";
    } else if (mode === "ingliz") {
      systemInstruction = "You are an expert English Professor. Provide accurate academic support.";
    }

    // OpenAI (ChatGPT) so'rovi
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
          slide.addText(lines[0], { x: 0.5, y: 0.5, w: "90%", fontSize: 20, bold: true });
          slide.addText(lines.slice(1).join("\n"), { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 12 });
        }
      });

      await pptx.writeFile({ fileName: filePath });
      await ctx.replyWithDocument({ source: filePath }, { caption: "📊 Tayyor Slayd (.pptx)" });
      fs.unlinkSync(filePath);
    } 
    // Word (.docx) hujjatlar
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

      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 Tayyor hujjat (${mode.toUpperCase()})` });
      fs.unlinkSync(filePath);
    } else {
      // Oddiy matn javobi
      await ctx.reply(resultText);
    }

  } catch (error) {
    console.error("Xatolik tafsiloti:", error);
    await ctx.reply("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
  }
});

bot.start();
console.log("🚀 USAT Mukammal Akademik Boti ishga tushdi!");
