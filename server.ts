import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing large payloads (images)
  app.use(express.json({ limit: '10mb' }));

  // Shared Database config read/write endpoints to sync credentials across all devices
  const CONFIG_FILE_PATH = path.join(process.cwd(), "supabase-config.json");

  app.get("/api/get-config", (req, res) => {
    try {
      let config = { url: "", key: "" };
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        const fileContent = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
        config = JSON.parse(fileContent);
      }
      
      // Fallback to server-side env vars if config file is empty
      const url = config.url || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const key = config.key || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
      
      res.json({ url, key });
    } catch (error) {
      console.error("Failed to read shared Supabase config:", error);
      res.json({ url: "", key: "" }); // Return empty rather than crashing
    }
  });

  app.post("/api/save-config", (req, res) => {
    try {
      const { url, key } = req.body;
      const config = { url: url?.trim() || "", key: key?.trim() || "" };
      
      fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
      
      // Also update environment variables in-memory
      if (config.url) {
        process.env.VITE_SUPABASE_URL = config.url;
      }
      if (config.key) {
        process.env.VITE_SUPABASE_ANON_KEY = config.key;
      }
      
      res.json({ success: true, message: "Configuration saved successfully on server." });
    } catch (error) {
      console.error("Failed to save shared Supabase config:", error);
      res.status(500).json({ error: "Failed to save configuration on server" });
    }
  });

  // Gemini Initialization
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { image, garmentType, measurementPoints } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      // Remove the data:image/...;base64, prefix if present
      const base64Data = image.split(',')[1] || image;

      const prompt = `
        You are a professional medical assistant specialized in compression garment measurements.
        Analyze the provided clinical photo of a patient. The requested garment is: ${garmentType}.
        Based on the photo and typical anatomy for this body part, estimate the circumference measurements for the following points:
        ${measurementPoints.map((p: any) => `- ${p.label} (${p.id})`).join('\n')}
        
        Provide your estimates in centimeters. Be as accurate as possible based on the visual evidence.
        Also provide a "Clinical Visual Summary" which is a clean, professional description of the visual condition shown (e.g., 'Mild edema present in the forearm area, normal skin tone, no visible ulcers').
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              measurements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    value: { type: Type.STRING, description: "Numeric value in cm (as string)" }
                  },
                  required: ["id", "value"]
                }
              },
              clinicalSummary: { type: Type.STRING }
            },
            required: ["measurements", "clinicalSummary"]
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      res.status(500).json({ error: "Failed to analyze image with AI", details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
