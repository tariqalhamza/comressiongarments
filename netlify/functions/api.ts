import serverless from "serverless-http";
import dotenv from "dotenv";
import { createApiApp, getServiceRoleKey, getSupabaseUrl } from "../../server.ts";

dotenv.config();

let cachedHandler: any = null;

function getHandler() {
  if (!cachedHandler) {
    console.log("[Netlify Function: api] Initializing Express app with serverless-http...");
    const app = createApiApp();
    cachedHandler = serverless(app);
    console.log("[Netlify Function: api] Serverless handler successfully initialized.");
  }
  return cachedHandler;
}

export const handler = async (event: any, context: any) => {
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";
  const path = event.path || event.rawPath || "/";
  
  const hasServiceRoleKey = !!getServiceRoleKey();
  const hasSupabaseUrl = !!getSupabaseUrl();

  console.log(`[Netlify Function Started] Method: ${method}, Path: ${path}`);
  console.log(`[Netlify Function Env Check] hasServiceRoleKey: ${hasServiceRoleKey}, hasSupabaseUrl: ${hasSupabaseUrl}`);

  if (!hasServiceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is missing at Netlify Function runtime");
  }

  try {
    console.log(`[Netlify Route Handler Started] Method: ${method}, Path: ${path}`);
    const sls = getHandler();
    const result = await sls(event, context);
    console.log(`[Netlify Route Handler Completed] Method: ${method}, Path: ${path} -> Status: ${result?.statusCode}`);
    return result;
  } catch (error: any) {
    console.error(`[Netlify Function Error] Failed processing ${method} ${path}:`, error?.message || String(error));
    if (error?.stack) {
      console.error(`[Netlify Function Error Stack]:`, error.stack);
    }
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey"
      },
      body: JSON.stringify({
        error: "Serverless API Execution Error",
        message: error?.message || "Internal Server Error",
        path: path,
        method: method
      })
    };
  }
};


