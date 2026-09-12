import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // 1. Truy vấn vào bảng chứa key trong Supabase
    // LƯU Ý: Nếu bảng của bạn tên khác 'licenses', hãy đổi lại tên bảng cho đúng bên dưới
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', key);

    if (error) {
      return res.status(500).json({ message: "Lỗi truy vấn Database: " + error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
    }

    const keyData = data[0];

    // 2. Kiểm tra trạng thái bị ban
    if (keyData.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    let currentHwid = keyData.hwid;

    // 3. Xử lý tự động gán HWID nếu key chưa có thiết bị liên kết
    if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ 
          hwid: hwid || "default_hwid", 
          status: 'active' 
        })
        .eq('key', key);

      if (updateError) {
        return res.status(500).json({ message: "Lỗi cập nhật thiết bị: " + updateError.message });
      }

      keyData.hwid = hwid;
      keyData.status = 'active';
    } 
    else if (hwid && currentHwid !== hwid) {
      // 4. Nếu khác máy
      return res.status(400).json({ message: "device_locked" });
    }

    // 5. Trả về thành công
    return res.status(200).json({
      message: "Thành công",
      total_keys: 1,
      data: [keyData]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
