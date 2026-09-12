// Đoạn logic quan trọng cần có trong API verify trên Vercel
let currentHwid = keyData.hwid;

// Nếu key chưa từng được sử dụng (chưa liên kết thiết bị)
if (!currentHwid || currentHwid === "none" || currentHwid === "") {
  // Cập nhật HWID của máy hiện tại vào cơ sở dữ liệu cho key này
  const { error: updateError } = await supabase
    .from('ten_bang_key_cua_ban')
    .update({ hwid: hwid, status: 'active' }) // Cập nhật lại hwid và kích hoạt
    .eq('key', key);

  if (updateError) {
    return res.status(500).json({ message: "Lỗi cập nhật phần cứng thiết bị!" });
  }
} else if (currentHwid !== hwid) {
  // Nếu đã có HWID rồi mà khác với máy đang đăng nhập -> Báo lỗi khóa máy
  return res.status(400).json({ message: "device_locked" });
}
