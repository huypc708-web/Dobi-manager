// Danh sách kho key lưu trực tiếp trên Vercel (Bạn có thể thêm bớt key ở đây)
const VALID_KEYS = [
  { key: "DOBI-VIP-1111", hwid: "", status: "active" },
  { key: "DOBI-PRO-2222", hwid: "", status: "active" },
  { key: "DOBI-TEST-9999", hwid: "DEVICE_LOCKED_HWID", status: "banned" } // Ví dụ key bị ban
];

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Tìm key trong danh sách trên Vercel
    const foundKey = VALID_KEYS.find(k => k.key === key);

    if (!foundKey) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
    }

    // Kiểm tra trạng thái bị ban
    if (foundKey.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    // Tự động gán HWID vào lần đăng nhập đầu tiên
    if (!foundKey.hwid || foundKey.hwid === "none" || foundKey.hwid === "") {
      foundKey.hwid = hwid || "default_hwid";
      foundKey.status = 'active';
    } 
    else if (hwid && foundKey.hwid !== hwid) {
      // Nếu máy khác cố tình dùng chung key
      return res.status(400).json({ message: "device_locked" });
    }

    // Trả về thành công
    return res.status(200).json({
      message: "Thành công",
      data: [foundKey]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
