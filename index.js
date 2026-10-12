const { Bot, InlineKeyboard } = require("grammy");
const Groq = require("groq-sdk");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");
const pptxgen = require("pptxgenjs");
const fs = require("fs");

const BOT_TOKEN = "8742220662:AAF1TFHB21TdzaWFHtSMv21gDmLHLgYi--IKE";
const GROQ_KEY = "gsk_dI8kkCluzYi9zNW8AaZWGdyb3FYWno9XGvyoiAvdZ12jlS5olBA";

const bot = new Bot(BOT_TOKEN);
const groq = new Groq({ apiKey: GROQ_KEY });
const userNodes = {};

// Fanlar va yo'nalishlar uchun kengaytirilgan menyu
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

// Tugma bosilganda rejimni saqlash
bot.callbackQuery(/^mode_/, async (ctx) => {
  const mode = ctx.callbackQuery.data.replace("mode_", "");
  userNodes[ctx.from.id] = mode;
  await ctx.answerCallbackQuery();
  await ctx.reply(`✅ Tanlandi: **${mode.toUpperCase()}**\n\nEndi ushbu fan yoki mavzu bo'yicha o'z savolingizni yoki topshirig'ingizni yuboring:`);
});

// Xabarlarni qabul qilib AI orqali qayta ishlash
bot.on("message:text", async (ctx) => {
  const mode = userNodes[ctx.from.id] || "referat";
  const promptText = ctx.message.text;

  await ctx.reply("⏳ USAT sun'iy intellekti tahlil qilmoqda va hujjat tayyorlamoqda...");

  try {
    let systemInstruction = "Siz USAT universiteti uchun yuqori malakali akademik yordamchisiz.";
    let selectedModel = "llama-3.3-70b-versatile";

    // Har bir fan uchun eng kuchli AI-professor (mutaxassis) rollari
    if (mode === "dasturlash") {
      systemInstruction = "Siz dunyo darajasidagi Senior Dasturchi, algoritm mutaxassisi va IT professorisiz. Berilgan dasturlash masalalari, kodlar (Python, C++, JS) va mantiqiy savollarga mukammal, optimallashtirilgan kod, tushuntirish va amaliy misollar bilan javob bering.";
    } else if (mode === "matematika") {
      systemInstruction = "Siz fan doktori, Oliy Matematika va Matematik tahlil professorisiz. Har bir formula, tenglama va hisob-kitobni qadamma-qadam, mantiqiy isbotlari bilan aniq tushuntirib bering.";
    } else if (mode === "iqtisodiyot") {
      systemInstruction = "Siz tajribali Iqtisodchi, Moliya tahlilchisi va biznes professorisiz. Hisob-kitoblar, buxgalteriya, moliyaviy tahlil va bozor qonuniyatlari bo'yicha professional akademik javoblar bering.";
    } else if (mode === "huquq") {
      systemInstruction = "Siz Huquqshunoslik fanlari doktori va professorisiz. Qonunchilik hujjatlari, huquqiy mantiq va normativ-huquqiy tahlillar bo'yicha mukammal ma'lumot bering.";
    } else if (mode === "ingliz") {
      systemInstruction = "You are an expert Professor of English Language, Linguistics, and IELTS instructor. Provide grammatically flawless academic responses, explanations, and vocabulary support in English or Uzbek as requested.";
    } else if (mode === "pptx") {
      systemInstruction = "Siz professional taqdimotchi va akademik dizaynersiz. Taqdimot uchun slaydlar matnini 'Slayd: [Sarlavha]' va keyin qatorma-qator matn ko'rinishida aniq tuzib chiqing.";
    } else {
      systemInstruction = "Siz USAT universiteti talabalari uchun ilmiy ishlar, referatlar va kurs ishlarini yozishga ixtisoslashgan mukammal akademik yordamchisiz.";
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ],
      model: selectedModel,
    });

    const resultText = completion.choices[0]?.message?.content || "Javob olinmadi.";

    // Slayd (PPTX) yoki Matnli hujjat (DOCX) yaratish sharti
    if (mode === "pptx") {
      const filePath = `./USAT_Presentation_${ctx.from.id}.pptx`;
      let pptx = new pptxgen();
      let slides = resultText.split("Slayd:");
      
      slides.forEach((content) => {
        if (content.trim()) {
          let slide = pptx.addSlide();
          slide.background = { color: "F4F6F9" };
          let lines = content.trim().split("\n");
          slide.addText(lines[0], { x: 0.5, y: 0.5, w: "90%", fontSize: 22, bold: true, color: "0B3366" });
          slide.addText(lines.slice(1).join('\n'), { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 13, color: "333333" });
        }
      });

      await pptx.writeFile({ fileName: filePath });
      await ctx.replyWithDocument({ source: filePath }, { caption: "📊 Tayyor Slayd Prezentatsiya (.pptx)" });
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

      await ctx.replyWithDocument({ source: filePath }, { caption: `📄 Tayyor akademik hujjat (${mode.toUpperCase()})` });
      fs.unlinkSync(filePath);
    }

  } catch (error) {
    console.error(error);
    await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
  }
});

bot.start();
console.log("🚀 USAT Mukammal Akademik Boti ishga tushdi!");

const http = require("http");
http.createServer((req, res) => {
  res.write("USAT AI Bot ishlamoqda!");
  res.end();
}).listen(process.env.PORT || 3000);

const http = require("http");
http.createServer((req, res) => {
  res.write("USAT AI Bot is active");
  res.end();
}).listen(process.env.PORT || 3000);
