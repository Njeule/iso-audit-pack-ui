// /api/proxy.js
// Vercel Serverless Function
// Purpose: Hide n8n webhook URL + API key from the browser

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      message: "Method Not Allowed",
    });
  }

  // Read secrets from Vercel environment variables
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const apiKey = process.env.N8N_API_KEY; // optional

  if (!webhookUrl) {
    return res.status(500).json({
      ok: false,
      message: "N8N_WEBHOOK_URL is not configured",
    });
  }

  try {
    // Build headers for upstream n8n call
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    // Forward request to n8n
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text();

    // Return response exactly as n8n sent it
    res.status(upstream.status);
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json"
    );

    return res.send(text);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Proxy request failed",
      error: error.message,
    });
  }
}