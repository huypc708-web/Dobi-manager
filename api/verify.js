export default function handler(req, res) {
    // Thiết lập CORS để cho phép phần mềm C#, Python, C++ gọi qua lại mà không bị chặn
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Phản hồi nhanh nếu là request kiểm tra kết nối OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Chỉ chấp nhận phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            status: 'error', 
            message: 'Chỉ hỗ trợ phương thức POST!' 
        });
    }

    // Lấy dữ liệu gửi lên từ ứng dụng (key và phần cứng hwid)
    const { key, hwid } = req.body;

    if (!key) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Thiếu mã license key!' 
        });
    }

    // --- LOGIC KIỂM TRA KEY ---
    // (Ở đây viết mẫu kiểm tra đơn giản, bạn có thể thay bằng kết nối Database sau)
    if (key === "DOBI-TEST-KEY-123") {
        return res.status(200).json({
            status: 'success',
            message: 'Xác thực bản quyền thành công!',
            expireDays: 30
        });
    }

    // Trường hợp key không tồn tại hoặc sai
    return res.status(401).json({
        status: 'error',
        message: 'Mã key không hợp lệ hoặc đã hết hạn!'
    });
}
