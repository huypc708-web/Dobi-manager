import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Khởi tạo Supabase trực tiếp an toàn
   const supabaseUrl = "https://predckhbcgrwxkzpzhnl.supabase.co";
   const supabaseKey = "sb_publishable_Ba-luqntK8DBXPgd-Ykuzw_rzZmk5ZH";

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ message: "Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY trên Vercel!" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Lấy danh sách từ bảng license_keys
    let { data, error } = await supabase
      .from('license_keys')
      .select('*');

    if (error || !data) {
      return res.status(500).json({ message: "Lỗi truy vấn database: " + (error ? error.message : "Không có dữ liệu") });
    }

    // Tìm key khớp trong danh sách dữ liệu
    let matchedRow = null;
    for (const row of data) {
      // Kiểm tra các cột phổ biến chứa key
      if (
        (row.license_key && row.license_key.trim() === key.trim()) ||
        (row.key && row.key.trim() === key.trim()) ||
        (row.code && row.code.trim() === key.trim())
      ) {
        matchedRow = row;
        break;
      }
    }

    // Nếu không tìm thấy key
    if (!matchedRow) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống web hoặc chưa được tạo!" });
    }

    // Kiểm tra trạng thái bị ban
    if (matchedRow.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    let currentHwid = matchedRow.hwid || matchedRow.hardware_id;
    let rowId = matchedRow.id;

    // Nếu key chưa kích hoạt, gán HWID vào
    if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
      await supabase
        .from('license_keys')
        .update({ 
          hwid: hwid || "default_hwid", 
          status: 'active' 
        })
        .eq('id', rowId);
    } 
    else if (hwid && currentHwid !== hwid) {
      return res.status(400).json({ message: "device_locked" });
    }

    // Thành công
    return res.status(200).json({ message: "Thành công", data: matchedRow });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server Exception: " + err.message });
  }
}
