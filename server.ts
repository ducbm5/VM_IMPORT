import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Bạn là một công cụ tiền xử lý và chuẩn hóa dữ liệu thành tích thời gian.

Nhiệm vụ của bạn:
Nhận danh sách dữ liệu đầu vào từ người dùng (ở cột THÀNH TÍCH) và chuẩn hóa toàn bộ về định dạng chuẩn hh:mm (giờ:phút) theo các quy tắc sau:

ĐIỀU KIỆN & QUY TẮC CHUẨN HÓA:
1. Nếu ô trống, thiếu dữ liệu, null, hoặc không có thông tin thời gian -> Trả về chữ: D
2. Xác định giá trị Thời gian (Phút và Giờ):
   - Mặc định các số biểu thị phút nếu không chỉ rõ giờ (Ví dụ: "10phút", "10 phút", "10'", "10 p", "10p", "10" đều hiểu là 10 phút -> quy đổi thành 00:10).
   - Nếu dạng "10:00":
     + Ngữ cảnh thành tích thể thao ngắn/trung bình thông thường (chạy, bơi...): "10:00" là 10 phút 00 giây -> quy đổi thành 00:10.
     + Nếu có chỉ rõ giờ (VD: "1h30p", "1 giờ 15 phút", "01:30:00") -> quy đổi chính xác về hh:mm tương ứng (VD: 01:30).
     + Nếu dạng 3 thành phần hh:mm:ss như "01:30:00", "02:15:30" -> quy đổi thành "01:30", "02:15".
     + Nếu "1:45" có thể là 1 giờ 45 phút -> "01:45".
3. Định dạng đầu ra bắt buộc:
   - Giờ và phút luôn có 2 chữ số (hh:mm).
   - Không kèm theo bất kỳ văn bản giải thích nào khác.
   - Nếu trường THÀNH TÍCH đó bỏ trống hoặc không có giá trị thì để là chữ D`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Normalize batch performances using Gemini AI
  app.post("/api/ai/normalize-performance", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({
          error: "Dữ liệu 'items' phải là một mảng chuỗi hoặc đối tượng { id, raw }",
        });
      }

      if (items.length === 0) {
        return res.json({ results: [] });
      }

      const inputValues: string[] = items.map((it) =>
        typeof it === "string" ? it : it?.raw || it?.thanhTich || ""
      );

      const ai = getGenAI();

      const prompt = `Dưới đây là danh sách ${inputValues.length} giá trị đầu vào ở cột THÀNH TÍCH cần chuẩn hóa (theo đúng thứ tự):
${JSON.stringify(inputValues, null, 2)}

Hãy chuẩn hóa từng phần tử theo đúng các quy tắc đã hướng dẫn:
- Trả về dạng hh:mm (ví dụ 00:10, 01:30)
- Nếu trống/null/không có thời gian -> trả về chữ: D
- Giữ nguyên đúng số lượng và thứ tự các phần tử.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: "Định dạng chuẩn hh:mm (ví dụ: '00:10', '01:30') hoặc chữ 'D' nếu không có thời gian",
            },
          },
        },
      });

      const responseText = response.text || "[]";
      let parsedResults: string[] = [];

      try {
        parsedResults = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing Gemini JSON response:", parseError, responseText);
        parsedResults = inputValues.map((v) => (v ? v : "D"));
      }

      // Đảm bảo số lượng kết quả khớp với input
      const finalResults = inputValues.map((orig, idx) => {
        const val = parsedResults[idx];
        if (!val || val.trim() === "") return "D";
        const trimmed = val.trim();
        // Kiểm tra hợp lệ định dạng hh:mm hoặc D
        if (/^\d{2}:\d{2}$/.test(trimmed) || trimmed === "D") {
          return trimmed;
        }
        return trimmed;
      });

      res.json({
        success: true,
        count: finalResults.length,
        results: finalResults,
      });
    } catch (error: any) {
      console.error("AI normalize error:", error);
      res.status(500).json({
        error: error.message || "Lỗi khi xử lý chuẩn hóa bằng AI",
      });
    }
  });

  // Single performance normalize endpoint
  app.post("/api/ai/normalize-single", async (req, res) => {
    try {
      const { value } = req.body;
      const rawStr = value !== undefined && value !== null ? String(value).trim() : "";

      if (!rawStr) {
        return res.json({ success: true, normalized: "D" });
      }

      const ai = getGenAI();
      const prompt = `Giá trị đầu vào cột THÀNH TÍCH: "${rawStr}"
Hãy chuẩn hóa giá trị này về định dạng hh:mm hoặc D theo đúng quy tắc.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              normalized: {
                type: Type.STRING,
                description: "Chuẩn hóa hh:mm hoặc D",
              },
            },
            required: ["normalized"],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"normalized":"D"}');
      res.json({ success: true, normalized: parsed.normalized || "D" });
    } catch (error: any) {
      console.error("AI normalize single error:", error);
      res.status(500).json({ error: error.message || "Lỗi AI xử lý" });
    }
  });

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
