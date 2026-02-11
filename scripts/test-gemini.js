const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ API Key not found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Actually, list models is a separate API call not directly on model instance in some SDK versions, 
        // but the SDK structure might require `genAI.getGenerativeModel` to test connection.
        // Let's try to just run a simple prompt to test the model 'gemini-1.5-flash-latest'.

        console.log("Testing model 'gemini-1.5-flash-latest'...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hello, are you working?");
        console.log("✅ Model Works! Response:", result.response.text());
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

listModels();
