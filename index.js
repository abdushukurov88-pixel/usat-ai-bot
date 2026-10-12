const { Bot, InlineKeyboard } = require("grammy");
const Groq = require("groq-sdk");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const http = require("http");

// Port tinglash uchun minimal server (Render uchun)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("USAT AI Bot is running smoothly!");
}).listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

const BOT_TOKEN = "8742220662:AAGea3_swDL-z6-wweGwJAFjcwGyEkK13X8";
const GROQ_KEY = "gsk_dI8kkCluzYi9zNW8AaZWGdyb3FYWno9XGvyoiAvdZ12jlS5olBA";

const bot = new Bot(BOT_TOKEN);
const groq = new Groq({ apiKey: GROQ_KEY });
const userNodes = {};

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("💻 Dasturlash & Algoritmlar", "mode_dasturlash").row()
    .text("🧮 Oliy Matematika", "mode_matematika").text("📊 Iqtisodiyot & Moliya", "mode_iqtisodiyot").row()
    .text("⚖️ Huquqshunoslik", "mode_huquq").text("🌐 Ingliz tili", "mode_ingliz").row()
    .text("📄 Referat", "mode_referat").text("📘 Kurs ishi", "mode_kurs").row()
    .text("✍️ Essay", "mode_essay").text("📊 Slayd (.pptx)", "mode_pptx").row()
    .text("🧪 Laboratoriya", "mode_lab").text("❓ Test & Quiz", "mode_test").row()
    .text("🎓 BMI / Bitiruv", "mode_bmi").text("📚 Glossariy", "mode_glossariy");

  await ctx.reply("🎓 **USAT Mukammal Akademik AI Platformasi**\n\nKerakli fan yoki akademik formatni tanlang:", { reply_markup: keyboard });
});

bot.callbackQuery(/^mode_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("mode_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ Tanlandi: **${mode.toUpperCase()}**\n\nEndi ushbu fan yoki mavzu bo'yicha o'z savolingizni yuboring:`);
});

bot.on("message:text", async (ctx) => {
  const mode = userNodes[ctx.from.id] || "referat";
  const promptText = ctx.message.text;

  await ctx.reply("⏳ USAT sun'iy intellekti tahlil qilmoqda...");

  try {
    let systemInstruction = "Siz USAT universiteti uchun akademik yordamchisiz.";

    if (mode === "dasturlash") {
      systemInstruction = "Siz Senior Dasturchi va IT professorisiz. Dasturlash, kod va algoritmlar bo'yicha to'liq va mantiqiy yechim beriring.";
    } else if (mode === "matematika") {
      systemInstruction = "Siz Oliy Matematika professorisiz. Masalalarni qadamma-qadam va aniq formulalar bilan yechib bering.";
    } else if (mode === "iqtisodiyot") {
      systemInstruction = "Siz Iqtisodiyot va Moliya professorisiz. Moliyaviy va iqtisodiy tahlillarni professional bering.";
    } else if (mode === "huquq") {
      systemInstruction = "Siz Huquqshunoslik professorisiz. Qonunchilik va huquqiy mantiq bo'yicha tahlil bering.";
    } else if (mode === "ingliz") {
      systemInstruction = "You are an expert English Professor. Provide accurate academic support.";
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ],
      model: "llama-3.3-70b-versatile",
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
          slide.addText(lines.slice(1).join('\n'), { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 12 });
        }
      });

      await pptx.writeFile({ fileName: filePath });
      await ctx.replyWithDocument({ source: filePath }, { caption: "📊 Tayyor Slayd (.pptx)" });
      fs.unlinkSync(filePath);
    } else {
      const filePath = `./USAT_${mode.toUpperCase()}_${ctx.from.id}.docx`;
      let doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: promptText.toUpperCase(), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [new TextRun({ text: resultText, size: 24 })] })
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);

      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 Tayyor hujjat (${mode.toUpperCase()})` });
      fs.unlinkSync(filePath);
    }

  } catch (error) {
    console.error(error);
    await ctx.reply("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.");
  }
});

bot.start();
console.log("🚀 USAT Mukammal Akademik Boti ishga tushdi!");
