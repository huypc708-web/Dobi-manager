import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  try {
    const { key, hwid } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Thiếu Key bản quyền!" });
    }

    // Thử tìm theo cột 'key'
    let { data, error } = await supabase
      .from('license_keys')
      .select('*')
      .eq('key', key);

    // Nếu không thấy, thử tìm theo cột 'license_key'
    if (!data || data.length === 0) {
      let resAlt = await supabase
        .from('license_keys')
        .select('*')
        .eq('license_key', key);
      data = resAlt.data;
      error = resAlt.error;
    }

    // Nếu vẫn không thấy, thử tìm theo cột 'key_code'
    if (!data || data.length === 0) {
      let resAlt2 = await supabase
        .from('license_keys')
        .select('*')
        .eq('key_code', key);
      data = resAlt2.data;
      error = resAlt2.error;
    }

    if (error) {
      return res.status(500).json({ message: "Lỗi truy vấn Database: " + error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Key không tồn tại trên hệ thống!" });
    }

    const keyData = data[0];
    const actualKeyField = keyData.key !== undefined ? 'key' : (keyData.license_key !== undefined ? 'license_key' : 'key_code');

    if (keyData.status === 'banned') {
      return res.status(400).json({ message: "banned" });
    }

    let currentHwid = keyData.hwid;

    if (!currentHwid || currentHwid === "none" || currentHwid === "" || currentHwid === null) {
      const { error: updateError } = await supabase
        .from('license_keys')
        .update({ 
          hwid: hwid || "default_hwid", 
          status: 'active' 
        })
        .eq(actualKeyField, key);

      if (updateError) {
        return res.status(500).json({ message: "Lỗi cập nhật thiết bị: " + updateError.message });
      }

      keyData.hwid = hwid;
      keyData.status = 'active';
    } 
    else if (hwid && currentHwid !== hwid) {
      return res.status(400).json({ message: "device_locked" });
    }

    return res.status(200).json({
      message: "Thành công",
      total_keys: 1,
      data: [keyData]
    });

  } catch (err) {
    return res.status(500).json({ message: "Lỗi Server: " + err.message });
  }
}
