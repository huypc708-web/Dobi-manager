import { createClient } from '@supabase/supabase-js'

// Khởi tạo kết nối Supabase bằng biến môi trường trên Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  const { key, hwid } = req.query;

  if (!key) {
    return res.status(400).json({ message: "Thiếu Key bản quyền!" });
  }

  // 1. Truy vấn tìm key trong database Supabase
  // (Lưu ý: Đổi chữ 'licenses' thành tên bảng chứa key thực tế trong Supabase của bạn nếu khác)
  const { data, error } = await supabase
    .from('licenses') 
    .select('*')
    .eq('key', key);

  if (error || !data || data.length === 0) {
    return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
  }

  const keyData = data[0];

  // 2. Kiểm tra nếu key bị ban
  if (keyData.status === 'banned') {
    return res.status(400).json({ message: "banned" });
  }

  let currentHwid = keyData.hwid;

  // 3. XĂM LĂNG / TỰ ĐỘNG GÁN HWID (QUAN TRỌNG NHẤT)
  // Nếu key mới tạo (chưa liên kết thiết bị, hwid trống hoặc là "none")
  if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
    
    // Tiến hành cập nhật HWID của máy đang đăng nhập vào database và đổi trạng thái thành active
    const { error: updateError } = await supabase
      .from('licenses')
      .update({ 
        hwid: hwid, 
        status: 'active' 
      })
      .eq('key', key);

    if (updateError) {
      return res.status(500).json({ message: "Lỗi cập nhật thiết bị lên database!" });
    }

    // Cập nhật lại dữ liệu trả về cho client
    keyData.hwid = hwid;
    keyData.status = 'active';
  } 
  else if (currentHwid !== hwid) {
    // 4. Nếu key đã có HWID rồi mà khác với máy đang đăng nhập -> Chặn lại
    return res.status(400).json({ message: "device_locked" });
  }

  // 5. Trả về kết quả thành công cho phần mềm C#
  return res.status(200).json({
    message: "Ket noi Supabase thanh cong!",
    total_keys: 1,
    data: [keyData]
  });
}
