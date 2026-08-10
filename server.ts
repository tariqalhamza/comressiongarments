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

  // Middleware for parsing large payloads (images and clinical data)
  app.use(express.json({ limit: '50mb' }));

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

  // Clinical user profiles sync endpoints for multi-device login persistence
  const PROFILES_FILE_PATH = path.join(process.cwd(), "clinical-profiles.json");

  const sanitizeProfilesList = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    return list.map((p) => {
      if (!p || typeof p !== "object") return p;
      let email = (p.email || "").trim();
      const fullName = (p.full_name || "").trim();
      const fullNameLower = fullName.toLowerCase();
      const isAdminOrMahmood = p.role === "admin" || fullNameLower.includes("mahmood") || fullNameLower.includes("mehmood");

      if (isAdminOrMahmood) {
        let cleanName = (p.full_name || "").trim();
        if (!cleanName || cleanName.toLowerCase().includes("dr. mahmood") || cleanName.toLowerCase().includes("dr. mehmood") || cleanName.toLowerCase().includes("dr mahmood") || cleanName.toLowerCase().includes("dr mehmood") || cleanName === "Mahmood Admin" || cleanName === "Mahmood" || cleanName === "Mehmood") {
          cleanName = "Mahmood Ahmed";
        }
        return {
          ...p,
          full_name: cleanName,
          role: "admin",
          email: email && !email.includes("overplast") && email !== "ahmed@gmail.com" ? email : "mehmood@gmail.com",
          password: p.password && p.password !== "ahmed123" && p.password !== "mehmood123" ? p.password : "12345678"
        };
      }

      let namePart = (p.full_name || "user").trim().split(" ").pop() || "user";
      let cleanName = namePart.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (!email) {
        email = `${cleanName || "user"}@gmail.com`;
      } else if (email.toLowerCase().endsWith("@overplast.com") && email.toLowerCase() !== "demo@overplast.com") {
        email = email.replace(/@overplast\.com$/i, "@gmail.com");
      }

      let password = p.password || `${cleanName || "user"}123`;

      return {
        ...p,
        email,
        password
      };
    });
  };

  app.get("/api/get-profiles", (req, res) => {
    try {
      let profiles = [];
      if (fs.existsSync(PROFILES_FILE_PATH)) {
        const fileContent = fs.readFileSync(PROFILES_FILE_PATH, "utf-8");
        profiles = JSON.parse(fileContent);
      }
      const sanitized = sanitizeProfilesList(profiles);
      res.json(sanitized);
    } catch (error) {
      console.error("Failed to read clinical profiles:", error);
      res.json([]);
    }
  });

  app.post("/api/save-profiles", (req, res) => {
    try {
      const profiles = req.body;
      if (!Array.isArray(profiles)) {
        return res.status(400).json({ error: "Invalid data format. Expected array." });
      }
      const sanitized = sanitizeProfilesList(profiles);
      fs.writeFileSync(PROFILES_FILE_PATH, JSON.stringify(sanitized, null, 2), "utf-8");
      res.json({ success: true, message: "Clinical profiles updated successfully on server." });
    } catch (error) {
      console.error("Failed to save clinical profiles:", error);
      res.status(500).json({ error: "Failed to save clinical profiles on server" });
    }
  });

  // Clinical data (patients, assessments, orders) server persistence endpoints
  const CLINICAL_DATA_FILE_PATH = path.join(process.cwd(), "clinical-data.json");

  // Helper to execute direct remote Supabase REST deletions from the backend
  async function deleteFromSupabaseRemote(table: string, column: string, value: string) {
    try {
      let url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      let key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      
      if (fs.existsSync(CONFIG_FILE_PATH)) {
        try {
          const fileContent = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
          const parsed = JSON.parse(fileContent);
          if (parsed.url) url = parsed.url;
          if (parsed.key) key = parsed.key;
        } catch {}
      }

      if (!url || !key || url.includes('placeholder') || url.includes('your_supabase_project_url')) {
        return;
      }

      const cleanUrl = url.replace(/\/$/, "");
      const endpoint = `${cleanUrl}/rest/v1/${table}?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        }
      });

      console.log(`[Supabase Server Remote Delete] Table: ${table}, ${column}=${value}, status: ${response.status}`);
    } catch (err) {
      console.warn(`[Supabase Server Delete Warning] Table ${table}:`, err);
    }
  }

  app.get("/api/get-clinical-data", (req, res) => {
    try {
      if (fs.existsSync(CLINICAL_DATA_FILE_PATH)) {
        const content = fs.readFileSync(CLINICAL_DATA_FILE_PATH, "utf-8");
        const parsed = JSON.parse(content);
        return res.json({
          patients: Array.isArray(parsed.patients) ? parsed.patients : [],
          assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          deleted_patient_ids: Array.isArray(parsed.deleted_patient_ids) ? parsed.deleted_patient_ids : [],
          deleted_assessment_ids: Array.isArray(parsed.deleted_assessment_ids) ? parsed.deleted_assessment_ids : [],
          deleted_order_ids: Array.isArray(parsed.deleted_order_ids) ? parsed.deleted_order_ids : []
        });
      }
      res.json({ patients: [], assessments: [], orders: [], deleted_patient_ids: [], deleted_assessment_ids: [], deleted_order_ids: [] });
    } catch (error) {
      console.error("Failed to read clinical data:", error);
      res.json({ patients: [], assessments: [], orders: [], deleted_patient_ids: [], deleted_assessment_ids: [], deleted_order_ids: [] });
    }
  });

  app.post("/api/save-clinical-data", (req, res) => {
    try {
      const { patients, assessments, orders } = req.body;

      let currentDeletedPatients: string[] = [];
      let currentDeletedAssessments: string[] = [];
      let currentDeletedOrders: string[] = [];

      if (fs.existsSync(CLINICAL_DATA_FILE_PATH)) {
        try {
          const content = fs.readFileSync(CLINICAL_DATA_FILE_PATH, "utf-8");
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.deleted_patient_ids)) currentDeletedPatients = parsed.deleted_patient_ids;
          if (Array.isArray(parsed.deleted_assessment_ids)) currentDeletedAssessments = parsed.deleted_assessment_ids;
          if (Array.isArray(parsed.deleted_order_ids)) currentDeletedOrders = parsed.deleted_order_ids;
        } catch {}
      }

      const delPatientSet = new Set(currentDeletedPatients.map(id => String(id).trim()));
      const delAsmSet = new Set(currentDeletedAssessments.map(id => String(id).trim()));
      const delOrderSet = new Set(currentDeletedOrders.map(id => String(id).trim()));

      const cleanPatients = Array.isArray(patients) 
        ? patients.filter((p: any) => p && p.id && !delPatientSet.has(String(p.id).trim())) 
        : [];
      
      const cleanAssessments = Array.isArray(assessments)
        ? assessments.filter((a: any) => a && a.id && !delAsmSet.has(String(a.id).trim()) && (!a.patient_id || !delPatientSet.has(String(a.patient_id).trim())))
        : [];

      const cleanOrders = Array.isArray(orders)
        ? orders.filter((o: any) => o && o.id && !delOrderSet.has(String(o.id).trim()) && (!o.patient_id || !delPatientSet.has(String(o.patient_id).trim())))
        : [];

      const dataToSave = {
        patients: cleanPatients,
        assessments: cleanAssessments,
        orders: cleanOrders,
        deleted_patient_ids: Array.from(delPatientSet),
        deleted_assessment_ids: Array.from(delAsmSet),
        deleted_order_ids: Array.from(delOrderSet),
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(CLINICAL_DATA_FILE_PATH, JSON.stringify(dataToSave, null, 2), "utf-8");
      res.json({ success: true, message: "Clinical data saved successfully on server." });
    } catch (error) {
      console.error("Failed to save clinical data on server:", error);
      res.status(500).json({ error: "Failed to save clinical data on server" });
    }
  });

  app.post("/api/delete-patient", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing patient id" });
      const targetId = String(id).trim();

      let currentDeletedPatients: string[] = [];
      let currentDeletedAssessments: string[] = [];
      let currentDeletedOrders: string[] = [];
      let existingPatients: any[] = [];
      let existingAssessments: any[] = [];
      let existingOrders: any[] = [];

      if (fs.existsSync(CLINICAL_DATA_FILE_PATH)) {
        try {
          const content = fs.readFileSync(CLINICAL_DATA_FILE_PATH, "utf-8");
          const current = JSON.parse(content);
          if (Array.isArray(current.patients)) existingPatients = current.patients;
          if (Array.isArray(current.assessments)) existingAssessments = current.assessments;
          if (Array.isArray(current.orders)) existingOrders = current.orders;
          if (Array.isArray(current.deleted_patient_ids)) currentDeletedPatients = current.deleted_patient_ids;
          if (Array.isArray(current.deleted_assessment_ids)) currentDeletedAssessments = current.deleted_assessment_ids;
          if (Array.isArray(current.deleted_order_ids)) currentDeletedOrders = current.deleted_order_ids;
        } catch {}
      }

      const delSet = new Set(currentDeletedPatients.map(x => String(x).trim()));
      delSet.add(targetId);

      const patients = existingPatients.filter((p: any) => p && String(p.id).trim() !== targetId);
      const assessments = existingAssessments.filter((a: any) => a && String(a.patient_id).trim() !== targetId);
      const orders = existingOrders.filter((o: any) => o && String(o.patient_id).trim() !== targetId);

      const updated = {
        patients,
        assessments,
        orders,
        deleted_patient_ids: Array.from(delSet),
        deleted_assessment_ids: currentDeletedAssessments,
        deleted_order_ids: currentDeletedOrders,
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(CLINICAL_DATA_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");

      // Cascade delete across all tables in remote Supabase database
      await Promise.allSettled([
        deleteFromSupabaseRemote("orders", "patient_id", targetId),
        deleteFromSupabaseRemote("assessments", "patient_id", targetId),
        deleteFromSupabaseRemote("measurements", "patient_id", targetId),
        deleteFromSupabaseRemote("clinical_assessments", "patient_id", targetId),
        deleteFromSupabaseRemote("patient_photos", "patient_id", targetId),
        deleteFromSupabaseRemote("patients", "id", targetId)
      ]);

      res.json({ success: true, message: "Patient permanently deleted from database and server persistence." });
    } catch (error) {
      console.error("Failed to delete patient on server:", error);
      res.status(500).json({ error: "Failed to delete patient on server" });
    }
  });

  app.post("/api/delete-assessment", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing assessment id" });
      const targetId = String(id).trim();

      let currentDeletedAssessments: string[] = [];
      let existing = { patients: [], assessments: [], orders: [], deleted_patient_ids: [], deleted_assessment_ids: [], deleted_order_ids: [] };

      if (fs.existsSync(CLINICAL_DATA_FILE_PATH)) {
        try {
          const content = fs.readFileSync(CLINICAL_DATA_FILE_PATH, "utf-8");
          existing = JSON.parse(content);
          if (Array.isArray(existing.deleted_assessment_ids)) currentDeletedAssessments = existing.deleted_assessment_ids;
        } catch {}
      }

      const delSet = new Set(currentDeletedAssessments.map(x => String(x).trim()));
      delSet.add(targetId);

      const assessments = Array.isArray(existing.assessments) ? existing.assessments.filter((a: any) => a && String(a.id).trim() !== targetId) : [];

      const updated = {
        ...existing,
        assessments,
        deleted_assessment_ids: Array.from(delSet),
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(CLINICAL_DATA_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");

      // Delete from remote Supabase database
      await deleteFromSupabaseRemote("assessments", "id", targetId);

      res.json({ success: true, message: "Assessment permanently deleted from database and server persistence." });
    } catch (error) {
      console.error("Failed to delete assessment on server:", error);
      res.status(500).json({ error: "Failed to delete assessment on server" });
    }
  });

  app.post("/api/delete-order", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing order id" });
      const targetId = String(id).trim();

      let currentDeletedOrders: string[] = [];
      let existing = { patients: [], assessments: [], orders: [], deleted_patient_ids: [], deleted_assessment_ids: [], deleted_order_ids: [] };

      if (fs.existsSync(CLINICAL_DATA_FILE_PATH)) {
        try {
          const content = fs.readFileSync(CLINICAL_DATA_FILE_PATH, "utf-8");
          existing = JSON.parse(content);
          if (Array.isArray(existing.deleted_order_ids)) currentDeletedOrders = existing.deleted_order_ids;
        } catch {}
      }

      const delSet = new Set(currentDeletedOrders.map(x => String(x).trim()));
      delSet.add(targetId);

      const orders = Array.isArray(existing.orders) ? existing.orders.filter((o: any) => o && String(o.id).trim() !== targetId) : [];

      const updated = {
        ...existing,
        orders,
        deleted_order_ids: Array.from(delSet),
        updated_at: new Date().toISOString()
      };
      fs.writeFileSync(CLINICAL_DATA_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");

      // Delete from remote Supabase database
      await deleteFromSupabaseRemote("orders", "id", targetId);

      res.json({ success: true, message: "Order permanently deleted from database and server persistence." });
    } catch (error) {
      console.error("Failed to delete order on server:", error);
      res.status(500).json({ error: "Failed to delete order on server" });
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
