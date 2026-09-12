// Danh sách kho key lưu trực tiếp trên Vercel
const VALID_KEYS = [
  { key: "DOBI-VIP-1111", hwid: "", status: "Chưa kích hoạt", maxDevices: 1, currentDevices: 0 },
  { key: "DOBI-PRO-2222", hwid: "", status: "Chưa kích hoạt", maxDevices: 1, currentDevices: 0 },
  { key: "DOBI-RLVZ-6A12-WGYW", hwid: "", status: "Chưa kích hoạt", maxDevices: 1, currentDevices: 0 },
  { key: "DOBI-TEST-9999", hwid: "DEVICE_LOCKED_HWID", status: "banned", maxDevices: 1, currentDevices: 1 }
];

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    const foundKey = VALID_KEYS.find(k => k.key === key);

    if (!foundKey) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
    }

    if (foundKey.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    // Nếu key chưa có HWID hoặc chưa có thiết bị nào sử dụng
    if (!foundKey.hwid || foundKey.hwid === "") {
      foundKey.hwid = hwid || "default_hwid";
      foundKey.status = "Đã kích hoạt";
      foundKey.currentDevices = 1;
    } 
    // Nếu HWID gửi lên khớp với HWID đã lưu (thiết bị cũ đăng nhập lại)
    else if (foundKey.hwid === hwid) {
      foundKey.currentDevices = 1;
    }
    // Nếu khác thiết bị -> Chặn vì đã tối đa 1 thiết bị
    else {
      return res.status(400).json({ message: "device_locked" });
    }

    return res.status(200).json({
      message: "Thành công",
      data: [foundKey]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
