"use client";
import React, { useEffect, useState } from "react";
import {
  Tabs,
  Table,
  Checkbox,
  TabsProps,
  Form,
  Button,
  Input,
  Select,
  message,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import DeleteConfirm from "@/components/Popconfirm/DeleteConfirm";
import {
  useDeleteBookingMutation,
  useGetBookingListQuery,
  useUpdateHasComeMutation,
} from "@/api/app_treatment/apiTreatment";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import AppointmentModal from "../../customer/modal/AppointmentModal";
import { useRouter } from "next/navigation";

export type BookingType =
  | "examination"
  | "treatment_cure"
  | "treatment_relax"
  | "re_examination";

type EditingForModal = {
  id: number;
  customer: number;
  type: BookingType;
  receiving_day: string; // YYYY-MM-DD
  set_date: string; // HH:mm:ss
  note?: string;
};

interface DataType {
  id: number;
  customer_info: {
    id: number;
    code: string;
    mobile: string;
    email: string;
    level: number;
    name: string;
    level_str: string;
    marketer_full: string;
  };
  time_frame_str: string;
  lead_status_code: string;
  created: string;
  status: string;
  note: string;
  has_come: boolean;
  type: BookingType | string;
  is_treatment: boolean;
  classification: string;
  experience_day: string;
  receiving_day: string; // YYYY-MM-DD
  set_date?: string; // HH:mm:ss
  user: number;
  customer: number;
  time_frame: number;
  reception: number;
}

type PaginationState = {
  current: number;
  pageSize: number;
  is_treatment: boolean;
  time_frame_id?: number;
  searchTerm: string;
  startDate: string;
  endDate: string;
  has_come?: boolean | null; // ⬅️ filter trạng thái
};

const ScheduleTab = ({
  is_treatment,
  title,
}: {
  is_treatment: boolean;
  title: string;
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const isCollapse = useSelector(
    (state: RootState) => state.collapse.isCollapse
  );

  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    is_treatment,
    time_frame_id: undefined,
    searchTerm: "",
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    has_come: null, // mặc định: tất cả
  });

  const {
    data: bookingData,
    isLoading,
    refetch,
  } = useGetBookingListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    is_treatment: pagination.is_treatment,
    time_frame_id: pagination.time_frame_id, // undefined => backend bỏ qua
    searchTerm: pagination.searchTerm,
    startDate: pagination.startDate,
    endDate: pagination.endDate,
    has_come: pagination.has_come === null ? undefined : pagination.has_come,
  });

  const [updateHasCome] = useUpdateHasComeMutation();

  // ====== modal state ======
  const [openAppointment, setOpenAppointment] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<EditingForModal | null>(null);
  const [defaultCustomerId, setDefaultCustomerId] = useState<number>();

  // sort theo time_frame
  const sortedData: DataType[] = bookingData?.results
    ? [...bookingData.results].sort(
        (a: any, b: any) => a.time_frame - b.time_frame
      )
    : [];

  const extractStartTime = (time_frame_str?: string): string | null => {
    if (!time_frame_str) return null;
    const parts = time_frame_str.split("-").map((s) => s.trim());
    if (parts.length >= 1) {
      const hhmm = parts[0];
      if (/^\d{2}:\d{2}$/.test(hhmm)) return `${hhmm}:00`;
    }
    return null;
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditing(null);
    setDefaultCustomerId(undefined);
    setOpenAppointment(true);
  };

  const openEditModalFromRecord = (record: DataType) => {
    const setDateGuess =
      record.set_date || extractStartTime(record.time_frame_str) || "08:00:00";

    const data: EditingForModal = {
      id: Number(record.id),
      customer: record.customer ?? record.customer_info?.id,
      type: (record.type as BookingType) ?? "examination",
      receiving_day:
        record.receiving_day || dayjs(record.created).format("YYYY-MM-DD"),
      set_date: setDateGuess,
      note: record.note ?? "",
    };

    setModalMode("edit");
    setEditing(data);
    setDefaultCustomerId(data.customer);
    setOpenAppointment(true);
  };

  const isLate = (note: string) => {
    const [hours, minutes] = note.split(":").map((str) => parseInt(str, 10));
    const noteTime = new Date();
    noteTime.setHours(hours || 0, minutes || 0, 0, 0);
    const currentTime = new Date();
    return noteTime < currentTime;
  };

  const rowClassName = (record: DataType) => {
    if (!record.has_come && isLate(record.note || "")) {
      return "late-deadline";
    }
    return "";
  };

  useEffect(() => {
    if (currentDate) {
      setPagination((prev) => ({
        ...prev,
        startDate: dayjs(currentDate).format("YYYY-MM-DD"),
        endDate: dayjs(currentDate).format("YYYY-MM-DD"),
      }));
    }
  }, [currentDate]);

  const handleCheckboxChange = async (
    record: { id: number },
    checked: boolean
  ) => {
    try {
      await updateHasCome({ id: record.id, has_come: checked }).unwrap();
      message.success(
        checked
          ? "Cập nhật trạng thái khách đã đến"
          : "Cập nhật trạng thái khách chưa đến"
      );
      refetch();
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current ?? prev.current,
      pageSize: newPagination.pageSize ?? prev.pageSize,
    }));
  };

  const getRowSpan = (
    record: { time_frame: number },
    rowIndex: number | undefined
  ) => {
    const isFirstInGroup =
      rowIndex === 0 ||
      (rowIndex && record.time_frame !== sortedData[rowIndex - 1]?.time_frame);
    const rowSpan = isFirstInGroup
      ? sortedData.filter((item) => item.time_frame === record.time_frame)
          .length
      : 0;
    return rowSpan;
  };

  const role = "doctor" as "doctor" | "receptionist";

  const goToCustomerCare = (id: number, tab = "1") => {
    router.push(
      `/app/customer/customer-info?tab=${tab}&customerId=${id}&role=${role}`
    );
  };

  const BOOKING_TYPE = [
    { value: "examination", label: "Khám" },
    { value: "treatment_cure", label: "TLCB" },
    { value: "treatment_relax", label: "TLDS" },
    { value: "re_examination", label: "Tái khám" },
  ];

  const columns: ColumnsType<DataType> = [
    {
      title: "STT",
      width: 50,
      render: (text, record, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      align: "center",
    },
    {
      title: "Tên KH",
      align: "center",
      render: (_: any, record: DataType) => (
        <button
          type="button"
          onClick={() => goToCustomerCare(record.customer, "1")}
          className="cursor-pointer hover:text-blue-600 hover:underline"
        >
          {record.customer_info?.name}
        </button>
      ),
    },
    {
      title: "Số điện thoại",
      render: (_, { customer_info }) => customer_info?.mobile,
      align: "center",
    },
    {
      title: "Phân loại KH",
      render: (_, { type }) =>
        BOOKING_TYPE.find((i) => i.value === type)?.label ?? "Không rõ",
      align: "center",
    },
    { title: "Giờ hẹn đến", dataIndex: "set_date", align: "center" },
    {
      title: "KH đã đến",
      width: 100,
      render: (_, { id, has_come }) => (
        <Checkbox
          checked={has_come}
          disabled={has_come}
          onChange={(e) => handleCheckboxChange({ id }, e.target.checked)}
        />
      ),
      align: "center",
    },
    {
      title: "Trạng thái",
      dataIndex: "has_come",
      align: "center",
      render: (has_come: boolean) =>
        has_come ? "Khách đã đến" : "Khách chưa đến",
    },
    {
      align: "center",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <div className="flex justify-center items-center gap-2">
          <Button size="small" onClick={() => openEditModalFromRecord(record)}>
            Sửa
          </Button>
          <DeleteConfirm
            id={record.id}
            title={title}
            useDeleteMutation={useDeleteBookingMutation}
            onDeleted={() => {
              refetch();
            }}
          />
        </div>
      ),
    },
    {
      title: "Tổng",
      align: "center",
      width: 70,
      fixed: "right",
      render: (_, record, rowIndex) => (
        <div className="font-bold">{getRowSpan(record, rowIndex)}</div>
      ),
      onCell: (record, rowIndex) => {
        return { rowSpan: getRowSpan(record, rowIndex) };
      },
    },
  ];

  const onFinish = (values: any) => {
    // map select trạng thái → boolean | null
    let mapped: boolean | null = null;
    if (values.has_come === "arrived") mapped = true;
    else if (values.has_come === "not_arrived") mapped = false;
    else mapped = null;

    setPagination((prev) => ({
      ...prev,
      current: 1,
      searchTerm: (values.searchTerm || "").trim(),
      has_come: mapped,
    }));
  };

  return (
    <div
      className={`w-screen ${
        isCollapse ? "md:w-[calc(100vw-150px)]" : "md:w-[calc(100vw-350px)]"
      }`}
    >
      <div className="md:flex w-full gap-2 flex-1 items-center mb-4">
        <Form
          className="form-wrapper !flex !flex-1 !w-full"
          form={form}
          onFinish={onFinish}
          initialValues={{ searchTerm: "", has_come: "all" }}
        >
          <div className="border p-2 flex flex-wrap gap-2 items-center w-full sm:border-white">
            {/* Input tên KH — ngắn vừa đủ dùng */}
            <Form.Item name="searchTerm" className="!mb-0">
              <Input
                placeholder="Nhập tên khách hàng"
                style={{ width: 250 }}
                allowClear
                onPressEnter={() => form.submit()}
              />
            </Form.Item>

            {/* Select lọc trạng thái */}
            <Form.Item name="has_come" className="!mb-0">
              <Select
                style={{ width: 150 }}
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "arrived", label: "Khách đã đến" },
                  { value: "not_arrived", label: "Khách chưa đến" },
                ]}
                onChange={() => form.submit()} // đổi option sẽ lọc ngay
              />
            </Form.Item>

            {/* Nút Lọc (submit form) */}
            <Button type="primary" htmlType="submit">
              Lọc
            </Button>

            {/* Thêm lịch hẹn */}
            <Button
              type="primary"
              className="bg-[#BD8306] ml-auto"
              onClick={openCreateModal}
            >
              Thêm lịch hẹn
            </Button>
          </div>
        </Form>
      </div>

      <Table
        bordered
        rowKey="id"
        columns={columns}
        loading={isLoading}
        scroll={{ x: 1500, y: 350 }}
        rowClassName={rowClassName}
        dataSource={sortedData || []}
        onChange={handleTableChange}
        pagination={{
          ...pagination,
          total: bookingData?.total || 0,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100", "200"],
        }}
        footer={() => {
          const totalNotArrived =
            sortedData?.filter((item) => !item.has_come).length || 0;
          const totalArrived =
            sortedData?.filter((item) => item.has_come).length || 0;
          const totalCustomers = sortedData?.length || 0;

          return (
            bookingData?.results?.length > 0 && (
              <div className="flex justify-end px-4 py-2">
                <div>
                  <div className="flex justify-between">
                    <p>Tổng KH chưa đến:</p>
                    <div className="w-[40px] text-center font-bold">
                      {totalNotArrived}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p>Tổng KH đã đến:</p>
                    <div className="w-[40px] text-center font-bold">
                      {totalArrived}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p>Tổng KH:</p>
                    <div className="w-[40px] text-center font-bold">
                      {totalCustomers}
                    </div>
                  </div>
                </div>
              </div>
            )
          );
        }}
        title={() => (
          <div className="flex items-center justify-center space-x-4 py-2">
            <button
              onClick={() => setCurrentDate((prev) => prev.subtract(1, "day"))}
              className="flex items-center justify-center w-8 h-8 rounded-full border"
            >
              <FaChevronLeft className="text-gray-500" />
            </button>
            <div className="text-center font-bold text-lg text-gray-600">
              {currentDate.format("MMM DD, YYYY")}
            </div>
            <button
              onClick={() => setCurrentDate((prev) => prev.add(1, "day"))}
              className="flex items-center justify-center w-8 h-8 rounded-full border"
            >
              <FaChevronRight className="text-gray-500" />
            </button>
          </div>
        )}
      />

      <AppointmentModal
        open={openAppointment}
        onClose={() => setOpenAppointment(false)}
        onSuccess={() => {
          setOpenAppointment(false);
          refetch();
        }}
        customerOptions={[]}
        defaultCustomerId={defaultCustomerId}
        mode={modalMode}
        editing={editing as any}
      />
    </div>
  );
};

const Schedule: React.FC = () => {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Lịch đến khám",
      children: <ScheduleTab is_treatment={false} title="lịch hẹn" />,
    },
    {
      key: "2",
      label: "Lịch trị liệu với chuyên gia",
      children: <ScheduleTab is_treatment={true} title="lịch trị liệu" />,
    },
  ];
  return (
    <div className="px-6">
      <Tabs className="mt-6" defaultActiveKey="1" items={items} />
    </div>
  );
};

export default Schedule;
