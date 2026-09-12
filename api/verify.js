const FIREBASE_DB_URL = "https://dobi-manager-default-rtdb.firebaseio.com/dobimanager.json";

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // 1. Tải toàn bộ dữ liệu từ Firebase
    const response = await fetch(FIREBASE_DB_URL);
    if (!response.ok) {
      return res.status(500).json({ message: "Không thể kết nối tới cơ sở dữ liệu Firebase!" });
    }

    const data = await response.json();
    if (!data || !data.licenses) {
      return res.status(404).json({ message: "Hệ thống chưa có dữ liệu license nào!" });
    }

    let licenses = data.licenses;
    const foundIndex = licenses.findIndex(k => k && k.key && k.key.toLowerCase() === key.toLowerCase());

    if (foundIndex === -1) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
    }

    let foundKey = licenses[foundIndex];

    // 2. Kiểm tra trạng thái Banned
    if (foundKey.status === 'Banned' || foundKey.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    // 3. Kiểm tra thời gian hết hạn (Expiry Check)
    const now = Date.now();
    if (foundKey.expiryTimestamp && foundKey.expiryTimestamp !== 'Lifetime') {
      const expiryTime = parseInt(foundKey.expiryTimestamp);
      if (now > expiryTime) {
        // Nếu đã quá hạn, trả về lỗi expired để C# nhận biết
        return res.status(400).json({ message: "expired" });
      }
    }

    // Khởi tạo các giá trị mặc định
    if (foundKey.currentDevices === undefined) {
      foundKey.currentDevices = 0;
    }
    foundKey.maxDevices = 1; // Cố định tối đa 1 thiết bị

    // 4. Kiểm tra logic HWID và giới hạn thiết bị
    if (!foundKey.hwid || foundKey.hwid === "" || foundKey.currentDevices === 0) {
      foundKey.hwid = hwid || "default_hwid";
      foundKey.status = "Active";
      foundKey.currentDevices = 1;
    } 
    else if (hwid && foundKey.hwid === hwid) {
      foundKey.currentDevices = 1;
    }
    else {
      return res.status(400).json({ message: "device_locked" });
    }

    // 5. Ghi đè trạng thái mới ngược lại vào Firebase
    licenses[foundIndex] = foundKey;

    await fetch(FIREBASE_DB_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenses: licenses })
    });

    return res.status(200).json({
      message: "Thành công",
      data: [foundKey]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
