import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Nhận key và mã thiết bị (hwid) từ tool C# gửi lên
  const { key, hwid } = req.query;

  if (!key) {
    return res.status(200).send("invalid");
  }

  try {
    // 1. Kiểm tra xem key có tồn tại trong hệ thống web không
    const { data, error } = await supabase
      .from('keys')
      .select('*')
      .eq('key_string', key.trim())
      .single();

    if (error || !data) {
      return res.status(200).send("invalid"); // Key không tồn tại
    }

    // 2. Kiểm tra nếu key đã bị khóa
    if (data.status === 'banned') {
      return res.status(200).send("banned");
    }

    // 3. Kiểm tra xem key đã được kích hoạt cho thiết bị khác chưa
    if (data.status === 'active') {
      // Nếu key đã kích hoạt nhưng đúng là cái thiết bị (hwid) này đang dùng thì cho qua
      if (data.hwid === hwid) {
        return res.status(200).send("success");
      } else {
        return res.status(200).send("device_locked"); // Khóa đã bị gắn với máy khác
      }
    }

    // 4. Nếu key chưa được sử dụng lần nào (chưa có thiết bị nào gắn)
    if (data.status === 'unused' || !data.hwid) {
      // Khóa key này lại với HWID của thiết bị hiện tại
      const { updateError } = await supabase
        .from('keys')
        .update({ status: 'active', hwid: hwid })
        .eq('key_string', key.trim());

      if (updateError) {
        return res.status(200).send("error");
      }

      return res.status(200).send("success"); // Kích hoạt thành công lần đầu
    }

    return res.status(200).send("invalid");

  } catch (err) {
    return res.status(200).send("error");
  }
}
