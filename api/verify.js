import admin from 'firebase-admin';

// Khởi tạo Firebase Admin (Đảm bảo bạn đã cấu hình biến môi trường trên Vercel)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Xử lý xuống dòng cho private key nếu cần
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  } catch (e) {
    console.error('Firebase initialization error', e);
  }
}

const db = admin.database();

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Tham chiếu đến nhánh licenses trên Firebase
    const licensesRef = db.ref('dobimanager/licenses');
    const snapshot = await licensesRef.once('value');
    const licenses = snapshot.val();

    if (!licenses || !Array.isArray(licenses)) {
      return res.status(404).json({ message: "Hệ thống chưa có dữ liệu Key!" });
    }

    // Tìm kiếm key trong mảng dữ liệu Firebase
    let foundIndex = -1;
    let foundKey = null;

    for (let i = 0; i < licenses.length; i++) {
      if (licenses[i] && licenses[i].key === key) {
        foundIndex = i;
        foundKey = licenses[i];
        break;
      }
    }

    if (!foundKey) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
    }

    // Kiểm tra trạng thái bị khóa (Banned)
    if (foundKey.status === 'Banned' || foundKey.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    const now = Date.now();

    // 1. Nếu key chưa kích hoạt hoặc chưa liên kết HWID
    if (!foundKey.hwid || foundKey.hwid === "Chưa liên kết" || foundKey.hwid === "") {
      foundKey.hwid = hwid || "default_hwid";
      foundKey.status = "Active"; // Cập nhật đúng định dạng Active để web nhận diện

      if (!foundKey.expiryTimestamp) {
        const duration = foundKey.durationDays || 7;
        if (duration !== 365) {
          foundKey.expiryTimestamp = now + (duration * 24 * 60 * 60 * 1000);
        } else {
          foundKey.expiryTimestamp = 'Lifetime';
        }
      }

      // Cập nhật ngược lại vào Firebase Realtime Database
      await licensesRef.child(foundIndex).set(foundKey);
    } 
    // 2. Nếu key đã có HWID nhưng khác với thiết bị gửi lên
    else if (hwid && foundKey.hwid !== hwid) {
      return res.status(400).json({ message: "Key đã được kích hoạt trên thiết bị khác! Vui lòng đặt lại HWID." });
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
