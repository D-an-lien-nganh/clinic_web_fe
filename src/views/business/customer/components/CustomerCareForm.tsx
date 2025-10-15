import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Space, message, DatePicker, Input, Select, Spin, Alert } from "antd";
import { PlusOutlined, SaveOutlined, EditOutlined, CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  useCreateCustomerCareMutation,
  useEditCustomerCareMutation,
  useDeleteCustomerCareMutation,
  useGetCustomerCareByCustomerQuery,
} from "@/api/app_customer/apiMarketing";
import dayjs, { Dayjs } from "dayjs";

const { Option } = Select;

/** ===== Trạng thái cuộc gọi: map code <-> label theo backend ===== */
const SOLIDARITY_CODE_TO_LABEL = {
  glls: "Gọi lại lần sau",
  tb: "Thuê bao",
  knm: "Không nghe máy",
  cn: "Cân nhắc",
  dc: "Đã chốt",
  tc: "Từ chối",
} as const;

type SolidarityCode = keyof typeof SOLIDARITY_CODE_TO_LABEL;
type SolidarityLabel = (typeof SOLIDARITY_CODE_TO_LABEL)[SolidarityCode];

const SOLIDARITY_LABEL_TO_CODE: Record<SolidarityLabel, SolidarityCode> = Object.fromEntries(
  Object.entries(SOLIDARITY_CODE_TO_LABEL).map(([k, v]) => [v, k])
) as any;

/** ===== Types ===== */
export type CallRecord = {
  id: number;            // local key
  id_backend?: number;   // server id
  lan: number;
  ngay: Dayjs;
  noiDung: string;
  cuocGoi: "Cuộc gọi đi" | "Cuộc gọi đến";
  trangThai: SolidarityLabel;
  isEditing?: boolean;
};

interface CustomerCareFormProps {
  isUpdateMode?: boolean;
  initialCalls?: CallRecord[];
  customerId?: number;
}

export const CustomerCareForm: React.FC<CustomerCareFormProps> = ({
  isUpdateMode = false,
  initialCalls = [],
  customerId,
}) => {
  // ===== Query list theo khách hàng khi Update =====
  const {
    data: careList,
    isFetching: isLoadingCare,
    isError,
    refetch,
  } = useGetCustomerCareByCustomerQuery(customerId!, {
    skip: !isUpdateMode || !customerId,
  });

  // Code -> Record (label hoá theo mapping mới)
  const mapServerToRecord = (item: any, index: number): CallRecord => {
    const cuocGoi: CallRecord["cuocGoi"] = item.type === "incoming" ? "Cuộc gọi đến" : "Cuộc gọi đi";

    // an toàn: nếu backend gửi code lạ thì hiển thị raw code
    const label = SOLIDARITY_CODE_TO_LABEL[(item.solidarity as SolidarityCode)] || (item.solidarity || "");
    return {
      id: Number(`${item.id}${index}`),
      id_backend: item.id,
      lan: index + 1,
      ngay: dayjs(item.date),
      noiDung: item.note || "",
      cuocGoi,
      trangThai: (label as SolidarityLabel) || "Gọi lại lần sau",
      isEditing: false,
    };
  };

  // ===== STATE =====
  const [calls, setCalls] = useState<CallRecord[]>(
    isUpdateMode ? initialCalls.map((c, i) => ({ ...c, isEditing: false, lan: i + 1 })) : []
  );

  // Khi có dữ liệu API => sync state
  useEffect(() => {
    if (isUpdateMode && Array.isArray(careList)) {
      const mapped = careList.map(mapServerToRecord);
      setCalls(mapped);
    }
  }, [isUpdateMode, careList]);

  const [createCustomerCare] = useCreateCustomerCareMutation();
  const [editCustomerCare] = useEditCustomerCareMutation();
  const [deleteCustomerCare] = useDeleteCustomerCareMutation();

  const addCall = () =>
    setCalls((prev) => [
      ...prev,
      {
        id: Date.now(),
        lan: prev.length + 1,
        ngay: dayjs(),
        noiDung: "",
        cuocGoi: "Cuộc gọi đi",
        trangThai: "Gọi lại lần sau",
        isEditing: true,
      },
    ]);

  const editCall = (id: number) => {
    if (!isUpdateMode) return;
    setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, isEditing: true } : c)));
  };

  const cancelEditCall = (id: number) => {
    if (!isUpdateMode) {
      setCalls((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCalls((prev) => prev.map((c) => (c.id === id ? { ...c, isEditing: false } : c)));
    }
  };

  const handleSaveCall = async (call: CallRecord) => {
    if (!customerId) {
      message.error("Thiếu ID khách hàng, không thể lưu lịch sử.");
      return;
    }

    const payload = {
      customer: customerId,
      date: call.ngay.format("YYYY-MM-DD"),
      note: call.noiDung,
      type: call.cuocGoi === "Cuộc gọi đến" ? "incoming" : "outgoing",
      solidarity: SOLIDARITY_LABEL_TO_CODE[call.trangThai] as SolidarityCode, // map ngược label -> code
    };

    try {
      if (call.id_backend) {
        await editCustomerCare({ id: call.id_backend, ...payload }).unwrap();
        message.success("Cập nhật cuộc gọi thành công");
      } else {
        const res = await createCustomerCare(payload).unwrap();
        call.id_backend = res.id;
        message.success("Tạo mới cuộc gọi thành công");
      }
      call.isEditing = false;
      setCalls((prev) => [...prev]);

      // đồng bộ lại thứ tự/lần từ server
      if (isUpdateMode) refetch();
    } catch (err) {
      message.error("Lưu cuộc gọi thất bại");
      console.error(err);
    }
  };

  const handleDeleteCall = async (call: CallRecord) => {
    try {
      if (call.id_backend) {
        await deleteCustomerCare({ customerCareId: call.id_backend }).unwrap();
      }
      message.success("Xóa thành công");
      setCalls((prev) => prev.filter((c) => c.id !== call.id));
      if (isUpdateMode) refetch();
    } catch (err) {
      message.error("Xóa thất bại");
    }
  };

  // ===== Options Select trạng thái theo mapping mới =====
  const solidarityOptions = useMemo(
    () =>
      (Object.entries(SOLIDARITY_CODE_TO_LABEL) as [SolidarityCode, SolidarityLabel][])
        .map(([code, label]) => ({ code, label })),
    []
  );

  const columns = [
    { title: "Lần", dataIndex: "lan", key: "lan", align: "center" as const },
    {
      title: "Ngày",
      dataIndex: "ngay",
      key: "ngay",
      align: "center" as const,
      render: (_: any, rec: CallRecord) => (
        <DatePicker
          value={rec.ngay}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
          disabled={!rec.isEditing}
          onChange={(d) =>
            setCalls((prev) =>
              prev.map((c) => (c.id === rec.id ? { ...c, ngay: d! } : c))
            )
          }
        />
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "noiDung",
      key: "noiDung",
      align: "center" as const,
      render: (_: any, rec: CallRecord) => (
        <Input
          value={rec.noiDung}
          disabled={!rec.isEditing}
          onChange={(e) =>
            setCalls((prev) =>
              prev.map((c) =>
                c.id === rec.id ? { ...c, noiDung: e.target.value } : c
              )
            )
          }
        />
      ),
    },
    {
      title: "Cuộc gọi",
      dataIndex: "cuocGoi",
      key: "cuocGoi",
      align: "center" as const,
      render: (_: any, rec: CallRecord) => (
        <Select
          value={rec.cuocGoi}
          style={{ width: "100%" }}
          disabled={!rec.isEditing}
          onChange={(val: CallRecord["cuocGoi"]) =>
            setCalls((prev) =>
              prev.map((c) => (c.id === rec.id ? { ...c, cuocGoi: val } : c))
            )
          }
        >
          <Option value="Cuộc gọi đi">Cuộc gọi đi</Option>
          <Option value="Cuộc gọi đến">Cuộc gọi đến</Option>
        </Select>
      ),
    },
    {
      title: "Trạng thái cuộc gọi",
      dataIndex: "trangThai",
      key: "trangThai",
      align: "center" as const,
      render: (_: any, rec: CallRecord) => (
        <Select
          value={rec.trangThai}
          disabled={!rec.isEditing}
          style={{ width: "100%" }}
          onChange={(val: SolidarityLabel) =>
            setCalls((prev) =>
              prev.map((c) => (c.id === rec.id ? { ...c, trangThai: val } : c))
            )
          }
        >
          {solidarityOptions.map(({ code, label }) => (
            <Option key={code} value={label}>
              {label}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center" as const,
      render: (_: any, rec: CallRecord) => {
        if (!isUpdateMode) {
          return rec.isEditing ? (
            <Space>
              <Button icon={<SaveOutlined />} type="text" onClick={() => handleSaveCall(rec)} title="Lưu" />
              <Button icon={<DeleteOutlined />} type="text" danger onClick={() => cancelEditCall(rec.id)} title="Xóa" />
            </Space>
          ) : null;
        }

        return rec.isEditing ? (
          <Space>
            <Button icon={<SaveOutlined />} type="text" onClick={() => handleSaveCall(rec)} title="Lưu" />
            <Button icon={<CloseOutlined />} type="text" danger onClick={() => cancelEditCall(rec.id)} title="Hủy" />
          </Space>
        ) : (
          <Space>
            <Button icon={<EditOutlined />} type="text" onClick={() => editCall(rec.id)} title="Chỉnh sửa" />
            <Button icon={<DeleteOutlined />} type="text" danger onClick={() => handleDeleteCall(rec)} title="Xóa" />
          </Space>
        );
      },
    },
  ];

  // ===== UI Loading / Error =====
  if (isUpdateMode && isLoadingCare) {
    return <Spin className="w-full" />;
  }
  if (isUpdateMode && isError) {
    return <Alert type="error" message="Không tải được lịch sử chăm sóc khách hàng." />;
  }

  return (
    <>
      {(!isUpdateMode && calls.length === 0 && (
        <Button type="dashed" className="w-full mb-4" icon={<PlusOutlined />} onClick={addCall}>
          Thêm cuộc gọi
        </Button>
      )) || (
        <>
          <Table
            dataSource={calls.map((c) => ({ ...c, key: c.id }))}
            columns={columns}
            pagination={false}
            scroll={{ x: 800 }}
            loading={isUpdateMode && isLoadingCare}
          />
          <Button type="dashed" className="w-full mt-4" icon={<PlusOutlined />} onClick={addCall}>
            Thêm
          </Button>
        </>
      )}
    </>
  );
};
