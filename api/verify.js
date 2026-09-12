import { createClient } from '@supabase/supabase-js';

// Khởi tạo kết nối Supabase sử dụng biến môi trường trên Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    const { key, hwid } = req.query;

    if (!key) {
        return res.status(400).json({ message: "Thiếu Key!" });
    }

    try {
        // 1. Truy vấn vào bảng chứa key trong Supabase
        const { data, error } = await supabase
            .from('ten_bang_key_cua_ban') // Thay tên bảng của bạn vào đây
            .select('*')
            .eq('key', key);

        // 2. Không tìm thấy key trong database
        if (error || !data || data.length === 0) {
            return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
        }

        const keyData = data[0];

        // 3. Kiểm tra trạng thái của Key
        if (keyData.status !== 'active') {
            return res.status(400).json({ message: "Key đã bị khóa hoặc hết hạn!", status: keyData.status });
        }

        // 4. Phản hồi thành công về cho tool C#
        return res.status(200).json({ 
            message: "Ket noi Supabase thanh cong!", 
            success: true,
            total_keys: 1, 
            data: [keyData] 
        });

    } catch (err) {
        return res.status(500).json({ message: "Lỗi Server nội bộ", error: err.message });
    }
}
