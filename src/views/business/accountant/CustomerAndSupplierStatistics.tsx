import React, { useState } from "react";
import { useWindowSize } from "@/utils/responsiveSm";
import { Button, Table, notification, Space, Popconfirm, Row, Col, Tag, DatePicker, Form, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import ActionTable from "@/components/DropDown/ActionTable";
import AddAndUpdateStatistics from "./components/AddAndUpdateStatistics";
import { useGetSupplierDebtListQuery } from "@/api/app_accounting/apiAccounting";
import StockInModal from "@/views/business/accountant/components/StockInModal";
import AddPayment from "@/views/business/accountant/components/AddPayment";

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
interface Supplier {
  id: number;
  created: string;
  supplier: number;
  supplier_name: string;
  supplier_mobile: string;
  supplier_address: string;
  total_amount: string;
  total_paid: number;
  remaining_debt: number;
  stock_ins: StockIn[];
}

const { RangePicker } = DatePicker;

export default function CustomerAndSupplierStatistics() {
  const [width] = useWindowSize();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const handleRowClick = (record: Supplier) => {
    setSelectedSupplier(record);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };
  const { data, refetch } = useGetSupplierDebtListQuery();

  const columns: ColumnsType<Supplier> = [
    {
      title: "STT",
      width: 50,
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      align: "center",
    },
    {
      title: "Tên đơn vị",
      dataIndex: "supplier_name",
      align: "center",
    },
    {
      title: "Số điện thoại",
      dataIndex: "supplier_mobile",
      align: "center",
    },
    {
      title: "Địa chỉ",
      dataIndex: "supplier_address",
      align: "center",
    },
    {
      title: "Tổng tiền nhập",
      align: "center",
      render: (_, record) => parseFloat(record.total_amount).toString(),
    },
    {
      title: "Tổng tiền trả",
      align: "center",
      render: (_, record) => record.total_paid,
    },
    {
      title: "Nợ",
      align: "center",
      render: (_, record) => record.remaining_debt,
    },
    {
      title: "Trạng thái",
      align: "center",
      render: (_, record) => {
        if (record.remaining_debt > 0) {
          return <Tag color="red">Chưa hoàn thành</Tag>;
        }
        return <Tag color="green">Hoàn thành</Tag>;
      },
    },
  ];

  const totalAmount =
    data?.results?.reduce(
      (sum: number, item: Supplier) => sum + parseFloat(item.total_amount),
      0
    ) || 0;
  const totalPaid =
    data?.results?.reduce(
      (sum: number, item: Supplier) => sum + item.total_paid,
      0
    ) || 0;
  const totalDebt =
    data?.results?.reduce(
      (sum: number, item: Supplier) => sum + item.remaining_debt,
      0
    ) || 0;

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  return (
    <div className="px-6">
      <div className="flex justify-start gap-2 mb-2">
        <Form.Item
          name="customer"
          className="form-item !mb-0 w-full sm:w-[280px] shrink-0"
        >
          <Input placeholder="Tên khách hàng" allowClear className="!w-full" />
        </Form.Item>

        <Form.Item
          className="form-item w-full sm:w-auto !mb-0"
          name="dateRange"
        >
          <RangePicker
            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
            className="!w-full"
          />
        </Form.Item>

        <Button className="w-full sm:w-auto" type="primary" htmlType="submit">
          Lọc
        </Button>
      </div>
      <Row gutter={24} className="mb-4 text-lg font-semibold">
        <Col span={8}>
          Tiền nhập (VND): {totalAmount.toLocaleString("vi-VN")}
        </Col>
        <Col span={8}>Đã trả (VND): {totalPaid.toLocaleString("vi-VN")}</Col>
        <Col span={8}>Còn nợ (VND): {totalDebt.toLocaleString("vi-VN")}</Col>
      </Row>
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          pagination={{
            ...pagination,
            total: data?.results.length,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100", "200"],
          }}
          onChange={handleTableChange}
          dataSource={data?.results}
          bordered
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
          })}
        />
      </div>
      <StockInModal
        data={selectedSupplier}
        visible={isModalVisible}
        onClose={handleCloseModal}
        type="supplier"
      />
    </div>
  );
}
