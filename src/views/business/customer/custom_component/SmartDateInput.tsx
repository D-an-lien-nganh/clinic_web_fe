import React, { useState, useEffect } from "react";
import { Input } from "antd";

type Props = {
  value?: string | null;                    // "1990" | "01/1990" | "09/01/1990"
  onChange?: (val: string | null) => void;  // chỉ emit khi HỢP LỆ (hoặc blur)
  placeholder?: string;
  allowYearOnly?: boolean;   // mặc định true
  allowMonthYear?: boolean;  // mặc định true
};

const clampDigits = (raw: string) => raw.replace(/\D/g, "").slice(0, 8);

const formatSmart = (digits: string) => {
  if (digits.length <= 4) return digits;                              // yyyy (đang gõ)
  if (digits.length <= 6) return `${digits.slice(0,2)}/${digits.slice(2)}`; // mm/yyyy
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;    // dd/mm/yyyy
};

const isValidYear = (y: string) => /^\d{4}$/.test(y);
const isValidMonthYear = (s: string) => {
  const m = s.match(/^(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const mm = Number(m[1]);
  return mm >= 1 && mm <= 12;
};
const isValidFullDate = (s: string) => {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const dd = Number(m[1]), mm = Number(m[2]), yy = Number(m[3]);
  if (mm < 1 || mm > 12) return false;
  const dim = new Date(yy, mm, 0).getDate();
  return dd >= 1 && dd <= dim;
};

const SmartDateInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Nhập ngày sinh",
  allowYearOnly = true,
  allowMonthYear = true,
}) => {
  const [text, setText] = useState<string>(value ?? "");

  // Chỉ đồng bộ khi value từ Form thay đổi (ví dụ khi edit record)
  useEffect(() => {
    // Tránh giật khi đang gõ: chỉ set khi value khác text hiện tại
    if ((value ?? "") !== text) setText(value ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitIfValid = (s: string) => {
    if (isValidFullDate(s)) { onChange?.(s); return true; }
    if (allowMonthYear && isValidMonthYear(s)) { onChange?.(s); return true; }
    if (allowYearOnly && isValidYear(s)) { onChange?.(s); return true; }
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = clampDigits(e.target.value);
    const formatted = formatSmart(digits);
    setText(formatted);

    // Đang gõ: KHÔNG emit null. Chỉ emit khi đã hợp lệ.
    emitIfValid(formatted);
  };

  const handleBlur = () => {
    // Khi blur, nếu vẫn chưa hợp lệ thì không emit gì (giữ giá trị hiện có của Form)
    emitIfValid(text);
  };

  return (
    <Input
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      maxLength={10}              // DD/MM/YYYY dài nhất = 10
      inputMode="numeric"
      placeholder={placeholder}
      autoComplete="off"
    />
  );
};

export default SmartDateInput;
