import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const PHOTO_MAX = 3 * 1024 * 1024;
const VIDEO_MAX = 25 * 1024 * 1024;

function safeName(name: string) {
  const extension = name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${crypto.randomUUID()}.${extension}`;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Session administrateur requise.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase serveur n’est pas configuré.' }, { status: 503 });

  const form = await request.formData();
  const file = form.get('file');
  const kind = form.get('kind') === 'video' ? 'video' : 'image';
  if (!(file instanceof File)) return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 });
  if (!file.type.startsWith(`${kind}/`)) return NextResponse.json({ error: 'Type de fichier incorrect.' }, { status: 415 });
  if (file.size > (kind === 'image' ? PHOTO_MAX : VIDEO_MAX)) {
    return NextResponse.json({ error: kind === 'image' ? 'Photo limitée à 3 Mo.' : 'Vidéo limitée à 25 Mo.' }, { status: 413 });
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'media';
  const path = `${kind === 'image' ? 'images' : 'videos'}/${safeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: `Échec Supabase : ${error.message}` }, { status: 502 });
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'Session administrateur requise.' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Supabase serveur n’est pas configuré.' }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === 'string' ? body.url : '';
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'media';
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index < 0) return NextResponse.json({ deleted: false });
  const path = decodeURIComponent(url.slice(index + marker.length));
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return NextResponse.json({ error: `Suppression impossible : ${error.message}` }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
