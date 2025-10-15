// ===== Export mapping =====
export const getExcelMapping = (activeTab: string) => {
  if (activeTab === "KVTV" || activeTab === "TLCB") {
    return {
      headers: ["STT", "Mã KH", "Họ và tên", "SĐT", "Email", "Ngày hẹn", "Ghi chú"],
      mapRow: (r: any, i: number) => [
        i + 1,
        r?.customer_info?.code ?? r?.customer_code ?? "",
        r?.customer_info?.name ?? r?.full_name ?? "",
        r?.customer_info?.mobile ?? r?.phone_number ?? "",
        r?.customer_info?.email ?? r?.email ?? "",
        r?.time_frame_str ?? r?.scheduled_at_str ?? r?.receiving_day ?? "",
        r?.note ?? "",
      ],
    };
  }
  if (activeTab === "TLDS") {
    return {
      headers: ["STT", "Mã KH", "Họ và tên", "SĐT", "Email", "Bác sĩ điều trị", "Loại đơn", "Trạng thái", "Ngày hẹn"],
      mapRow: (r: any, i: number) => [
        i + 1,
        r?.customer_info?.code ?? r?.customer_code ?? "",
        r?.customer_info?.name ?? r?.full_name ?? "",
        r?.customer_info?.mobile ?? r?.phone_number ?? "",
        r?.customer_info?.email ?? r?.email ?? "",
        r?.treating_doctor?.full_name ?? r?.doctor_fullname ?? "",
        r?.latest_plan_type ?? "",
        r?.latest_plan_status?.label ?? "",
        r?.time_frame_str ?? r?.scheduled_at_str ?? r?.receiving_day ?? "",
      ],
    };
  }
  if (activeTab === "TK") {
    return {
      headers: ["STT", "Mã KH", "Họ và tên", "SĐT", "Email", "Bác sĩ khám", "Ngày hẹn", "Ghi chú"],
      mapRow: (r: any, i: number) => [
        i + 1,
        r?.customer_info?.code ?? r?.customer_code ?? "",
        r?.customer_info?.name ?? r?.full_name ?? "",
        r?.customer_info?.mobile ?? r?.phone_number ?? "",
        r?.customer_info?.email ?? r?.email ?? "",
        r?.doctor_details?.doctor_fullname ?? r?.doctor_fullname ?? "",
        r?.time_frame_str ?? r?.scheduled_at_str ?? r?.receiving_day ?? "",
        r?.note ?? "",
      ],
    };
  }
  return { headers: [], mapRow: (_r: any, _i: number) => [] };
};
