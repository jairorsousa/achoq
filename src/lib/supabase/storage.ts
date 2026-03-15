"use client";

import { supabase } from "./config";

const BUCKET = "event-images";

/**
 * Upload an image to Supabase Storage.
 * Returns the public URL on success, throws on failure.
 */
export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${eventId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete an event image from Supabase Storage.
 */
export async function deleteEventImage(imageUrl: string): Promise<void> {
  // Extract path from full URL
  const parts = imageUrl.split(`${BUCKET}/`);
  const path = parts[parts.length - 1];
  if (!path) return;

  await supabase.storage.from(BUCKET).remove([path]);
}
