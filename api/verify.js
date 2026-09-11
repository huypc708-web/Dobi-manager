import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Lấy toàn bộ dữ liệu trong bảng 'keys' để xem nó đang có cấu trúc thế nào
    const { data, error } = await supabase
      .from('keys')
      .select('*');

    if (error) {
      return res.status(200).send("DB Error: " + JSON.stringify(error));
    }

    // Trả về danh sách dạng chữ để đọc trực tiếp trên web
    return res.status(200).json({
      message: "Ket noi Supabase thanh cong!",
      total_keys: data.length,
      data: data
    });

  } catch (err) {
    return res.status(200).send("Exception: " + err.message);
  }
}
