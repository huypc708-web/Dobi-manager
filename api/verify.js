import { createClient } from '@supabase/supabase-js'

// Khởi tạo kết nối Supabase bằng biến môi trường trên Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { key } = req.query;

  if (!key) {
    return res.status(200).send("invalid");
  }

  try {
    // Truy vấn bảng chứa key trên Supabase (giả sử bảng của bạn tên là 'keys' và cột chứa key tên là 'key_string')
    const { data, error } = await supabase
      .from('keys')
      .select('*')
      .eq('key_string', key.trim())
      .single();

    if (error || !data) {
      return res.status(200).send("invalid"); // Key không tồn tại trên web
    }

    // Kiểm tra xem key đã bị khóa hoặc hết hạn chưa (nếu có cột status hoặc expires_at)
    if (data.status === 'banned' || data.status === 'expired') {
      return res.status(200).send("expired");
    }

    // Key hợp lệ tồn tại trên web -> Trả về success cho tool C# login
    return res.status(200).send("success");
    
  } catch (err) {
    return res.status(200).send("error");
  }
}
