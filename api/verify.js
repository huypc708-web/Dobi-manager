async function checkKeyOnWeb(userKey) {
  try {
    let response = await fetch(`https://dobi-manager.vercel.app/api/verify?key=${encodeURIComponent(userKey)}`);
    let text = await response.text();
    
    if (text.includes("success")) {
      alert("Key này hợp lệ và có thể dùng để đăng nhập Tool C#!");
    } else {
      alert("Key không tồn tại hoặc chưa được kích hoạt trên hệ thống!");
    }
  } catch (error) {
    console.error("Lỗi kết nối:", error);
  }
}
