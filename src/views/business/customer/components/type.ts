export type ProvinceItem = {
  name: string;
  slug: string;
  type: string; // "tinh" | "thanh-pho"
  name_with_type: string;
  code: string; // VD "11"
};

export type WardItem = {
  name: string;
  type: string; // "xa" | "phuong" | "thi-tran"...
  slug: string;
  name_with_type: string;
  path: string;
  path_with_type: string;
  code: string; // VD "267"
  parent_code: string; // VD "11" → trỏ về province.code
};

export const validateBirthInput = (_: any, v: string | null) => {
    if (!v) return Promise.resolve(); // cho phép bỏ trống
    if (/^\d{4}$/.test(v)) return Promise.resolve();
    if (/^\d{2}\/\d{4}$/.test(v)) {
      const mm = Number(v.slice(0, 2));
      return mm >= 1 && mm <= 12
        ? Promise.resolve()
        : Promise.reject("Tháng không hợp lệ (01–12).");
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      const dd = Number(v.slice(0, 2));
      const mm = Number(v.slice(3, 5));
      const yy = Number(v.slice(6, 10));
      const dim = new Date(yy, mm, 0).getDate();
      return mm >= 1 && mm <= 12 && dd >= 1 && dd <= dim
        ? Promise.resolve()
        : Promise.reject("Ngày không hợp lệ.");
    }
    return Promise.reject(
      "Định dạng phải là YYYY hoặc MM/YYYY hoặc DD/MM/YYYY."
    );
  };