import { randomBytes } from "crypto";
import path from "path";
import { supabase } from "./client.js";

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "application-files";

export function getFilePublicUrl(filePath) {
  if (!filePath) return null;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadApplicationFile(file, folder) {
  const extension = path.extname(file.originalname || "") || "";
  const objectPath = `${folder}/${Date.now()}-${randomBytes(8).toString("hex")}${extension}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    path: objectPath,
    originalName: file.originalname,
  };
}

export async function deleteStorageFile(filePath) {
  if (!filePath) return;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
  if (error) {
    throw new Error(error.message);
  }
}
