// Danh sách kho key lưu trực tiếp trên Vercel (Bạn có thể thêm bớt key ở đây)
const VALID_KEYS = [
  { key: "DOBI-VIP-1111", hwid: "", status: "Chưa kích hoạt" },
  { key: "DOBI-PRO-2222", hwid: "", status: "Chưa kích hoạt" },
  { key: "DOBI-O0UKCX-AV2TRG", hwid: "", status: "Chưa kích hoạt" },
  { key: "DOBI-TEST-9999", hwid: "DEVICE_LOCKED_HWID", status: "banned" }
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

    // 1. Nếu key chưa có HWID (Chưa ai dùng) -> Gán HWID và đổi trạng thái thành Đã kích hoạt
    if (!foundKey.hwid || foundKey.hwid === "") {
      foundKey.hwid = hwid || "default_hwid";
      foundKey.status = "Đã kích hoạt"; // Cập nhật trạng thái hiển thị lên web
    } 
    // 2. Nếu key đã có HWID nhưng khác với thiết bị đang gửi lên
    else if (hwid && foundKey.hwid !== hwid) {
      // Chặn đăng nhập vì chưa reset HWID
      return res.status(400).json({ message: "Key đã được kích hoạt trên thiết bị khác! Vui lòng đặt lại HWID." });
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
