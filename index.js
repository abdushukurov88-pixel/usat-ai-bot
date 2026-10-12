const { Bot, InlineKeyboard } = require("grammy");
const Groq = require("groq-sdk");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");
const pptxgen = require("pptxgenjs");
const fs = require("fs");

const BOT_TOKEN = "8742220662:AAF1TFHB2lTdzMfHTsW2igDmLHLgYi--iKE";
const GROQ_KEY = "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";

const bot = new Bot(BOT_TOKEN);
const groq = new Groq({ apiKey: GROQ_KEY });
const userModes = {};

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("📄 Referat", "mode_referat").text("📘 Kurs ishi", "mode_kurs").row()
    .text("✍️ Essay", "mode_essay").text("📊 Slayd (.pptx)", "mode_pptx").row()
    .text("🧪 Laboratoriya", "mode_lab").text("❓ Test & Quiz", "mode_test").row()
    .text("🧩 Krossvord", "mode_kross").text("📑 Tezis & Maqola", "mode_tezis").row()
    .text("🎓 BMI / Bitiruv", "mode_bmi").text("📚 Glossariy", "mode_glossariy");

  await ctx.reply("🎓 **USAT Mukammal Academic AI Platformasi**\n\nKerakli akademik formatni tanlang:", { reply_markup: keyboard });
});

bot.callbackQuery(/^mode_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("mode_", "");
  userModes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ Tanlangan rejim: **${mode.toUpperCase()}**\n\nMavzu yoki topshiriq shartini kiriting:`);
});

bot.on("message:text", async (ctx) => {
  const mode = userModes[ctx.from.id] || "referat";
  const promptText = ctx.message.text;
  await ctx.reply("⚡ USAT AI akademik hujjatni tayyorlamoqda...");

  try {
    let systemInstruction = "Siz USAT universitetining yetakchi akademik professorisiz. Universitet standartlariga to'la mos keladigan mukammal, ilmiy va batafsil matn yozing.";
    let selectedModel = "llama-3.3-70b-versatile";

    if (mode === "kurs" || mode === "bmi") {
      systemInstruction = "Siz Oliy ta'lim professorisiz. Kurs ishi yoki Bitiruv malakaviy ishi (BMI) uchun reja, kirish, asosiy qism, xulosa va adabiyotlar ro'yxatini ilmiy tilda to'liq yozing.";
    } else if (mode === "essay") {
      systemInstruction = "Siz Academic Writing ekspertisiz. Kirish, tezis, argumentlar va kuchli xulosadan iborat mukammal essay yozing.";
    } else if (mode === "test") {
      systemInstruction = "Siz testologsiz. Berilgan mavzu bo'yicha 4 ta variantli (A, B, C, D) va to'g'ri javoblari ko'rsatilgan 10 ta test tuzing.";
    } else if (mode === "krossvord") {
      systemInstruction = "Siz pedagog-metodistsiz. Mavzu bo'yicha savollari va javoblari bilan krossvord tuzing.";
    } else if (mode === "pptx") {
      systemInstruction = "Siz taqdimot ustasisiz. Slaydlar matnini tuzing. Har bir slaydni aniq 'Slayd:' so'zi bilan boshlang.";
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ],
      model: selectedModel,
    });

    const resultText = completion.choices[0]?.message?.content || "Javob olinmadi.";

    if (mode === "pptx") {
      const filePath = `./USAT_Presentation_${ctx.from.id}.pptx`;
      let pptx = new pptxgen();
      let slides = resultText.split("Slayd:");
      slides.forEach((content, index) => {
        if (content.trim()) {
          let slide = pptx.addSlide();
          slide.background = { color: "F4F6F9" };
          let lines = content.trim().split("\n");
          slide.addText(lines[0] || `Slayd ${index}`, { x: 0.5, y: 0.5, w: "90%", fontSize: 22, bold: true, color: "003366" });
          slide.addText(lines.slice(1).join("\n"), { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 13, color: "333333" });
        }
      });
      await pptx.writeFile({ fileName: filePath });
      await ctx.replyWithDocument({ source: filePath }, { caption: "📊 Tayyor Slayd Presentation (.pptx)" });
      fs.unlinkSync(filePath);
    } else {
      const filePath = `./USAT_${mode.toUpperCase()}_${ctx.from.id}.docx`;
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: promptText.toUpperCase(), heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [new TextRun({ text: resultText, size: 24 })] })
          ]
        }]
      });
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);
      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 Tayyor ${mode.toUpperCase()} hujjati (.docx)` });
      fs.unlinkSync(filePath);
    }

  } catch (err) {
    await ctx.reply("❌ Xatolik: " + err.message);
  }
});

bot.start();
console.log("🚀 USAT Mukammal Akademik Boti ishga tushdi!");
