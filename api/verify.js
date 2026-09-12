import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Lấy toàn bộ dữ liệu từ bảng license_keys trên Supabase để dò tìm chính xác mã key
    const { data, error } = await supabase
      .from('license_keys')
      .select('*');

    if (error || !data || data.length === 0) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống web!" });
    }

    // Dò tìm xem key người dùng nhập có khớp với bất kỳ dòng dữ liệu nào trên web không
    let matchedRow = null;
    for (const row of data) {
      for (const col in row) {
        if (row[col] !== null && String(row[col]).trim() === String(key).trim()) {
          matchedRow = row;
          break;
        }
      }
      if (matchedRow) break;
    }

    // Nếu tìm không thấy key trong toàn bộ bảng
    if (!matchedRow) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống web!" });
    }

    // Kiểm tra trạng thái bị ban
    if (matchedRow.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    let currentHwid = matchedRow.hwid;

    // Nếu key chưa có HWID (chưa ai dùng) -> Gán HWID hiện tại và đổi trạng thái thành active
    if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
      const { error: updateError } = await supabase
        .from('license_keys')
        .update({ 
          hwid: hwid || "default_hwid", 
          status: 'active' 
        })
        .eq('id', matchedRow.id);

      if (updateError) {
        return res.status(500).json({ message: "Lỗi cập nhật thiết bị!" });
      }
    } 
    else if (hwid && currentHwid !== hwid) {
      // Nếu đã được kích hoạt ở máy khác
      return res.status(400).json({ message: "device_locked" });
    }

    // Thành công hoàn toàn
    return res.status(200).json({
      message: "Thành công",
      total_keys: 1,
      data: [matchedRow]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
