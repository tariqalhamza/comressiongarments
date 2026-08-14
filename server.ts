import express from "express";
import path from "path";
import os from "os";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Helper to reliably read server-side environment variables regardless of deployment runtime (Node, Netlify Functions, Cloud Run)
export function getServiceRoleKey(): string {
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
            process.env.SUPABASE_SERVICE_KEY || 
            process.env.SERVICE_ROLE_KEY || 
            process.env.SUPABASE_SECRET_KEY || 
            "";
  key = key.trim();
  // Strip surrounding quotes if pasted with quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

export function getSupabaseUrl(): string {
  let url = process.env.VITE_SUPABASE_URL || 
            process.env.SUPABASE_URL || 
            "";
  url = url.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  let key = process.env.VITE_SUPABASE_ANON_KEY || 
            process.env.SUPABASE_ANON_KEY || 
            process.env.SUPABASE_KEY || 
            "";
  key = key.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

export function createApiApp() {
  const app = express();

  // CORS headers for serverless & browser API access
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Normalize paths for Netlify Functions rewrites (e.g., /.netlify/functions/api/admin/... -> /api/admin/...)
  app.use((req, res, next) => {
    if (req.url.startsWith("/.netlify/functions/api")) {
      req.url = req.url.replace(/^\/\.netlify\/functions\/api/, "/api") || "/api";
      // If result is /api/api/..., collapse it
      if (req.url.startsWith("/api/api/")) {
        req.url = req.url.replace("/api/api/", "/api/");
      }
    }
    // Also handle direct function mounts or rewrites missing /api prefix
    if (!req.url.startsWith("/api") && !req.url.startsWith("/@") && !req.url.startsWith("/src") && req.url !== "/" && !req.url.includes(".")) {
      const matchApi = ["/admin/", "/get-config", "/save-config", "/get-profiles", "/save-profiles", "/get-clinical-data", "/save-clinical-data", "/clinical-data", "/delete-", "/analyze-image", "/health"];
      if (matchApi.some(prefix => req.url.startsWith(prefix))) {
        req.url = "/api" + req.url;
      }
    }
    next();
  });

  // Server-side audit logging for API requests (strictly logs boolean flags for secret presence, never actual keys)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      const hasServiceRoleKey = !!getServiceRoleKey();
      const hasSupabaseUrl = !!getSupabaseUrl();
      console.log(`[API Request Started] Method: ${req.method}, Path: ${req.path}, hasServiceRoleKey: ${hasServiceRoleKey}, hasSupabaseUrl: ${hasSupabaseUrl}`);
      
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(`[API Request Completed] Method: ${req.method}, Path: ${req.path} -> Status: ${res.statusCode} (${duration}ms)`);
      });
    }
    next();
  });

  // Middleware for parsing large payloads (images and clinical data)
  app.use(express.json({ limit: '50mb' }));

  // Helper to determine writable file storage location across server and serverless environments
  const getWritableFilePath = (filename: string) => {
    const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
    if (isServerless) {
      return path.join(os.tmpdir(), filename);
    }
    return path.join(process.cwd(), filename);
  };

  // Atomic and retry-safe JSON file I/O helpers to prevent read-during-write races or partial reads
  const safeReadJson = (filePath: string) => {
    let targetPath = filePath;
    if (!fs.existsSync(targetPath)) {
      const tmpFallback = path.join(os.tmpdir(), path.basename(filePath));
      if (fs.existsSync(tmpFallback)) {
        targetPath = tmpFallback;
      } else {
        return null;
      }
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const content = fs.readFileSync(targetPath, "utf-8");
        if (!content || !content.trim()) {
          if (attempt < 2) {
            const start = Date.now();
            while (Date.now() - start < 50) {}
            continue;
          }
          return null;
        }
        return JSON.parse(content);
      } catch (err) {
        if (attempt < 2) {
          const start = Date.now();
          while (Date.now() - start < 50) {}
          continue;
        }
        const backupPath = filePath + ".bak";
        if (fs.existsSync(backupPath)) {
          try {
            const bakContent = fs.readFileSync(backupPath, "utf-8");
            return JSON.parse(bakContent);
          } catch {}
        }
        console.warn(`[safeReadJson] Error reading ${filePath}:`, err);
        return null;
      }
    }
    return null;
  };

  const safeWriteJson = (filePath: string, data: any) => {
    try {
      const tmpPath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const bakPath = filePath + ".bak";
      const strData = JSON.stringify(data, null, 2);

      fs.writeFileSync(tmpPath, strData, "utf-8");

      if (fs.existsSync(filePath)) {
        try {
          fs.copyFileSync(filePath, bakPath);
        } catch {}
      }

      fs.renameSync(tmpPath, filePath);
    } catch (err: any) {
      if (err && (err.code === 'EROFS' || err.code === 'EACCES')) {
        // In read-only serverless environment (Netlify Lambda), save to /tmp
        try {
          const tmpFallback = path.join(os.tmpdir(), path.basename(filePath));
          fs.writeFileSync(tmpFallback, JSON.stringify(data, null, 2), "utf-8");
        } catch (tmpErr) {
          console.warn("[safeWriteJson] Fallback write error:", tmpErr);
        }
      } else {
        console.warn(`[safeWriteJson] Error writing ${filePath}:`, err);
      }
    }
  };

  // Shared Database config read/write endpoints to sync credentials across all devices
  const CONFIG_FILE_PATH = getWritableFilePath("supabase-config.json");

  // Health check endpoint for server environment & variable verification
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasServiceRoleKey: !!getServiceRoleKey(),
      hasSupabaseUrl: !!getSupabaseUrl(),
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/get-config", (req, res) => {
    try {
      let config = { url: "", key: "" };
      const parsed = safeReadJson(CONFIG_FILE_PATH);
      if (parsed) config = parsed;
      
      // Fallback to server-side env vars if config file is empty
      const url = config.url || getSupabaseUrl() || "";
      const key = config.key || getSupabaseAnonKey() || "";
      
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
      
      safeWriteJson(CONFIG_FILE_PATH, config);
      
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
  const PROFILES_FILE_PATH = getWritableFilePath("clinical-profiles.json");

  const sanitizeProfilesList = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    
    // First map to sanitized object preserving genuine emails and UUIDs
    const mapped = list.map((p) => {
      if (!p || typeof p !== "object") return p;
      let email = (p.email || "").trim().toLowerCase();
      let password = p.password ? String(p.password).trim() : "";

      return {
        ...p,
        email,
        password
      };
    });

    // Deduplicate so there is strictly ONE row per unique Account ID (UUID)
    const dedupedMap = new Map();
    mapped.forEach((p) => {
      if (p && p.id) {
        const key = p.id;
        if (!dedupedMap.has(key)) {
          dedupedMap.set(key, p);
        } else {
          // Merge preserving fields
          const existing = dedupedMap.get(key);
          dedupedMap.set(key, { ...existing, ...p });
        }
      }
    });

    return Array.from(dedupedMap.values());
  };

  app.get("/api/get-profiles", (req, res) => {
    try {
      const profiles = safeReadJson(PROFILES_FILE_PATH) || [];
      const sanitized = sanitizeProfilesList(Array.isArray(profiles) ? profiles : []);
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
      safeWriteJson(PROFILES_FILE_PATH, sanitized);
      res.json({ success: true, message: "Clinical profiles updated successfully on server." });
    } catch (error) {
      console.error("Failed to save clinical profiles:", error);
      res.status(500).json({ error: "Failed to save clinical profiles on server" });
    }
  });

  // Clinical profiles helper for Supabase
  function getSupabaseServerClient(customConfig?: { url?: string; key?: string; serviceRoleKey?: string; token?: string }) {
    let url = (customConfig?.url || getSupabaseUrl() || "").trim();
    let anonKey = (customConfig?.key || getSupabaseAnonKey() || "").trim();
    let serviceRoleKey = (customConfig?.serviceRoleKey || getServiceRoleKey() || "").trim();

    if (fs.existsSync(CONFIG_FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (parsed.url && !url) url = parsed.url;
        if (parsed.key && !anonKey) anonKey = parsed.key;
        if (parsed.serviceRoleKey && !serviceRoleKey) serviceRoleKey = parsed.serviceRoleKey;
      } catch {}
    }

    const keyToUse = serviceRoleKey || anonKey;
    if (!url || !keyToUse || url.includes("placeholder") || url.includes("your_supabase_project_url")) {
      return null;
    }

    const globalHeaders: Record<string, string> = {};
    if (customConfig?.token && !serviceRoleKey) {
      globalHeaders["Authorization"] = `Bearer ${customConfig.token}`;
    }

    return {
      client: createClient(url, keyToUse, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: Object.keys(globalHeaders).length > 0 ? { headers: globalHeaders } : undefined
      }),
      isAdmin: !!serviceRoleKey,
      url,
      anonKey,
      serviceRoleKey,
      key: keyToUse,
      token: customConfig?.token
    };
  }

  // Admin Account Management: Create User in Supabase Auth and public.profiles
  app.post("/api/admin/create-user", async (req, res) => {
    try {
      const { email, password, full_name, role, clinic_id, supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey, adminToken, isDemo } = req.body;
      if (!email || !password || !full_name) {
        return res.status(400).json({ error: "Missing required fields (email, password, full_name)" });
      }

      const emailClean = email.toLowerCase().trim();
      const nameClean = full_name.trim();
      const passwordClean = password.trim();
      const roleClean = (role || "therapist").toLowerCase().trim();
      const clinicId = clinic_id || null;

      if (passwordClean.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      // 1. Resolve Supabase client
      const sb = getSupabaseServerClient({
        url: supabaseUrl,
        key: supabaseAnonKey,
        serviceRoleKey: supabaseServiceRoleKey,
        token: adminToken
      });

      // Handle pure offline / demo mode
      if (!sb) {
        if (isDemo) {
          const demoUserId = "demo-user-" + Math.random().toString(36).substring(2, 11);
          const demoProfile = {
            id: demoUserId,
            full_name: nameClean,
            role: roleClean,
            email: emailClean,
            password: passwordClean,
            clinic_id: clinicId,
            created_at: new Date().toISOString()
          };

          const existingProfiles = safeReadJson(PROFILES_FILE_PATH) || [];
          const filtered = Array.isArray(existingProfiles) 
            ? existingProfiles.filter(p => p && p.id !== demoUserId && (p.email || "").toLowerCase().trim() !== emailClean)
            : [];
          const updatedProfiles = sanitizeProfilesList([demoProfile, ...filtered]);
          safeWriteJson(PROFILES_FILE_PATH, updatedProfiles);

          return res.json({
            success: true,
            verified: true,
            user: demoProfile,
            message: `User ${nameClean} created in local offline demo mode.`
          });
        }

        return res.status(400).json({
          error: "Supabase connection is not configured on the server. Please verify your Supabase URL and Anon Key."
        });
      }

      let createdUserId: string | null = null;
      let authUserObject: any = null;
      let isExistingAuthUser = false;

      // 2. CHECK OR CREATE AUTH USER in auth.users
      if (sb.isAdmin) {
        try {
          // Check if user already exists in auth.users first (fetching up to 1000 users)
          const { data: listData } = await sb.client.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const existing = (listData?.users || []).find((u: any) => (u.email || '').toLowerCase().trim() === emailClean);
          if (existing) {
            console.log(`[Admin User Creation] User with email ${emailClean} already exists in auth.users (UUID: ${existing.id}). Preventing duplicate creation.`);
            return res.status(400).json({ error: `An account with email "${emailClean}" already exists in Supabase Auth.` });
          }
        } catch (findErr) {
          console.warn("User lookup in auth.users notice:", findErr);
        }

        if (!createdUserId) {
          try {
            const { data: adminData, error: adminErr } = await sb.client.auth.admin.createUser({
              email: emailClean,
              password: passwordClean,
              email_confirm: true,
              user_metadata: {
                full_name: nameClean,
                name: nameClean,
                role: roleClean,
                password: passwordClean
              }
            });

            if (adminErr) {
              const errMsg = (adminErr.message || '').toLowerCase();
              if (errMsg.includes('already registered') || errMsg.includes('email_exists') || errMsg.includes('already exists')) {
                return res.status(400).json({ error: `An account with email "${emailClean}" already exists in Supabase Auth.` });
              }
              console.error("Supabase Admin createUser error:", adminErr);
              return res.status(400).json({ error: `Supabase Auth error: ${adminErr.message}` });
            } else if (adminData?.user) {
              createdUserId = adminData.user.id;
              authUserObject = adminData.user;
            }
          } catch (e: any) {
            console.error("Admin createUser exception:", e);
            return res.status(500).json({ error: `Admin Auth creation failed: ${e.message}` });
          }
        }
      } else {
        // Anon key client mode
        const localProfiles = safeReadJson(PROFILES_FILE_PATH) || [];
        const localMatch = localProfiles.find(p => (p.email || '').toLowerCase().trim() === emailClean);

        try {
          const tempClient = createClient(sb.url, sb.anonKey || sb.key, {
            auth: { persistSession: false, autoRefreshToken: false }
          });

          const { data: signUpData, error: signUpErr } = await tempClient.auth.signUp({
            email: emailClean,
            password: passwordClean,
            options: {
              data: {
                full_name: nameClean,
                name: nameClean,
                role: roleClean,
                password: passwordClean
              }
            }
          });

          if (signUpData?.user?.id && (!signUpData.user.identities || signUpData.user.identities.length > 0)) {
            createdUserId = signUpData.user.id;
            authUserObject = signUpData.user;
          } else if (signUpErr || (signUpData?.user && signUpData.user.identities?.length === 0)) {
            const errMsg = (signUpErr?.message || '').toLowerCase();
            const isAlreadyReg = errMsg.includes('already registered') || errMsg.includes('email_exists') || (signUpData?.user && signUpData.user.identities?.length === 0);

            if (isAlreadyReg) {
              // Existing Auth user
              if (localMatch?.id) {
                createdUserId = localMatch.id;
                isExistingAuthUser = true;
              } else {
                // Try credentials check to discover UUID without changing password
                try {
                  const { data: signInData } = await tempClient.auth.signInWithPassword({
                    email: emailClean,
                    password: passwordClean
                  });
                  if (signInData?.user?.id) {
                    createdUserId = signInData.user.id;
                    authUserObject = signInData.user;
                    isExistingAuthUser = true;
                  }
                } catch {}
              }
            }

            if (!createdUserId) {
              if (signUpErr) {
                return res.status(400).json({ error: `Supabase Auth signUp failed: ${signUpErr.message}` });
              }
            }
          }
        } catch (e: any) {
          console.error("SignUp exception:", e);
          return res.status(500).json({ error: `Auth registration failed: ${e.message}` });
        }
      }

      if (!createdUserId) {
        return res.status(400).json({ error: "Supabase Auth did not return a valid user ID." });
      }

      const insertClient = sb.client;

      // 3. CHECK public.profiles FOR EXISTING PROFILE RECORD
      let existingProfileInDb: any = null;
      try {
        const { data: found } = await insertClient
          .from("profiles")
          .select("*")
          .eq("id", createdUserId)
          .maybeSingle();
        if (found) existingProfileInDb = found;
      } catch (checkErr) {
        console.warn("Profile lookup check notice:", checkErr);
      }

      // CASE 1: User exists in auth.users AND profile exists in public.profiles
      if (isExistingAuthUser && existingProfileInDb) {
        console.log(`[Admin User Creation] Case 1: User ${emailClean} already exists in auth.users & public.profiles.`);
        
        const resolvedProfile = {
          id: createdUserId,
          full_name: existingProfileInDb.full_name || nameClean,
          role: existingProfileInDb.role || roleClean,
          email: emailClean,
          password: passwordClean,
          ...existingProfileInDb,
          created_at: existingProfileInDb.created_at || new Date().toISOString()
        };

        // Update clinical-profiles.json
        const existingProfiles = safeReadJson(PROFILES_FILE_PATH) || [];
        const filtered = Array.isArray(existingProfiles) 
          ? existingProfiles.filter(p => p && p.id !== createdUserId && (p.email || "").toLowerCase().trim() !== emailClean)
          : [];
        const updatedProfiles = sanitizeProfilesList([resolvedProfile, ...filtered]);
        safeWriteJson(PROFILES_FILE_PATH, updatedProfiles);

        return res.json({
          success: true,
          verified: true,
          already_exists: true,
          user: resolvedProfile,
          message: `User account "${emailClean}" already exists in Supabase Authentication and public.profiles. Synchronized successfully without modifying existing login credentials.`
        });
      }

      // CASE 2 OR NEW USER: Create / Repair missing public.profiles record
      console.log(`[Admin User Creation] ${isExistingAuthUser ? 'Case 2: Repairing missing profile for existing user' : 'Creating profile for new user'}: UUID ${createdUserId}`);
      
      const primaryProfilePayload: any = {
        id: createdUserId,
        full_name: nameClean,
        role: roleClean,
        clinic_id: clinicId
      };

      let profileInsertError: any = null;
      try {
        const { error: upsertErr } = await insertClient
          .from("profiles")
          .upsert(primaryProfilePayload, { onConflict: "id" });

        if (upsertErr) {
          console.warn("Primary profile upsert warning:", upsertErr.message);
          profileInsertError = upsertErr;
        }
      } catch (pe: any) {
        console.error("Profile insert exception:", pe);
        profileInsertError = pe;
      }

      // If table supports email or password columns, try to enrich them gracefully
      try {
        await insertClient
          .from("profiles")
          .update({ email: emailClean, password: passwordClean })
          .eq("id", createdUserId);
      } catch {}

      // 4. VERIFY PROFILE CREATION IN public.profiles
      let verifiedProfile: any = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          let { data: foundProfile } = await insertClient
            .from("profiles")
            .select("*")
            .eq("id", createdUserId)
            .maybeSingle();

          if (!foundProfile) {
            const uuidQuery = await insertClient
              .from("profiles")
              .select("*")
              .eq("uuid", createdUserId)
              .maybeSingle();
            if (uuidQuery.data) foundProfile = uuidQuery.data;
          }

          if (foundProfile && (foundProfile.id === createdUserId || foundProfile.uuid === createdUserId)) {
            verifiedProfile = foundProfile;
            console.log(`[Admin User Creation] Step 2: Verified profile in public.profiles:`, verifiedProfile.id || verifiedProfile.uuid);
            break;
          }
        } catch (qe) {
          console.warn(`Profile verification query attempt ${attempt} notice:`, qe);
        }

        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }

      // 5. HANDLE VERIFICATION FAILURE - DO NOT SHOW FAKE SUCCESS
      if (!verifiedProfile) {
        const errorDetail = profileInsertError?.message || "Profile record was not found in public.profiles table after insertion. Please verify Row Level Security policies or run supabase-schema.sql.";
        console.error(`[Admin User Creation] FAILED: Auth user (${createdUserId}), but profile was NOT created/verified in public.profiles.`);
        
        return res.status(500).json({
          error: isExistingAuthUser
            ? `Existing Auth account was preserved (UUID: ${createdUserId}), but public.profiles record could not be created/verified. Supabase Error: ${errorDetail}`
            : `User account was created in Supabase Auth (Auth UUID: ${createdUserId}), but profile creation in public.profiles failed or could not be verified. Supabase Error: ${errorDetail}`,
          authUserId: createdUserId,
          partialFailure: true
        });
      }

      // 6. SUCCESS CONFIRMED: Update local backup and respond
      const finalProfile = {
        id: createdUserId,
        full_name: nameClean,
        role: roleClean,
        email: emailClean,
        password: passwordClean,
        ...verifiedProfile,
        created_at: verifiedProfile.created_at || new Date().toISOString()
      };

      // Update clinical-profiles.json
      let existingProfiles: any[] = [];
      if (fs.existsSync(PROFILES_FILE_PATH)) {
        try {
          const content = fs.readFileSync(PROFILES_FILE_PATH, "utf-8");
          existingProfiles = JSON.parse(content);
        } catch {}
      }
      const filtered = Array.isArray(existingProfiles) 
        ? existingProfiles.filter(p => p && p.id !== createdUserId && (p.email || "").toLowerCase().trim() !== emailClean)
        : [];
      const updatedProfiles = sanitizeProfilesList([finalProfile, ...filtered]);
      fs.writeFileSync(PROFILES_FILE_PATH, JSON.stringify(updatedProfiles, null, 2), "utf-8");

      res.json({
        success: true,
        verified: true,
        repaired: isExistingAuthUser,
        user: finalProfile,
        message: isExistingAuthUser
          ? `Existing Supabase Auth account found (UUID: ${createdUserId}). Successfully created and verified missing public.profiles record for ${nameClean} (${emailClean})!`
          : `User ${nameClean} (${emailClean}) successfully created in Supabase Auth and confirmed in public.profiles!`
      });
    } catch (error: any) {
      console.error("Failed to create user on server:", error);
      res.status(500).json({ error: error.message || "Failed to create user account" });
    }
  });

  // Admin Account Management: Auto-Synchronize and Repair All Auth Accounts & Profiles
  app.post("/api/admin/sync-accounts", async (req, res) => {
    try {
      const { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey, adminToken } = req.body;
      const sb = getSupabaseServerClient({
        url: supabaseUrl,
        key: supabaseAnonKey,
        serviceRoleKey: supabaseServiceRoleKey,
        token: adminToken
      });

      const localProfiles = safeReadJson(PROFILES_FILE_PATH) || [];

      if (!sb) {
        return res.json({
          success: true,
          count: localProfiles.length,
          profiles: localProfiles,
          message: "Local profiles loaded (Offline/Demo Mode)."
        });
      }

      // 1. Fetch DB profiles from public.profiles
      const { data: dbProfiles } = await sb.client.from("profiles").select("*");
      const dbProfilesList = dbProfiles || [];
      const dbProfileMap = new Map<string, any>();
      
      // Clean up any stale duplicate admin profiles in DB if present
      for (const p of dbProfilesList) {
        if (p?.id) {
          const isStaleAdmin = (p.id === '2eef0ed7-079c-4ca6-bad5-9c24b22de97e') || 
            (p.role === 'admin' && p.id !== '9905a6da-912f-4cf0-8dfc-cc108d224ed8' && p.id !== 'demo-user-123');
          if (isStaleAdmin) {
            try {
              await sb.client.from("profiles").delete().eq("id", p.id);
            } catch {}
          } else {
            dbProfileMap.set(p.id, p);
          }
        }
      }

      // 2. If Admin key available, query auth.users to find all real Auth accounts
      let authUsers: any[] = [];
      if (sb.isAdmin) {
        try {
          const { data: listData } = await sb.client.auth.admin.listUsers({ page: 1, perPage: 1000 });
          authUsers = listData?.users || [];
        } catch (authListErr) {
          console.warn("Could not list auth users in sync endpoint:", authListErr);
        }
      }

      // 3. For any auth user missing in public.profiles, create their profile with SAME UUID
      for (const au of authUsers) {
        if (au && au.id) {
          const fallbackName = au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split('@')[0] : 'Clinical User');
          const fallbackRole = au.user_metadata?.role || (au.email === 'mehmood@gmail.com' ? 'admin' : 'therapist');
          try {
            if (!dbProfileMap.has(au.id)) {
              const { error: createProfErr } = await sb.client.from("profiles").upsert({
                id: au.id,
                full_name: fallbackName,
                role: fallbackRole,
                clinic_id: null
              }, { onConflict: "id" });

              if (!createProfErr) {
                dbProfileMap.set(au.id, {
                  id: au.id,
                  full_name: fallbackName,
                  role: fallbackRole,
                  clinic_id: null,
                  created_at: au.created_at || new Date().toISOString()
                });
              }
            }
          } catch {}
        }
      }

      // 4. Build synchronized list based STRICTLY on real Supabase Auth users (and public.profiles)
      // DO NOT resurrect deleted users from local storage or cached files!
      const accountMap = new Map<string, any>();
      const authEmailMap = new Map<string, any>();
      for (const au of authUsers) {
        if (au && au.email) {
          authEmailMap.set(au.email.toLowerCase().trim(), au);
        }
      }

      // 1) Auth users are the canonical source of truth for accounts
      for (const au of authUsers) {
        if (au && au.id) {
          const dbP = dbProfileMap.get(au.id);
          const localMatch = localProfiles.find((lp: any) => lp && (lp.id === au.id || (lp.email && au.email && lp.email.toLowerCase().trim() === au.email.toLowerCase().trim())));

          const fallbackName = dbP?.full_name || au.user_metadata?.full_name || au.user_metadata?.name || localMatch?.full_name || (au.email ? au.email.split('@')[0] : 'Clinical User');
          const fallbackRole = dbP?.role || au.user_metadata?.role || localMatch?.role || (au.email === 'mehmood@gmail.com' ? 'admin' : 'therapist');
          
          // Determine the user's plain-text password for Manage Accounts display
          const auPassword = au.user_metadata?.password ? String(au.user_metadata.password).trim() : '';
          const localPassword = localMatch?.password ? String(localMatch.password).trim() : '';
          const dbPassword = dbP?.password ? String(dbP.password).trim() : '';
          const resolvedPassword = auPassword || localPassword || dbPassword || '';

          accountMap.set(au.id, {
            id: au.id,
            email: au.email || dbP?.email || localMatch?.email || '',
            full_name: fallbackName,
            role: fallbackRole,
            password: resolvedPassword,
            clinic_id: dbP?.clinic_id || null,
            created_at: au.created_at || dbP?.created_at || new Date().toISOString()
          });
        }
      }

      // 2) DB profiles (when authUsers list was empty or user is only in public.profiles)
      dbProfileMap.forEach((dbP, id) => {
        if (id && !accountMap.has(id)) {
          // If auth users were retrieved, but this dbProfile does not exist in authUsers, check if auth user exists
          const dbEmailClean = (dbP.email || '').toLowerCase().trim();
          const authMatch = dbEmailClean ? authEmailMap.get(dbEmailClean) : null;
          if (authMatch) {
            const existing = accountMap.get(authMatch.id) || {};
            accountMap.set(authMatch.id, {
              ...existing,
              ...dbP,
              id: authMatch.id,
              email: authMatch.email,
              full_name: dbP.full_name || existing.full_name || 'Clinical User',
              role: dbP.role || existing.role || 'therapist'
            });
          } else if (authUsers.length === 0) {
            // When Service Role Key is not used and auth listing is unavailable, use DB profiles as source of truth
            const localMatch = localProfiles.find((lp: any) => lp && (lp.id === id || (lp.email && dbP.email && lp.email.toLowerCase().trim() === dbP.email.toLowerCase().trim())));
            const resolvedPassword = localMatch?.password || dbP?.password || '';
            accountMap.set(id, {
              id,
              email: dbP.email || localMatch?.email || '',
              full_name: dbP.full_name || localMatch?.full_name || 'Clinical User',
              role: dbP.role || localMatch?.role || 'therapist',
              password: resolvedPassword,
              clinic_id: dbP.clinic_id || null,
              created_at: dbP.created_at || new Date().toISOString()
            });
          }
        }
      });

      // Note: We deliberately DO NOT loop over localProfiles to add orphaned users.
      // Supabase is the strict single source of truth.

      const combined = Array.from(accountMap.values());

      // Write strictly active profiles to clinical-profiles.json (purging any deleted users)
      const sanitized = sanitizeProfilesList(combined);
      safeWriteJson(PROFILES_FILE_PATH, sanitized);

      res.json({
        success: true,
        count: sanitized.length,
        profiles: sanitized,
        message: "Clinical accounts and public.profiles synchronized successfully."
      });
    } catch (err: any) {
      console.error("Error in /api/admin/sync-accounts:", err);
      res.status(500).json({ error: err.message || "Failed to synchronize accounts" });
    }
  });

  // Admin Account Management: Update User Password via Supabase Auth Admin API
  app.post("/api/admin/update-user-password", async (req, res) => {
    try {
      const { userId, email, password, supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey, adminToken } = req.body;
      if (!userId || !password) {
        return res.status(400).json({ error: "Missing required fields: userId and password are required." });
      }

      const passwordClean = String(password).trim();
      const userUuid = String(userId).trim();

      const serviceRoleKey = (supabaseServiceRoleKey || getServiceRoleKey() || "").trim();

      const sb = getSupabaseServerClient({
        url: supabaseUrl,
        key: supabaseAnonKey,
        serviceRoleKey: serviceRoleKey,
        token: adminToken
      });

      if (!sb) {
        return res.status(500).json({ error: "Supabase server client not configured" });
      }

      if (!sb.isAdmin) {
        return res.status(400).json({ 
          error: "Service Role Key is missing on the server. Unable to update password in Supabase Auth. Please configure SUPABASE_SERVICE_ROLE_KEY in your server environment." 
        });
      }

      // Fetch existing user metadata so we preserve other fields while storing updated password
      let currentMetadata: any = {};
      try {
        const { data: uData } = await sb.client.auth.admin.getUserById(userUuid);
        if (uData?.user?.user_metadata) {
          currentMetadata = uData.user.user_metadata;
        }
      } catch (getMetaErr) {
        console.warn("[Admin Update Password] getUserById notice:", getMetaErr);
      }

      // Execute Supabase Auth Admin API updateUserById
      const updatedMetadata = { ...currentMetadata, password: passwordClean };
      const { data: adminData, error: adminErr } = await sb.client.auth.admin.updateUserById(userUuid, {
        password: passwordClean,
        user_metadata: updatedMetadata
      });

      if (adminErr) {
        console.error(`[Supabase Auth Admin] Error resetting password for user UUID ${userUuid}:`, adminErr.message);
        return res.status(400).json({ error: adminErr.message });
      }

      console.log(`[Supabase Auth Admin] Successfully updated password via admin.updateUserById for user UUID: ${userUuid}`);

      // Try updating public.profiles password column if available
      try {
        await sb.client.from("profiles").update({ password: passwordClean }).eq("id", userUuid);
      } catch {}

      // Sync persistent server profiles (clinical-profiles.json) so Manage Accounts reflects new password on refresh/reload
      const existingProfiles = safeReadJson(PROFILES_FILE_PATH);
      let foundInFile = false;
      const updated = (Array.isArray(existingProfiles) ? existingProfiles : []).map((p: any) => {
        if (p && (p.id === userUuid || String(p.id).trim() === userUuid)) {
          foundInFile = true;
          return { ...p, password: passwordClean };
        }
        return p;
      });
      if (!foundInFile) {
        updated.push({
          id: userUuid,
          email: email || '',
          password: passwordClean
        });
      }
      safeWriteJson(PROFILES_FILE_PATH, sanitizeProfilesList(updated));

      return res.json({
        success: true,
        message: "Supabase Auth password successfully updated via Admin API.",
        user: adminData.user,
        newPassword: passwordClean
      });
    } catch (err: any) {
      console.error("Error in /api/admin/update-user-password:", err);
      res.status(500).json({ error: err.message || "Failed to update user password" });
    }
  });

  // Admin Account Management: Delete User
  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const { userId, supabaseUrl, supabaseServiceRoleKey } = req.body;
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: "Missing or invalid userId UUID" });
      }

      const cleanUserId = userId.trim();

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUuid = (str: string) => typeof str === 'string' && UUID_REGEX.test(str.trim());

      if (!isUuid(cleanUserId)) {
        return res.status(400).json({ error: "Invalid userId: User deletion requires a valid auth.users.id UUID." });
      }

      if (cleanUserId === '9905a6da-912f-4cf0-8dfc-cc108d224ed8' || cleanUserId === 'demo-user-123') {
        return res.status(403).json({ error: "The primary Administrator account cannot be deleted." });
      }

      // Dedicated Supabase Admin client initialized ONLY with URL and Service Role Key (no user JWT/access tokens)
      let url = (supabaseUrl || getSupabaseUrl() || "").trim();
      let serviceRoleKey = (supabaseServiceRoleKey || getServiceRoleKey() || "").trim();

      if (fs.existsSync(CONFIG_FILE_PATH)) {
        try {
          const fileContent = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
          const parsed = JSON.parse(fileContent);
          if (parsed.url && !url) url = parsed.url;
          if (parsed.serviceRoleKey && !serviceRoleKey) serviceRoleKey = parsed.serviceRoleKey;
        } catch {}
      }

      if (!url || !serviceRoleKey) {
        return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is required on server for Auth deletion." });
      }

      // Pure Admin client strictly for Auth Admin API operations
      const adminClient = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      // Check if user is primary administrator by email
      try {
        const { data: userData } = await adminClient.auth.admin.getUserById(cleanUserId);
        if (userData?.user?.email) {
          const emLower = userData.user.email.toLowerCase().trim();
          if (emLower === 'mehmood@gmail.com' || emLower === 'detox16277@gmail.com') {
            return res.status(403).json({ error: "The primary Administrator account cannot be deleted." });
          }
        }
      } catch (getErr) {
        console.warn("[Admin Delete User] getUserById pre-check notice:", getErr);
      }

      // 1. Delete exact Supabase Auth user using dedicated Admin API
      console.log(`[Admin Delete User] Attempting auth.admin.deleteUser for UUID: ${cleanUserId}`);
      const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(cleanUserId);
      if (deleteAuthErr) {
        const errStr = (deleteAuthErr.message || '').toLowerCase();
        const isNotFound = errStr.includes("not found") || (deleteAuthErr as any).status === 404;
        if (!isNotFound) {
          console.error(`[Admin Delete User] Error deleting user UUID ${cleanUserId} in Supabase Auth:`, deleteAuthErr.message);
          return res.status(400).json({ error: deleteAuthErr.message || "Failed to delete user in Supabase Auth" });
        } else {
          console.log(`[Admin Delete User] User UUID ${cleanUserId} not found in Auth (already deleted). Proceeding with public.profiles cleanup.`);
        }
      }

      // 2. Verify that the user no longer exists in Supabase Auth using getUserById
      try {
        const { data: verifyAuthData, error: verifyAuthErr } = await adminClient.auth.admin.getUserById(cleanUserId);
        if (!verifyAuthErr && verifyAuthData?.user) {
          console.error(`[Admin Delete User] Auth deletion verification failed: User ${cleanUserId} still exists in Supabase Auth.`);
          return res.status(400).json({ error: "Verification failed: User still exists in Supabase Auth after deletion attempt." });
        }
      } catch (vErr: any) {
        console.warn(`[Admin Delete User] Auth post-deletion check notice for ${cleanUserId}:`, vErr?.message);
      }

      // 3. ONLY after successful Auth deletion, delete the matching public.profiles record strictly by UUID
      console.log(`[Admin Delete User] Auth deletion confirmed for ${cleanUserId}. Deleting matching public.profiles row...`);
      const { error: deleteProfileErr } = await adminClient.from("profiles").delete().eq("id", cleanUserId);
      if (deleteProfileErr) {
        console.warn(`[Admin Delete User] public.profiles deletion notice for ${cleanUserId}:`, deleteProfileErr.message);
      }

      // 4. Update clinical-profiles.json persistence strictly by UUID
      const existingToDelete = safeReadJson(PROFILES_FILE_PATH);
      if (Array.isArray(existingToDelete)) {
        const updated = existingToDelete.filter(p => p && p.id !== cleanUserId && String(p.id).trim() !== cleanUserId);
        safeWriteJson(PROFILES_FILE_PATH, sanitizeProfilesList(updated));
      }

      console.log(`[Admin Delete User] Successfully deleted user UUID ${cleanUserId} from Supabase Auth and public.profiles.`);

      return res.json({ success: true, message: "User deleted successfully from Supabase Auth and public.profiles." });
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  // Clinical data (patients, assessments, orders) server persistence endpoints
  const CLINICAL_DATA_FILE_PATH = getWritableFilePath("clinical-data.json");

  // Helper to execute direct remote Supabase REST deletions from the backend
  async function deleteFromSupabaseRemote(table: string, column: string, value: string) {
    try {
      let url = getSupabaseUrl() || "";
      let key = getSupabaseAnonKey() || getServiceRoleKey() || "";
      
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
      const parsed = safeReadJson(CLINICAL_DATA_FILE_PATH);
      if (parsed) {
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

      const parsed = safeReadJson(CLINICAL_DATA_FILE_PATH);
      if (parsed) {
        if (Array.isArray(parsed.deleted_patient_ids)) currentDeletedPatients = parsed.deleted_patient_ids;
        if (Array.isArray(parsed.deleted_assessment_ids)) currentDeletedAssessments = parsed.deleted_assessment_ids;
        if (Array.isArray(parsed.deleted_order_ids)) currentDeletedOrders = parsed.deleted_order_ids;
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
      safeWriteJson(CLINICAL_DATA_FILE_PATH, dataToSave);
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

      const current = safeReadJson(CLINICAL_DATA_FILE_PATH);
      if (current) {
        if (Array.isArray(current.patients)) existingPatients = current.patients;
        if (Array.isArray(current.assessments)) existingAssessments = current.assessments;
        if (Array.isArray(current.orders)) existingOrders = current.orders;
        if (Array.isArray(current.deleted_patient_ids)) currentDeletedPatients = current.deleted_patient_ids;
        if (Array.isArray(current.deleted_assessment_ids)) currentDeletedAssessments = current.deleted_assessment_ids;
        if (Array.isArray(current.deleted_order_ids)) currentDeletedOrders = current.deleted_order_ids;
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
      safeWriteJson(CLINICAL_DATA_FILE_PATH, updated);

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
      let existing: any = { patients: [], assessments: [], orders: [], deleted_patient_ids: [], deleted_assessment_ids: [], deleted_order_ids: [] };

      const parsed = safeReadJson(CLINICAL_DATA_FILE_PATH);
      if (parsed) {
        existing = parsed;
        if (Array.isArray(existing.deleted_assessment_ids)) currentDeletedAssessments = existing.deleted_assessment_ids;
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
      safeWriteJson(CLINICAL_DATA_FILE_PATH, updated);

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
      let existing: any = { patients: [], assessments: [], orders: [], deleted_patient_ids: [], deleted_assessment_ids: [], deleted_order_ids: [] };

      const parsed = safeReadJson(CLINICAL_DATA_FILE_PATH);
      if (parsed) {
        existing = parsed;
        if (Array.isArray(existing.deleted_order_ids)) currentDeletedOrders = existing.deleted_order_ids;
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
      safeWriteJson(CLINICAL_DATA_FILE_PATH, updated);

      // Delete from remote Supabase database
      await deleteFromSupabaseRemote("orders", "id", targetId);

      res.json({ success: true, message: "Order permanently deleted from database and server persistence." });
    } catch (error) {
      console.error("Failed to delete order on server:", error);
      res.status(500).json({ error: "Failed to delete order on server" });
    }
  });

  // Lazy Gemini Initialization
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || "",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

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

      const ai = getGeminiClient();
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

  return app;
}

export const app = createApiApp();

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

// Only start standalone server listener when directly executing server.ts/server.cjs and NOT inside a serverless runtime
const isServerlessEnv = !!(
  process.env.NETLIFY || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT || 
  process.env.NETLIFY_FUNCTIONS ||
  process.env.SERVERLESS
);

const isDirectExecution = !!(
  process.argv[1] && 
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs') || process.argv[1].endsWith('server.js'))
);

if (isDirectExecution && !isServerlessEnv) {
  startServer();
}
