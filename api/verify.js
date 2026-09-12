import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Truy vấn tìm chính xác key trong bảng license_keys (thay 'license_keys' bằng tên cột chứa key thực tế của bạn nếu cần)
    const { data, error } = await supabase
      .from('license_keys')
      .select('*')
      .eq('license_keys', key);

    if (error) {
      return res.status(500).json({ message: "Lỗi truy vấn Database: " + error.message });
    }

    // Nếu không tìm thấy key trong database nghĩa là key này chưa được tạo hoặc không có thực
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống web!" });
    }

    const keyData = data[0];

    // Kiểm tra trạng thái bị ban
    if (keyData.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    let currentHwid = keyData.hwid;

    // Nếu key chưa có HWID (chưa ai sử dụng) -> Gán HWID hiện tại vào và kích hoạt
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
    } 
    else if (hwid && currentHwid !== hwid) {
      // Nếu key đã được kích hoạt trên máy khác rồi
      return res.status(400).json({ message: "device_locked" });
    }

    // Trả về thành công khi key hợp lệ và chưa từng bị ai dùng sai máy
    return res.status(200).json({
      message: "Thành công",
      total_keys: 1,
      data: [keyData]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
