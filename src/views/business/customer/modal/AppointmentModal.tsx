"use client";

import React, { useMemo, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Radio,
  Input,
  Button,
  message,
  Row,
  Col,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useCreateBookingMutation, useEditBookingMutation } from "@/api/app_treatment/apiTreatment";
import { useGetCustomerListQuery } from "@/api/app_customer/apiMarketing";

dayjs.extend(customParseFormat);

type Option = { label: string; value: number };
type BookingType = "examination" | "treatment_cure" | "treatment_relax" | "re_examination";

type UpsertPayload = {
  customer: number;
  type: BookingType;
  receiving_day: string; // YYYY-MM-DD
  set_date: string;      // HH:mm:ss
  note?: string;
};

type EditingBooking = {
  id: number;
  customer: number;
  type: BookingType;
  receiving_day: string; // "YYYY-MM-DD" hoặc ISO
  set_date: string;      // "HH:mm:ss" | "HH:mm" | ISO
  note?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (createdOrUpdated: any) => void;

  /** Nếu parent đã có sẵn options thì truyền vào, tránh fetch */
  customerOptions?: Option[];
  defaultCustomerId?: number;

  /** Chế độ: tạo mới | chỉnh sửa */
  mode?: "create" | "edit";
  /** Dữ liệu dùng cho chế độ edit */
  editing?: EditingBooking | null;
};

const TYPE_OPTIONS: ReadonlyArray<{ label: string; value: BookingType }> = [
  { label: "Khám và tư vấn", value: "examination" },
  { label: "Trị liệu chữa bệnh", value: "treatment_cure" },
  { label: "Trị liệu dưỡng sinh", value: "treatment_relax" },
  { label: "Tái khám", value: "re_examination" },
] as const;

/** --- Helpers parse date/time linh hoạt --- */
function toDayObj(val?: string | Dayjs) {
  if (!val) return undefined;
  if (dayjs.isDayjs(val)) return val as Dayjs;

  const s = String(val);
  // Nếu là ISO (có 'T'), để dayjs tự parse
  if (s.includes("T")) {
    const d = dayjs(s);
    return d.isValid() ? d : undefined;
  }
  // Không phải ISO: parse theo định dạng ngày thông dụng
  const parsed = dayjs(s, ["YYYY-MM-DD", "DD/MM/YYYY"], true);
  return parsed.isValid() ? parsed : undefined;
}

function toTimeObj(val?: string | Dayjs) {
  if (!val) return undefined;
  if (dayjs.isDayjs(val)) return val as Dayjs;

  const s = String(val);
  // Lấy phần giờ nếu là ISO
  const timeStr = s.includes("T")
    ? s.slice(s.indexOf("T") + 1, s.indexOf("T") + 9) // HH:mm:ss
    : s;

  const parsed = dayjs(timeStr, ["HH:mm:ss", "HH:mm"], true);
  return parsed.isValid() ? parsed : undefined;
}
/** --- end helpers --- */

export default function AppointmentModal({
  open,
  onClose,
  onSuccess,
  customerOptions,
  defaultCustomerId,
  mode = "create",
  editing = null,
}: Props) {
  const [form] = Form.useForm();
  const [createBooking, { isLoading: creating }] = useCreateBookingMutation();
  const [updateBooking, { isLoading: updating }] = useEditBookingMutation();
  const isEdit = mode === "edit" && !!editing;

  // Tự fetch danh sách khách hàng nếu không truyền từ props
  const {
    data: fetchedCustomers,
    isFetching: isFetchingCustomers,
  } = useGetCustomerListQuery(undefined, {
    skip: Array.isArray(customerOptions) && customerOptions.length > 0,
  });

  // Chuẩn hóa options cho Select khách hàng
  const customerSelectOptions: Option[] = useMemo(() => {
    if (Array.isArray(customerOptions) && customerOptions.length > 0) {
      return customerOptions;
    }
    const list = Array.isArray(fetchedCustomers)
      ? fetchedCustomers
      : fetchedCustomers?.results ?? [];
    return list.map((c: any) => ({
      label: [c.code, c.full_name ?? c.name].filter(Boolean).join(" - "),
      value: Number(c.id),
    }));
  }, [customerOptions, fetchedCustomers]);

  // Set giá trị form mỗi khi mở modal / đổi chế độ / đổi editing
  useEffect(() => {
    if (!open) return;
    if (isEdit && editing) {
      form.setFieldsValue({
        customer: editing.customer,
        type: editing.type,
        receiving_day: toDayObj(editing.receiving_day),
        set_date: toTimeObj(editing.set_date),
        note: editing.note ?? "",
      });
    } else {
      // create mode
      form.setFieldsValue({
        customer: defaultCustomerId ?? undefined,
        type: "examination",
        receiving_day: undefined,
        set_date: undefined,
        note: "",
      });
    }
  }, [open, isEdit, editing, defaultCustomerId, form]);

  const initialValues = useMemo(
    () => ({
      // chỉ dùng lần mount đầu; lần mở sau đã có setFieldsValue
      customer: isEdit ? editing?.customer : defaultCustomerId,
      type: isEdit ? editing?.type : "examination",
      receiving_day: isEdit ? toDayObj(editing?.receiving_day) : undefined,
      set_date: isEdit ? toTimeObj(editing?.set_date) : undefined,
      note: isEdit ? editing?.note ?? "" : "",
    }),
    [isEdit, editing, defaultCustomerId]
  );

  const handleSubmit = async (values: any) => {
    const payload: UpsertPayload = {
      customer: values.customer,
      type: values.type,
      receiving_day: dayjs(values.receiving_day).format("YYYY-MM-DD"),
      set_date: dayjs(values.set_date).format("HH:mm:ss"),
      note: values.note || "",
    };

    try {
      let result: any;
      if (isEdit && editing) {
        result = await updateBooking({ id: editing.id, ...payload } as any).unwrap();
        message.success("Cập nhật lịch hẹn thành công!");
      } else {
        result = await createBooking(payload as any).unwrap();
        message.success("Đặt lịch thành công!");
      }
      form.resetFields();
      onClose();
      onSuccess?.(result);
    } catch (err: any) {
      const apiMsg =
        err?.data?.detail ||
        // lấy thông điệp đầu tiên trong object error của DRF
        (err?.data &&
          Object.values(err.data)
            ?.flat?.()
            ?.find?.((x: any) => typeof x === "string")) ||
        "Thao tác không thành công";
      message.error(String(apiMsg));
    }
  };

  const footer = (
    <div className="flex w-full justify-end gap-2">
      <Button onClick={onClose}>Hủy</Button>
      <Button
        type="primary"
        className="bg-[#BD8306]"
        loading={creating || updating}
        onClick={() => form.submit()}
      >
        {isEdit ? "Cập nhật" : "Xác nhận"}
      </Button>
    </div>
  );

  return (
    <Modal
      title={
        <div className="font-semibold text-[#BD8306]">
          {isEdit ? "Cập nhật lịch hẹn" : "Đặt lịch"}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={footer}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        layout="vertical"
        form={form}
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        {/* Khách hàng */}
        <Form.Item
          name="customer"
          label="Chọn khách hàng"
          rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
        >
          <Select
            showSearch
            allowClear
            placeholder="Nhập tên / mã khách hàng"
            loading={isFetchingCustomers}
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            options={customerSelectOptions}
          />
        </Form.Item>

        {/* Loại lịch hẹn */}
        <Form.Item
          name="type"
          label="Loại lịch hẹn"
          rules={[{ required: true, message: "Vui lòng chọn loại lịch hẹn" }]}
        >
          <Radio.Group
            optionType="default"
            buttonStyle="solid"
            options={TYPE_OPTIONS as any}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="set_date"
              label="Giờ hẹn đến"
              rules={[{ required: true, message: "Vui lòng chọn giờ hẹn đến" }]}
            >
              <TimePicker className="w-full" format="HH:mm" minuteStep={5} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="receiving_day"
              label="Ngày hẹn"
              rules={[{ required: true, message: "Vui lòng chọn ngày hẹn" }]}
            >
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        {/* Ghi chú */}
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea
            placeholder="Ghi chú thêm (không bắt buộc)"
            autoSize={{ minRows: 2 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
