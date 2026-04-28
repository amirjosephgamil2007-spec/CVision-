import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import * as url from "url";
import mammoth from "mammoth";

// For __dirname in ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // We need to increase the payload size limit since CVs can be slightly large
  app.use(express.json({ limit: "50mb" }));

  // API route
  app.post("/api/extract-text", async (req, res) => {
    try {
      const { fileName, fileData, mimeType } = req.body;

      if (!fileData) {
        return res.status(400).json({ error: "Missing file data." });
      }

      const base64Data = fileData.split(",")[1] || fileData;
      let finalMimeType = mimeType;
      let finalData = base64Data;
      
      const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.toLowerCase().endsWith(".docx");

      if (isDocx) {
        const buffer = Buffer.from(base64Data, "base64");
        const result = await mammoth.extractRawText({ buffer });
        finalData = Buffer.from(result.value).toString("base64");
        finalMimeType = "text/plain";
      } else if (!["application/pdf", "text/plain", "text/csv"].includes(mimeType)) {
        finalMimeType = "text/plain";
      }

      res.json({ base64Data: finalData, mimeType: finalMimeType });

    } catch (error: any) {
      console.error("Extraction Error:", error);
      res.status(500).json({ error: "Failed to extract text." });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
