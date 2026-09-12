// Danh sách kho key lưu trực tiếp trên Vercel (Chuẩn hóa status: 'Unactivated', 'Active', 'banned')
const VALID_KEYS = [
  { key: "DOBI-VIP-1111", hwid: "", status: "Unactivated", durationDays: 7, expiryTimestamp: null },
  { key: "DOBI-PRO-2222", hwid: "", status: "Unactivated", durationDays: 30, expiryTimestamp: null },
  { key: "DOBI-WS9K-PEXX-HQUE", hwid: "", status: "Unactivated", durationDays: 1, expiryTimestamp: null },
  { key: "DOBI-TEST-9999", hwid: "DEVICE_LOCKED_HWID", status: "banned", durationDays: 365, expiryTimestamp: null }
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

    const now = Date.now();

    // 1. Nếu key chưa có HWID (Chưa ai dùng / Chưa kích hoạt) -> Gán HWID và đổi trạng thái thành Active
    if (!foundKey.hwid || foundKey.hwid === "" || foundKey.hwid === "Chưa liên kết") {
      foundKey.hwid = hwid || "default_hwid";
      foundKey.status = "Active"; // Sửa thành Active để đồng bộ hiển thị trạng thái đã kích hoạt
      
      // Thiết lập thời gian hết hạn nếu chưa có
      if (!foundKey.expiryTimestamp) {
        if (foundKey.durationDays !== 365) {
          foundKey.expiryTimestamp = now + (foundKey.durationDays * 24 * 60 * 60 * 1000);
        } else {
          foundKey.expiryTimestamp = 'Lifetime';
        }
      }
    } 
    // 2. Nếu key đã có HWID nhưng khác với thiết bị đang gửi lên
    else if (hwid && foundKey.hwid !== hwid) {
      return res.status(400).json({ message: "Key đã được kích hoạt trên thiết bị khác! Vui lòng đặt lại HWID." });
    }

    // Kiểm tra hết hạn (nếu không phải vĩnh viễn)
    if (foundKey.expiryTimestamp !== 'Lifetime' && foundKey.expiryTimestamp && now > foundKey.expiryTimestamp) {
      return res.status(400).json({ message: "Key đã hết hạn sử dụng!" });
    }

    // Trả về thành công khi đúng HWID hoặc vừa kích hoạt xong
    return res.status(200).json({
      message: "Thành công",
      data: [foundKey]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
