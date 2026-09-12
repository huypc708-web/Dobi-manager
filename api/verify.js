import crypto from 'crypto';

// Một chuỗi bí mật (Secret Key) dùng để ký và giải mã key. Hãy giữ bí mật chuỗi này!
const SECRET_SIGNATURE = "DOBI_SECRET_KEY_2026_PRO";

export default function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Kiểm tra định dạng cơ bản (ví dụ phải bắt đầu bằng DOBI-)
    if (!key.startsWith("DOBI-")) {
      return res.status(404).json({ message: "Key không đúng định dạng hệ thống!" });
    }

    // Giải mã và kiểm tra tính hợp lệ của key dựa trên thuật toán chữ ký
    const parts = key.split("-");
    if (parts.length < 3) {
      return res.status(404).json({ message: "Key không hợp lệ!" });
    }

    // Thuật toán kiểm tra chữ ký ẩn bên trong Key
    const hashCheck = crypto.createHmac('sha256', SECRET_SIGNATURE)
                            .update(parts[0] + "-" + parts[1])
                            .digest('hex')
                            .substring(0, 6)
                            .toUpperCase();

    // Lấy phần đuôi của key để so sánh chữ ký bảo mật
    const clientSignature = parts[2];

    // Nếu chữ ký khớp hoàn toàn, nghĩa là key này do hệ thống tạo ra -> Cho phép đăng nhập ngay
    if (clientSignature === hashCheck) {
      return res.status(200).json({ 
        message: "Thành công", 
        hwid: hwid || "unknown" 
      });
    } else {
      return res.status(404).json({ message: "Key giả mạo hoặc không tồn tại trên hệ thống!" });
    }

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
