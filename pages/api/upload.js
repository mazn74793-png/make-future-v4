import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // server-only
  );

  const file = req.body.file; // بيانات الفيديو
  const { data, error } = await supabase.storage
    .from('teacher-videos')
    .upload(`videos/${file.name}`, file);

  if (error) return res.status(500).json({ error });
  res.status(200).json(data);
}
