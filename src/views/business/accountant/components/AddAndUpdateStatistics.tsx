import React, { useState } from "react";
import { Button, Form, Input, Modal, notification, Radio, Select } from "antd";
import {
  useCreatePaymentHistoryMutation,
  useGetBillsListQuery,
} from "@/api/app_treatment/apiTreatment";
import dayjs, { Dayjs } from "dayjs";

interface CustomerDetails {
  id: number;
  code: string;
  name: string;
  mobile: string;
  email: string;
  level: string | null;
  level_str: string | null;
  marketer_full: string;
}
interface BookingDetails {
  id: number;
  created: string;
  code: string;
  user: number;
  customer_details: CustomerDetails;
  booking: number;
  paid_ammount: string;
  type: string;
  method: string;
  fully_paid: boolean;
  total_amount: number;
  amount_remaining: number;
  total_amount_real: number;
}

export default function AddAndUpdateStatistics({
  edit,
  data,
  refresh,
}: {
  edit?: boolean;
  data?: any;
  refresh?: () => void;
}) {
  const [form] = Form.useForm();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    startDate: dayjs(currentDate).format("YYYY-MM-DD"),
    endDate: dayjs(currentDate).format("YYYY-MM-DD"),
  });
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState("");

  const { data: billList } = useGetBillsListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    startDate: pagination.startDate,
    endDate: pagination.endDate,
  });
  
  const [createBill, isLoading] = useCreatePaymentHistoryMutation();
  const onSelectBill = (value: number) => {
    const selectedBill = billList?.results.find(
      (bill: BookingDetails) => bill.id === value
    );
    if (selectedBill) {
      form.setFieldsValue({
        name: selectedBill.customer_details?.name,
        total_amount: selectedBill.total_amount,
        total_amount_real: selectedBill.total_amount_real,
        amount_remaining: selectedBill.amount_remaining,
      });
    }
  };

  const showModal = () => {
    setOpen(true);
  };
  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
    refresh?.();
  };

  const onFinish = async (values: any) => {
    try {
      let result = edit ? "" : await createBill(values).unwrap();
      notification.success({
        message: `${edit ? "Sửa" : "Thêm"} hóa đơn thành công`,
        placement: "bottomRight",
      });
      handleCancel();
    } catch (error) {
      notification.error({
        message: `${edit ? "Sửa" : "Thêm"} hóa đơn thất bại`,
        placement: "bottomRight",
      });
    }
  };

  return (
    <>
      <Button
        style={{
          backgroundColor: "#BD8306",
          color: "white",
          border: "none",
        }}
        onClick={showModal}
        size={edit ? "small" : "middle"}
      >
        {edit ? "Sửa" : "Thêm công nợ"}
      </Button>
      <Modal
        open={open}
        title={edit ? "Sửa công nợ" : "Thêm công nợ"}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="bill"
            label="Mã đơn khám"
            rules={[{ required: true, message: "Vui lòng nhập mã đơn khám!" }]}
          >
            <Select
              placeholder="Chọn mã đơn khám"
              allowClear
              onChange={onSelectBill}
            >
              {billList?.results.map((i: { id: number; code: string }) => (
                <Select.Option key={i.id} value={i.id}>
                  {i.code}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="Tên khách hàng">
            <Input disabled />
          </Form.Item>
          <Form.Item name="total_amount" label="Tổng giá trị đơn khám">
            <Input className="!w-full" disabled />
          </Form.Item>
          <Form.Item name="total_amount_real" label="Tổng thực thu">
            <Input className="!w-full" disabled />
          </Form.Item>
          <Form.Item name="amount_remaining" label="Nợ">
            <Input className="!w-full" disabled />
          </Form.Item>
          <Form.Item name="paid_amount" label="Tổng thực chi">
            <Input className="!w-full" placeholder="Nhập thực chi" />
          </Form.Item>
          <Form.Item label="Hình thức" name="paid_method">
            <Select placeholder="Chọn hình thức" allowClear>
              <Select.Option value="cash">Tiền mặt</Select.Option>
              <Select.Option value="transfer">Chuyển khoản</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Loại" name="paid_type">
            <Radio.Group
              value={value}
              onChange={(e) => setValue(e.target.value)}
              options={[
                { value: "service", label: "Thanh toán dịch vụ" },
                { value: "medicine", label: "Thanh toán thuốc" },
              ]}
            />
          </Form.Item>
          <Form.Item wrapperCol={{ span: 24 }} className="flex justify-end">
            <Button htmlType="button" className="mr-2" onClick={handleCancel}>
              Hủy
            </Button>
            <Button htmlType="submit" type="primary">
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
