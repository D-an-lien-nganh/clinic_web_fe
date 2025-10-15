import dayjs from "dayjs";

export const toBirthInput = (d: any): string | undefined => {
  if (!d) return undefined;
  // chuẩn mới
  if (d.birth_raw) return d.birth_raw; // có sẵn "1990" | "01/1990" | "09/01/1990"
  if (d.birth_accuracy === "day" && d.birth_date) {
    return dayjs(d.birth_date).format("DD/MM/YYYY");
  }
  // fallback legacy
  if (d.birth) return dayjs(d.birth).format("DD/MM/YYYY");
  return undefined;
};
