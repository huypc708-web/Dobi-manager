import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Truy vấn vào bảng 'license_keys'
    const { data, error } = await supabase
      .from('license_keys')
      .select('*')
      .eq('license_keys', key);

    if (error) {
      return res.status(500).json({ message: "Lỗi truy vấn Database: " + error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống web!" });
    }

    const keyData = data[0];

    // Kiểm tra trạng thái bị ban
    if (keyData.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    let currentHwid = keyData.hwid;

    // Tự động gán HWID (Auto-bind) ngay lần đăng nhập đầu tiên
    if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
      const { error: updateError } = await supabase
        .from('license_keys')
        .update({ 
          hwid: hwid || "default_hwid", 
          status: 'active' 
        })
        .eq('license_keys', key);

      if (updateError) {
        return res.status(500).json({ message: "Lỗi cập nhật thiết bị: " + updateError.message });
      }

      keyData.hwid = hwid;
      keyData.status = 'active';
    } 
    else if (hwid && currentHwid !== hwid) {
      // Nếu máy khác vào
      return res.status(400).json({ message: "device_locked" });
    }

    // Trả về thành công
    return res.status(200).json({
      message: "Thành công",
      total_keys: 1,
      data: [keyData]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
