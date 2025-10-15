export function convertYMDToDMY(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatCurrency(value?: number | string): string {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toLocaleString("vi-VN");
}

export const normalizeVN = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
    
// Hàm sinh code 6 ký tự (A–Z, 0–9)
export function generateRandomCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
