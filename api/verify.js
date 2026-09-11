import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { key, hwid } = req.query;

  if (!key) {
    return res.status(200).send("invalid");
  }

  try {
    // Truy vấn kiểm tra key trong bảng 'keys' trên Supabase
    const { data, error } = await supabase
      .from('keys')
      .select('*')
      .eq('key_string', key.trim())
      .single();

    if (error || !data) {
      return res.status(200).send("invalid");
    }

    if (data.status === 'banned') {
      return res.status(200).send("banned");
    }

    if (data.status === 'active') {
      if (data.hwid === hwid) {
        return res.status(200).send("success");
      } else {
        return res.status(200).send("device_locked");
      }
    }

    if (data.status === 'unused' || !data.hwid) {
      const { error: updateError } = await supabase
        .from('keys')
        .update({ status: 'active', hwid: hwid })
        .eq('key_string', key.trim());

      if (updateError) {
        return res.status(200).send("error");
      }

      return res.status(200).send("success");
    }

    return res.status(200).send("invalid");

  } catch (err) {
    return res.status(200).send("error");
  }
}
