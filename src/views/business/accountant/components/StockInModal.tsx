import { useGetSupplierDebtPaymentListQuery } from "@/api/app_accounting/apiAccounting";
import { useGetPaymentHistoryListByBillQuery } from "@/api/app_treatment/apiTreatment";
import AddPayment from "@/views/business/accountant/components/AddPayment";
import { Modal, Table, Tag, Tabs, Form, Select, Button } from "antd";
import { useForm } from "antd/es/form/Form";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface StockIn {
  id: number;
  created: string;
  code: string;
  product_name: string;
  quantity: number;
  import_price: string;
  import_date: string;
  note: string;
  total_price: number;
  full_paid: boolean;
}

interface PaymentBatch {
  id: number;
  created: string;
  code: string;
  user: number;
  creator_name: string;
  method: string;
  stock_in: number;
  stock_in_code: string;
  paid_amount: string;
  note: string;
}

interface Supplier {
  id: number;
  supplier: number;
  supplier_name: string;
  supplier_mobile: string;
  supplier_address: string;
  stock_ins: StockIn[];
}

interface StockInModalProps {
  data?: any;
  // data?: number | Supplier | null;
  visible: boolean;
  onClose: () => void;
  type: "customer" | "supplier";
}

export default function StockInModal({
  data,
  visible,
  onClose,
  type,
}: StockInModalProps) {
  const [form] = Form.useForm();

  const { data: paymentList, refetch } = useGetSupplierDebtPaymentListQuery({
    supplier_id: data?.supplier,
    stock_in_id: form.getFieldValue("stock_in_id"),
  });

  const { data: historyList } = useGetPaymentHistoryListByBillQuery({
    bill_id: data,
  });

  const stockColumns: ColumnsType<StockIn> = [
    {
      title: "#",
      key: "index",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    { title: "Mã sản phẩm", dataIndex: "code", key: "code" },
    { title: "Tên sản phẩm", dataIndex: "product_name", key: "product_name" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    {
      title: "Giá nhập",
      dataIndex: "import_price",
      key: "import_price",
      render: (value) => parseFloat(value).toLocaleString("vi-VN"),
    },
    { title: "Ngày nhập", dataIndex: "import_date", key: "import_date" },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (value) => value.toLocaleString("vi-VN"),
    },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
    {
      title: "Trạng thái",
      dataIndex: "full_paid",
      key: "full_paid",
      align: "center",
      render: (value) =>
        value ? (
          <Tag color="green">Hoàn thành</Tag>
        ) : (
          <Tag color="red">Còn nợ</Tag>
        ),
    },
  ];

  const paymentColumns: ColumnsType<PaymentBatch> = [
    {
      title: "#",
      key: "index",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã thanh toán",
      dataIndex: "stock_in_code",
      key: "stock_in_code",
    },
    { title: "Mã lô", dataIndex: "code", key: "code" },
    {
      title: "Tổng tiền",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (value) => parseFloat(value).toLocaleString("vi-VN"),
    },
    {
      title: "Hình thức",
      dataIndex: "method",
      render: (value) => (value === "cash" ? "Tiền mặt" : "Chuyển khoản"),
    },
    { title: "Ghi chú", dataIndex: "note", key: "note" },
    {
      title: "Ngày tạo",
      dataIndex: "created",
      key: "created",
      render: (value) => dayjs(value).format("YYYY-MM-DD"),
    },
  ];

  const historyColumns: ColumnsType<any> = [
    {
      title: "#",
      key: "index",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã thanh toán",
      dataIndex: "bill_code",
      key: "bill_code",
    },
    {
      title: "Tổng tiền",
      dataIndex: "paid_amount",
      key: "paid_amount",
      render: (value) => parseFloat(value).toLocaleString("vi-VN"),
    },
    {
      title: "Hình thức",
      dataIndex: "paid_method",
      render: (value) => (value === "cash" ? "Tiền mặt" : "Chuyển khoản"),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created",
      key: "created",
      render: (value) => dayjs(value).format("YYYY-MM-DD"),
    },
  ];

  return (
    <Modal
      title="Chi tiết thanh toán"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      {type == "supplier" && (
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Chi tiết kho" key="1">
            <Table
              columns={stockColumns}
              dataSource={data?.stock_ins}
              pagination={false}
              rowKey="id"
              bordered
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Lô thanh toán" key="2">
            <Form
              form={form}
              onFinish={() => refetch()}
              layout="inline"
              style={{ paddingBottom: "10px" }}
            >
              <Form.Item label="Lô thanh toán" name="stock_in_id">
                <Select placeholder="Chọn lô thanh toán">
                  {data?.stock_ins?.map((i: { id: number; code: string }) => (
                    <Select.Option key={i.id} value={i.id}>
                      {i.code}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Lọc
                </Button>
              </Form.Item>
            </Form>
            <Table
              columns={paymentColumns}
              dataSource={paymentList?.results}
              pagination={false}
              rowKey="id"
              bordered
            />
          </Tabs.TabPane>
        </Tabs>
      )}
      {type == "customer" && (
        <Table
          columns={historyColumns}
          dataSource={historyList?.results}
          pagination={false}
          rowKey="id"
          bordered
        />
      )}
    </Modal>
  );
}
