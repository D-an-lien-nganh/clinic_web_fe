"use client";
import {
  useChangeStockOutStatusMutation,
  useDeleteStockInMutation,
  useDeleteStockOutMutation,
  useGetStockInListQuery,
  useGetStockOutListQuery,
  useGetWarehouseListQuery,
} from "@/api/app_product/apiService";
import {
  Tabs,
  Table,
  Popconfirm,
  Button,
  Select,
  notification,
  Modal,
  Form,
  Input,
  Typography,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import React, { useState } from "react";
import AddAndUpdateStockOut from "./components/AddAndUpdateStockOut";
import AddAndUpdateStockIn from "./components/AddAndUpdateStockIn";
import LedgerModal from "./LedgerModal";
import InventoryPage from "./InventoryPage";

const { Option } = Select;

interface StockIn {
  key: React.Key;
  id: number;
  code: string;
  product_name: string;
  quantity: number;
  creator_name: string;
  approver_name: string;
  import_price: number;
  supplier_name: string;
  import_date: Date;
  created: Date;
  status: string;
}

interface StockOut {
  key: React.Key;
  id: number;
  code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  creator_name: string;
  export_date: string;
  original_stockout_price: number;
  exchange_rate: string;
  export_price: number;
  shipment_date: Date;
  status: string;
  actual_stockout_price: number;
}

interface Inventory {
  key: React.Key;
  id: number;
  code: string;
  product_name: string;
  remaining_quantity: number;
  supplier: string;
  import_date: Date;
  shipment_date: Date;
}

const StockIn = () => {
  const { data: stockInData, refetch: refetchStockInList } =
    useGetStockInListQuery();
  const [deleteStockIn] = useDeleteStockInMutation();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const onDelete = async (id: number) => {
    try {
      // Logic xóa bản ghi
      await deleteStockIn({ stockInId: id }).unwrap();

      notification.success({
        message: "Xóa bản ghi thành công!",
        className: "h-16",
        placement: "bottomRight",
      });

      // Làm mới danh sách
      refetchStockInList();
    } catch (error) {
      notification.error({
        message: "Không thể xóa bản ghi. Vui lòng thử lại!",
        className: "h-16",
        placement: "bottomRight",
      });
      console.log("Lỗi là: ", error);
    }
  };

  const [searchTerms, setSearchTerms] = useState({
    code: "",
  });
  const allSearchTermsEmpty = Object.values(searchTerms).every(
    (term) => term === ""
  );

  const dataSource =
    stockInData?.results?.map((record: { id: any }) => ({
      ...record,
      key: record.id,
    })) || [];

  const columns: ColumnsType<StockIn> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      fixed: "left",
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      key: "product_name",
      title: "Tên hàng hoá",
      fixed: "left",
      dataIndex: "product_name",
      align: "center",
    },
    {
      key: "import_price",
      title: "Đơn giá",
      dataIndex: "import_price",
      render: (value) =>
        Number(value).toLocaleString("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      align: "center",
    },
    {
      key: "quantity",
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
    },
    {
      key: "total_price",
      title: "Thành tiền",
      dataIndex: "total_price",
      render: (value) =>
        Number(value).toLocaleString("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      align: "center",
    },
    {
      key: "supplier_name",
      title: "Nhà cung cấp",
      dataIndex: "supplier_name",
      align: "center",
    },
    {
      title: "Ngày nhập hàng",
      key: "import_date",
      sorter: (a, b) =>
        dayjs(a.import_date).unix() - dayjs(b.import_date).unix(),
      render: (_, { import_date }) => (
        <div>{dayjs(import_date).format("DD/MM/YYYY")}</div>
      ),
      align: "center",
    },
    {
      key: "actions",
      title: "Hành động",
      align: "center",

      render: (_, record) => {
        return (
          <div className="flex justify-center items-center space-x-4">
            <AddAndUpdateStockIn
              edit={true}
              title="Sửa phiếu nhập kho"
              id={record.id}
            />
            <Popconfirm
              title="Bạn có chắc muốn xóa không?"
              onConfirm={() => onDelete(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button danger className="hidden sm:inline-block">
                Xóa
              </Button>
              <div className="sm:hidden text-center text-red-500 font-bold">
                Xóa
              </div>
            </Popconfirm>
          </div>
        );
      },
    },
  ];
  const filteredEmployeeData = allSearchTermsEmpty
    ? dataSource
    : dataSource.filter((emp: any) => {
        return emp?.code
          ?.toLowerCase()
          .includes(searchTerms.code.toLowerCase());
      });
  return (
    <>
      <div className="flex justify-between items-center ">
        <Input
          value={searchTerms.code}
          onChange={(e) =>
            setSearchTerms((prev) => ({ ...prev, code: e.target.value }))
          }
          className="!w-[300px] mb-[10px]"
          placeholder="Tìm theo Mã đơn nhập kho...  "
        />
        <div className="flex justify-end mb-4 mr-5 gap-4">
          <AddAndUpdateStockIn title="Thêm phiếu nhập kho" />
        </div>
      </div>
      <Table
        scroll={{ x: 1000 }}
        bordered
        dataSource={filteredEmployeeData}
        columns={columns}
        tableLayout="auto"
      />
    </>
  );
};

const StockOut = () => {
  const { data: stockOutData, refetch: refetchStockOutList } =
    useGetStockOutListQuery();
  const [changeStockOutStatus] = useChangeStockOutStatusMutation();
  const [deleteStockOut] = useDeleteStockOutMutation();
  const [selectedStatus, setSelectedStatus] = useState<string>("approve");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [editableRow, setEditableRow] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<StockOut | null>(null);
  const [form] = Form.useForm();

  // Xử lý chọn tất cả
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRowKeys([]); // Xóa tất cả lựa chọn
    } else {
      const allKeys = dataSource.map((record: any) => record.key);
      setSelectedRowKeys(allKeys); // Chọn tất cả
    }
    setSelectAll(!selectAll);
  };

  // Xử lý chọn từng hàng
  const handleRowSelect = (key: number) => {
    setSelectedRowKeys(
      (prev) =>
        prev.includes(key)
          ? prev.filter((rowKey) => rowKey !== key) // Bỏ chọn
          : [...prev, key] // Thêm vào danh sách chọn
    );
  };

  const onDelete = async (id: number) => {
    try {
      const stockInRecord = dataSource.find((record: any) => record.id === id);

      // Logic xóa bản ghi

      await deleteStockOut({ stockOutId: id }).unwrap;
      notification.success({
        message: "Thành công",
        description: "Xóa bản ghi thành công!",
      });

      // Làm mới danh sách
      refetchStockOutList();
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Không thể xóa bản ghi. Vui lòng thử lại!",
      });
    }
  };

  const dataSource =
    stockOutData?.results?.map((record: { id: any }) => ({
      ...record,
      key: record.id,
    })) || [];
  const [searchTerms, setSearchTerms] = useState({
    code: "",
  });
  const allSearchTermsEmpty = Object.values(searchTerms).every(
    (term) => term === ""
  );

  const filteredEmployeeData = allSearchTermsEmpty
    ? dataSource
    : dataSource.filter((emp: any) => {
        return emp?.code
          ?.toLowerCase()
          .includes(searchTerms.code.toLowerCase());
      });
  const columns: ColumnsType<StockOut> = [
    {
      title: (
        <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
      ),
      key: "select",
      width: 50,
      align: "center",
      render: (_, record) => {
        if (record.status === "pending") {
          return (
            <input
              type="checkbox"
              checked={selectedRowKeys.includes(Number(record.key))}
              onChange={() => handleRowSelect(Number(record.key))}
            />
          );
        }
        return null;
      },
    },
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      key: "export_date",
      title: "Ngày xuất hàng",
      dataIndex: "export_date",
      sorter: (a, b) =>
        dayjs(a.export_date).unix() - dayjs(b.export_date).unix(),
      render: (_, { export_date }) => (
        <div>{dayjs(export_date).format("DD/MM/YYYY")}</div>
      ),
      align: "center",
    },
    {
      key: "product_name",
      title: "Tên hàng hoá xuất",
      dataIndex: "product_name",
      align: "center",
    },
    {
      key: "type",
      title: "Đối tượng xuất",
      dataIndex: "type",
      align: "center",
      render: (value: string) =>
        value === "customer" ? "Khách hàng" : "Nhân viên",
    },
    {
      key: "quantity",
      title: "Số lượng xuất",
      dataIndex: "quantity",
      align: "center",
    },
    {
      key: "actual_price",
      title: "Đơn giá",
      dataIndex: "actual_stockout_price",
      render: (value) =>
        Number(value).toLocaleString("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      align: "center",
    },
    {
      key: "total_price",
      title: "Thành tiền",
      render: (_, record) => {
        const quantity = Number(record?.quantity ?? 0);
        const unitPrice = Number(record?.actual_stockout_price ?? 0);
        const total = quantity * unitPrice;
        return total.toLocaleString("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      },
      align: "center",
    },
    {
      key: "actions",
      title: "Hành động",
      align: "center",
      render: (_, record) => {
        return (
          <div className="flex justify-center items-center space-x-4">
            <AddAndUpdateStockOut
              edit={true}
              title="Sửa phiếu xuất kho"
              id={record.id}
            />
            <Popconfirm
              title="Bạn có chắc muốn xóa không?"
              onConfirm={() => onDelete(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button danger className="hidden sm:inline-block">
                Xóa
              </Button>
              <div className="sm:hidden text-center text-red-500 font-bold">
                Xóa
              </div>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className={"flex items-center justify-between "}>
        <Input
          placeholder="Tìm theo mã đơn xuất kho..."
          className="!w-[300px]"
          value={searchTerms.code}
          onChange={(e) =>
            setSearchTerms((prev) => ({ ...prev, code: e.target.value }))
          }
        />
        <div className="flex justify-end mb-4">
          <AddAndUpdateStockOut title="Thêm phiếu xuất kho" />
        </div>
      </div>
      <Table
        tableLayout="auto"
        scroll={{ x: "max-content" }}
        bordered
        dataSource={filteredEmployeeData}
        columns={columns}
        pagination={pagination}
      />
      <Modal
        title="Cập nhật trạng thái: Đã xuất (thiếu)"
        visible={isModalVisible}
        onOk={async () => {
          try {
            const values = await form.validateFields();

            const requests = selectedRowKeys.map((id) => {
              return changeStockOutStatus({
                id,
                data: {
                  status: "stocked_out_missing",
                  actual_quantity: values.actual_quantity,
                  missing_reason: values.missing_reason,
                },
              }).unwrap();
            });

            await Promise.all(requests);

            notification.success({
              message: "Thành công",
              description: "Trạng thái đã được cập nhật thành công!",
            });

            refetchStockOutList();
            setIsModalVisible(false);
            setCurrentRecord(null);
            form.resetFields();
            setSelectedRowKeys([]);
          } catch (error) {
            notification.error({
              message: "Không thể cập nhật trạng thái.",
            });
          }
        }}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentRecord(null);
          form.resetFields();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Lý do xuất thiếu"
            name="missing_reason"
            rules={[
              { required: true, message: "Vui lòng nhập lý do xuất thiếu!" },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Nhập lý do xuất thiếu" />
          </Form.Item>
          <Form.Item
            label="Số lượng thực tế đã xuất"
            name="actual_quantity"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập số lượng thực tế đã xuất!",
              },
            ]}
          >
            <Input type="number" placeholder="Nhập số lượng thực tế đã xuất" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Inventory = () => {
  const { data: warehouseData } = useGetWarehouseListQuery();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const dataSource =
    warehouseData?.results?.map((record: { id: any }) => ({
      ...record,
      key: record.id,
    })) || [];
  const [searchTerms, setSearchTerms] = useState({
    code: "",
  });

  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null
  );
  const [selectedProductName, setSelectedProductName] = useState<string | null>(
    null
  );

  const allSearchTermsEmpty = Object.values(searchTerms).every(
    (term) => term === ""
  );

  const filteredEmployeeData = allSearchTermsEmpty
    ? dataSource
    : dataSource.filter((emp: any) => {
        return emp?.code
          ?.toLowerCase()
          .includes(searchTerms.code.toLowerCase());
      });

  const openLedger = (warehouseId: number, productName?: string) => {
    setSelectedWarehouseId(warehouseId);
    setSelectedProductName(productName || null);
    setIsLedgerOpen(true);
  };

  const columns: ColumnsType<Inventory> = [
    {
      title: "STT",
      key: "index",
      width: 45,
      align: "center",
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      key: "code",
      title: "Mã đơn nhập kho",
      dataIndex: "code",
      align: "center",
    },
    {
      key: "product_name",
      title: "Tên hàng hoá",
      dataIndex: "product_name",
      align: "center",
      render: (text: string, record: any) => (
        <Typography.Link onClick={() => openLedger(record.id, text)}>
          {text}
        </Typography.Link>
      ),
    },
    {
      key: "quantity",
      title: "Số lượng còn lại",
      dataIndex: "quantity",
      align: "center",
    },
    {
      key: "supplier_name",
      title: "Nhà cung cấp",
      dataIndex: "supplier_name",
      align: "center",
    },
    {
      title: "Ngày nhập hàng",
      key: "import_date",
      sorter: (a, b) =>
        dayjs(a.import_date).unix() - dayjs(b.import_date).unix(),
      render: (_, { import_date }) => (
        <div>{dayjs(import_date).format("DD/MM/YYYY")}</div>
      ),
      align: "center",
    },
    {
      title: "Ngày xuất hàng",
      key: "shipment_date",
      sorter: (a, b) =>
        dayjs(a.shipment_date).unix() - dayjs(b.shipment_date).unix(),
      render: (_, { shipment_date }) => (
        <div>{dayjs(shipment_date).format("DD/MM/YYYY")}</div>
      ),
      align: "center",
    },
  ];

  return (
    <div className={"flex flex-col"}>
      <Input
        placeholder="Tìm theo tên người..."
        className="!w-[300px]"
        value={searchTerms.code}
        onChange={(e) =>
          setSearchTerms((prev) => ({ ...prev, code: e.target.value }))
        }
      />

      <Table
        tableLayout="auto"
        scroll={{ x: "max-content" }}
        bordered
        dataSource={filteredEmployeeData}
        columns={columns}
        pagination={pagination}
      />

      <LedgerModal
        open={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        warehouseId={selectedWarehouseId ?? undefined}
        productName={selectedProductName ?? undefined}
        // bạn có thể truyền thêm scope/date filter nếu muốn:
        // scope="product"
        // dateFrom="2025-01-01"
        // dateTo="2025-12-31"
      />
    </div>
  );
};

const Warehouse: React.FC = () => {
  const onChange = (key: string) => {
    console.log("Tab đã chọn:", key);
  };

  const items = [
    {
      key: "1",
      label: "Nhập kho",
      children: <StockIn />,
    },
    {
      key: "2",
      label: "Xuất kho",
      children: <StockOut />,
    },
    {
      key: "3",
      label: "Tồn kho",
      children: <InventoryPage />,
    },
  ];

  return (
    <div className="px-6">
      <Tabs
        className="mt-6"
        defaultActiveKey="1"
        items={items}
        onChange={onChange}
      />
    </div>
  );
};

export default Warehouse;
