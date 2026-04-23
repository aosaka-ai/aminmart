import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  app.use(express.json());

  // API Route to delete image from Cloudinary
  app.post("/api/delete-image", async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "No image URL provided" });
    }

    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("Cloudinary API keys not configured. Skipping deletion.");
      return res.status(200).json({ message: "Cloudinary not configured, skipped deletion locally.", skipped: true });
    }

    try {
      // Extract public_id from Cloudinary URL
      // Format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[public_id].[ext]
      const parts = imageUrl.split('/');
      const lastPart = parts[parts.length - 1];
      const folderPart = parts[parts.length - 2];
      
      // If the image was uploaded with a folder, the public_id includes the folder
      // We need to handle nested folders if any, but our upload code uses one folder level.
      const publicIdWithExt = lastPart;
      const publicId = publicIdWithExt.split('.')[0];
      
      // Full public ID including folder if it exists in the URL
      // We check if the folder part is 'upload' (default) or something else
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex < parts.length - 2) {
        // Everything after v[version] or after 'upload' if no version
        const idParts = parts.slice(uploadIndex + 2); // skip 'upload' and 'v[version]'
        const fullPublicId = idParts.join('/').split('.')[0];
        console.log(`Attempting to delete Cloudinary image: ${fullPublicId}`);
        const result = await cloudinary.uploader.destroy(fullPublicId);
        return res.json({ result });
      }

      res.status(400).json({ error: "Could not parse Cloudinary URL" });
    } catch (error: any) {
      console.error("Cloudinary Deletion Error:", error);
      res.status(500).json({ error: error.message });
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
