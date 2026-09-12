import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Lấy toàn bộ dữ liệu trong bảng license_keys về để server kiểm tra trực tiếp
    const { data, error } = await supabase
      .from('license_keys')
      .select('*');

    if (error) {
      return res.status(500).json({ message: "Lỗi truy vấn Database: " + error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Hệ thống chưa có key nào!" });
    }

    // Server tự động dò tìm xem key người dùng nhập có khớp với bất kỳ giá trị nào trong các cột trên web hay không
    let matchedKeyData = null;
    let matchedColumnName = '';

    for (const row of data) {
      for (const colName in row) {
        if (row[colName] === key) {
          matchedKeyData = row;
          matchedColumnName = colName;
          break;
        }
      }
      if (matchedKeyData) break;
    }

    if (!matchedKeyData) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống web!" });
    }

    // Kiểm tra trạng thái bị ban
    if (matchedKeyData.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    let currentHwid = matchedKeyData.hwid;

    // Tự động gán HWID nếu chưa có thiết bị liên kết
    if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
      const { error: updateError } = await supabase
        .from('license_keys')
        .update({ 
          hwid: hwid || "default_hwid", 
          status: 'active' 
        })
        .eq('id', matchedKeyData.id);

      if (updateError) {
        return res.status(500).json({ message: "Lỗi cập nhật thiết bị: " + updateError.message });
      }

      matchedKeyData.hwid = hwid;
      matchedKeyData.status = 'active';
    } 
    else if (hwid && currentHwid !== hwid) {
      return res.status(400).json({ message: "device_locked" });
    }

    return res.status(200).json({
      message: "Thành công",
      total_keys: 1,
      data: [matchedKeyData]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
