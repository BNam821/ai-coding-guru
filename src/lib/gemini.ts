import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL_PROVIDER = "google";
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-lite";

if (!apiKey) {
    console.warn("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Cập nhật theo yêu cầu: Sử dụng Gemini 2.0 Flash (bản Experimental/Preview mới nhất)
// Model này tối ưu tốc độ và chất lượng cho Quiz.
export const geminiModel = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json",
    }
});

export async function generateGeminiResponseText(prompt: string) {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
