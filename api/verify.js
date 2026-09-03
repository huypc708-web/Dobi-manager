import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Cho phép gọi CORS nếu cần
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, key, hwid, status, expires_at } = req.method === 'POST' ? req.body : req.query;

  try {
    // 1. Thêm key mới
    if (action === 'add') {
      const { data, error } = await supabase
        .from('keys')
        .insert([{ key, hwid: hwid || '', status: status || 'active', expires_at: expires_at || '' }]);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Thêm key thành công!' });
    }

    // 2. Lấy danh sách toàn bộ key (để hiện lên trang quản lý)
    if (action === 'list') {
      const { data, error } = await supabase.from('keys').select('*');
      if (error) throw error;
      return res.status(200).json({ success: true, keys: data });
    }

    // 3. Xóa key
    if (action === 'delete') {
      const { error } = await supabase.from('keys').delete().eq('key', key);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Xóa key thành công!' });
    }

    // 4. Xác thực key (Verify) cho ứng dụng/phần mềm của khách hàng
    if (action === 'verify') {
      const { data, error } = await supabase
        .from('keys')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) {
        return res.status(400).json({ success: false, message: 'Key không tồn tại!' });
      }

      if (data.status === 'banned') {
        return res.status(400).json({ success: false, message: 'Key đã bị khóa!' });
      }

      // Kiểm tra HWID (khóa máy) nếu có
      if (data.hwid && data.hwid !== hwid) {
        return res.status(400).json({ success: false, message: 'Key đã được kích hoạt trên thiết bị khác!' });
      }

      // Nếu chưa có HWID thì gán luôn HWID vào thiết bị hiện tại
      if (!data.hwid && hwid) {
        await supabase.from('keys').update({ hwid }).eq('key', key);
      }

      return res.status(200).json({ success: true, message: 'Xác thực thành công!' });
    }

    return res.status(400).json({ success: false, message: 'Hành động không hợp lệ!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
