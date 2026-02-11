import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
    console.warn("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Cập nhật theo yêu cầu: Sử dụng Gemini 2.0 Flash (bản Experimental/Preview mới nhất)
// Model này tối ưu tốc độ và chất lượng cho Quiz.
export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
        responseMimeType: "application/json",
    }
});
