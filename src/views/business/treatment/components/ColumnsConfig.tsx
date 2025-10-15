export const getColumnsForStatus = (status: string, employeeMap: any) => {
  switch (status) {
    case "Yêu cầu trải nghiệm":
    case "Yêu cầu dịch vụ":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã khách hàng",
          dataIndex: "customer_code",
          key: "customer_code",
        },
        {
          title: "Họ và tên",
          dataIndex: "full_name",
          key: "full_name",
        },
        {
          title: "Số điện thoại",
          dataIndex: "phone_number",
          key: "phone_number",
        },
        {
          title: "Email",
          dataIndex: "email",
          key: "email",
        },
        {
          title: "Người tiếp thị",
          dataIndex: "sales_person",
          key: "sales_person",
          render: (id: string) => employeeMap[id] || "Không xác định",
        },
        {
          title: "Lịch hẹn",
          dataIndex: "schedule",
          key: "schedule",
          render: (schedule: string) => new Date(schedule).toLocaleString(),
        },
        {
          title: "Người giới thiệu",
          dataIndex: "introducer",
          key: "introducer",
        },
      ];

    case "Chờ y tá tiếp nhận":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "customer_code",
          key: "customer_code",
        },
        {
          title: "Họ và tên",
          dataIndex: "full_name",
          key: "full_name",
        },
        {
          title: "Số điện thoại",
          dataIndex: "phone_number",
          key: "phone_number",
        },
        {
          title: "Nguồn",
          dataIndex: "source",
          key: "source",
          render: (source: { title: string }) =>
            source?.title || "Không xác định",
        },
        {
          title: "Người tiếp thị",
          dataIndex: "sales_person",
          key: "sales_person",
          render: (id: string) => employeeMap[id] || "Không xác định",
        },
        {
          title: "Người giới thiệu",
          dataIndex: "referrer",
          key: "referrer",
        },
        {
          title: "Y tá tiếp nhận",
          dataIndex: "receiving_nurse",
          key: "receiving_nurse",
        },
        {
          title: "Loại đơn",
          dataIndex: "single_type",
          key: "single_type",
        },
      ];

    case "Chờ bác sỹ thăm khám":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "customer_code",
          key: "customer_code",
        },
        {
          title: "Họ và tên",
          dataIndex: "full_name",
          key: "full_name",
        },
        {
          title: "Số điện thoại",
          dataIndex: "phone_number",
          key: "phone_number",
        },
        {
          title: "Email",
          dataIndex: "email",
          key: "email",
        },
        {
          title: "Nhân viên lễ tân",
          dataIndex: "receptionist",
          key: "receptionist",
        },
        {
          title: "Y tá tiếp nhận",
          dataIndex: "nurse",
          key: "nurse",
        },
        {
          title: "Loại đơn",
          dataIndex: "single_type",
          key: "single_type",
        },
        {
          title: "Bác sĩ",
          dataIndex: "doctor",
          key: "doctor",
        },
      ];
    case "Chờ chuyên gia chỉ định":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "customer_code",
          key: "customer_code",
        },
        {
          title: "Họ và tên",
          dataIndex: "full_name",
          key: "full_name",
        },
        {
          title: "Số điện thoại",
          dataIndex: "phone_number",
          key: "phone_number",
        },
        {
          title: "Email",
          dataIndex: "email",
          key: "email",
        },
        {
          title: "Nhân viên lễ tân",
          dataIndex: "receptionist",
          key: "receptionist",
        },
        {
          title: "Y tá tiếp nhận",
          dataIndex: "nurse",
          key: "nurse",
        },
        {
          title: "Loại đơn",
          dataIndex: "single_type",
          key: "single_type",
        },
        {
          title: "Bác sĩ",
          dataIndex: "doctor",
          key: "doctor",
        },
      ];

    case "Trị liệu":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "customer_code",
          key: "customer_code",
        },
        {
          title: "Họ và tên",
          dataIndex: "full_name",
          key: "full_name",
        },
        {
          title: "Số điện thoại",
          dataIndex: "phone_number",
          key: "phone_number",
        },
        {
          title: "Loại đơn",
          dataIndex: "single_type",
          key: "single_type",
        },
        {
          title: "Chuẩn đoán",
          dataIndex: "diagnosis",
          key: "diagnosis",
        },
        {
          title: "Số buổi trị liệu",
          dataIndex: "number_of_treatment_sessions",
          key: "number_of_treatment_sessions",
        },
        {
          title: "Số buổi đã thực hiện",
          dataIndex: "number_of_sessions_performed",
          key: "number_of_sessions_performed",
        },
        {
          title: "Số buổi trị liệu dưỡng sinh",
          dataIndex: "number_of_nursing_therapy_sessions",
          key: "number_of_nursing_therapy_sessions",
        },
      ];

    case "Tái khám":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "customer_code",
          key: "customer_code",
        },
        {
          title: "Họ và tên",
          dataIndex: "full_name",
          key: "full_name",
        },
        {
          title: "Số điện thoại",
          dataIndex: "phone_number",
          key: "phone_number",
        },
        {
          title: "Email",
          dataIndex: "email",
          key: "email",
        },
        {
          title: "Nhân viên lễ tân",
          dataIndex: "receptionist",
          key: "receptionist",
        },
        {
          title: "Y tá tiếp nhận",
          dataIndex: "nurse",
          key: "nurse",
        },
        {
          title: "Trạng thái chữa bệnh",
          dataIndex: "treatment_status",
          key: "treatment_status",
        },
        {
          title: "Bác sĩ",
          dataIndex: "doctor",
          key: "doctor",
        },
        {
          title: "Ngày hẹn tái khám",
          dataIndex: "reexamination_date",
          key: "reexamination_date",
          render: (date: string) => new Date(date).toLocaleDateString(),
        },
      ];

    default:
      return [];
  }
};

export const getColumnsTherapy = (status: string) => {
  switch (status) {
    case "Trị liệu":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "code",
          key: "code",
        },
        {
          title: "Họ và tên",
          render: (_: any, record: any) => record?.customer_details?.name,
        },
        {
          title: "Số điện thoại",
          render: (_: any, record: any) => record?.customer_details?.mobile,
        },
        {
          title: "Loại đơn",
          render: (_: any, record: any) => {
            if (record?.type === "both") {
              return "Cả hai";
            } else if (record?.type === "service") {
              return "Dịch vụ";
            } else if (record?.type === "product") {
              return "Sản phẩm";
            }
            return "";
          },
        },
        {
          title: "Chuẩn đoán",
          render: (_: any, record: any) =>
            record?.doctor_process_details?.diagnosis,
        },
        {
          title: "Số buổi trị liệu",
          dataIndex: "treatment_sessions_remaining",
          key: "treatment_sessions_remaining",
          render: (text: any, record: any) =>
            record?.treatment_sessions_remaining ||
            (record?.uncompleted_sessions_tlcbs + record?.uncompleted_sessions_tldss || 0),
        },
        {
          title: "Số buổi đã thực hiện",
          dataIndex: "treatment_sessions_done",
          key: "treatment_sessions_done",
          render: (text: any, record: any) =>
            record?.treatment_sessions_done ||
            (record?.completed_sessions_tlcbs + record?.completed_sessions_tldss || 0),
        },
        {
          title: "Số buổi trị liệu dưỡng sinh",
          dataIndex: "completed_sessions_tldss",
          key: "completed_sessions_tldss",
        },
        {
          title: "Số buổi trị liệu chữa bệnh",
          dataIndex: "completed_sessions_tlcbs",
          key: "completed_sessions_tlcbs",
        },
      ];

    case "Trị liệu chữa bệnh":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "code",
          key: "code",
        },
        {
          title: "Họ và tên",
          render: (_: any, record: any) => record?.customer_details?.name,
        },
        {
          title: "Số điện thoại",
          render: (_: any, record: any) => record?.customer_details?.mobile,
        },
        {
          title: "Loại đơn",
          render: (_: any, record: any) => {
            if (record?.type === "both") {
              return "Cả hai";
            } else if (record?.type === "service") {
              return "Dịch vụ";
            } else if (record?.type === "product") {
              return "Sản phẩm";
            }
            return "";
          },
        },
        {
          title: "Chuẩn đoán",
          render: (_: any, record: any) =>
            record?.doctor_process_details?.diagnosis,
        },
        {
          title: "Chuyên gia trị liệu",
          render: (_: any, record: any) =>
            record?.doctor_process_details?.assigned_doctor_name ||
            record?.doctor_process_details?.assigned_doctor,
        },
        {
          title: "Số buổi đã xong",
          dataIndex: "completed_sessions_tlcbs",
          key: "completed_sessions_tlcbs",
        },
        {
          title: "Số buổi còn lại",
          dataIndex: "uncompleted_sessions_tlcbs",
          key: "uncompleted_sessions_tlcbs",
        },
      ];

    case "Trị liệu dưỡng sinh":
      return [
        {
          title: "STT",
          dataIndex: "index",
          key: "index",
          render: (_: any, __: any, index: any) => index + 1,
        },
        {
          title: "Mã đơn",
          dataIndex: "code",
          key: "code",
        },
        {
          title: "Họ và tên",
          render: (_: any, record: any) => record?.customer_details?.name,
        },
        {
          title: "Số điện thoại",
          render: (_: any, record: any) => record?.customer_details?.mobile,
        },
        {
          title: "Loại đơn",
          render: (_: any, record: any) => {
            if (record?.type === "both") {
              return "Cả hai";
            } else if (record?.type === "service") {
              return "Dịch vụ";
            } else if (record?.type === "product") {
              return "Sản phẩm";
            }
            return "";
          },
        },
        {
          title: "Chuẩn đoán",
          render: (_: any, record: any) =>
            record?.doctor_process_details?.diagnosis,
        },
        {
          title: "Chuyên gia trị liệu",
          render: (_: any, record: any) =>
            record?.doctor_process_details?.assigned_doctor_name ||
            record?.doctor_process_details?.assigned_doctor,
        },
        {
          title: "Số buổi đã xong",
          dataIndex: "completed_sessions_tldss",
          key: "completed_sessions_tldss",
        },
        {
          title: "Số buổi còn lại",
          dataIndex: "uncompleted_sessions_tldss",
          key: "uncompleted_sessions_tldss",
        },
      ];

    default:
      return [];
  }
};
