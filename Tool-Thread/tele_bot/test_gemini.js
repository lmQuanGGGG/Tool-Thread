const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
async function test() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
