import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ status: "error", message: "Thiếu Key bản quyền!" });
    }

    // 1. Lấy toàn bộ dữ liệu trong bảng license_keys
    const { data, error } = await supabase
      .from('license_keys')
      .select('*');

    if (error || !data || data.length === 0) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy dữ liệu trên web!" });
    }

    // 2. Dò tìm key trong tất cả các cột của bảng
    let matchedRow = null;
    for (const row of data) {
      for (const col in row) {
        if (String(row[col]).trim() === String(key).trim()) {
          matchedRow = row;
          break;
        }
      }
      if (matchedRow) break;
    }

    if (!matchedRow) {
      return res.status(404).json({ status: "error", message: "Key không tồn tại trên hệ thống web!" });
    }

    // 3. Kiểm tra trạng thái
    if (matchedRow.status === 'banned') {
      return res.status(400).json({ status: "banned", message: "Key đã bị khóa!" });
    }

    let currentHwid = matchedRow.hwid;

    // 4. Tự động gán HWID nếu chưa có
    if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
      const { error: updateError } = await supabase
        .from('license_keys')
        .update({ 
          hwid: hwid || "default_hwid", 
          status: 'active' 
        })
        .eq('id', matchedRow.id);

      if (updateError) {
        return res.status(500).json({ status: "error", message: "Lỗi cập nhật HWID!" });
      }
    } 
    else if (hwid && currentHwid !== hwid) {
      return res.status(400).json({ status: "device_locked", message: "Key đã được dùng ở máy khác!" });
    }

    // 5. Trả về kết quả thành công hoàn toàn
    return res.status(200).json({
      status: "success",
      message: "Đăng nhập thành công!",
      total_keys: 1,
      data: [matchedRow]
    });

  } catch (err) {
    return res.status(500).json({ status: "error", message: "Lỗi Server: " + err.message });
  }
}
