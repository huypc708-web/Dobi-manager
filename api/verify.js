export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { key } = req.query;

  // Thay "DOBI-VIP" thành key bản quyền bạn muốn dùng
  if (key && key.trim() === "DOBI-VIP") {
    return res.status(200).send("success");
  } else {
    return res.status(200).send("invalid");
  }
}
