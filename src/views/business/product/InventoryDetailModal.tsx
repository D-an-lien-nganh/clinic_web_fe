import { useGetInventoryDetailQuery } from "@/api/app_product/apiService";
import { Modal, Table, DatePicker, Row, Col, Card, Statistic } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useState, useEffect } from "react";

const { RangePicker } = DatePicker;

type Item = {
  type: "import" | "export" | "opening" | "TOTAL";
  product_name?: string;
  doc_date?: string | null;
  doc_code?: string | null;
  description?: string | null;
  unit?: string | null;
  unit_price?: number | string | null;
  in_qty?: number | null;
  in_val?: number | string | null;
  out_qty?: number | null;
  out_val?: number | string | null;
  balance_qty?: number | null;
  balance_val?: number | string | null;
};

const fmt = (n: any) => {
  if (n === null || n === undefined || n === "") return "0";
  return Number(n).toLocaleString("vi-VN");
};

// Helper để validate và parse date
const parseDate = (dateStr?: string | null): Dayjs | null => {
  if (!dateStr) return null;
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed : null;
};

export default function InventoryDetailModal({
  open,
  onClose,
  productId,
  productName,
  startDate: initialStartDate,
  endDate: initialEndDate,
}: {
  open: boolean;
  onClose: () => void;
  productId?: number;
  productName?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  // Reset date range khi props thay đổi
  useEffect(() => {
    if (open) {
      const startDayjs = parseDate(initialStartDate);
      const endDayjs = parseDate(initialEndDate);
      setDateRange([startDayjs, endDayjs]);
    }
  }, [initialStartDate, initialEndDate, open]);

  // Convert dayjs sang string cho API
  const apiParams = {
    productId,
    startDate: dateRange[0]?.format("YYYY-MM-DD") || undefined,
    endDate: dateRange[1]?.format("YYYY-MM-DD") || undefined,
  };

  const { data, isFetching, error } = useGetInventoryDetailQuery(
    productId ? apiParams : ({} as any),
    { 
      skip: !open || !productId,
      refetchOnMountOrArgChange: true
    }
  );

  // Debug log
  console.log("API Response:", data);
  console.log("API Error:", error);

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates) {
      setDateRange(dates);
    } else {
      setDateRange([null, null]);
    }
  };

  // Xử lý data an toàn
  const rawRows: Item[] = data?.items ?? [];
  const totalRow = rawRows.find((r) => r.type === "TOTAL");
  const rows: Item[] = rawRows.filter((r) => r.type !== "TOTAL");

  // Lấy thông tin balance từ data hoặc totalRow
  const openingBalance = data?.opening_balance || { qty: 0, val: 0 };
  const closingBalance = data?.closing_balance || totalRow?.balance_qty !== undefined
    ? { qty: totalRow?.balance_qty, val: totalRow?.balance_val }
    : { qty: 0, val: 0 };

  const columns: ColumnsType<Item> = [
    {
      title: "Tên hàng",
      dataIndex: "product_name",
      fixed: "left",
      width: 180,
      align: "center",
    },
    {
      title: "Ngày CT",
      dataIndex: "doc_date",
      align: "center",
      width: 100,
      render: (d) => {
        if (!d) return "";
        const parsed = dayjs(d);
        return parsed.isValid() ? parsed.format("DD/MM/YY") : "";
      },
    },
    {
      title: "Số CT",
      dataIndex: "doc_code",
      width: 120,
      align: "center",
      render: (code, record) => {
        if (record.type === "opening") {
          return <span style={{ color: "#1890ff", fontWeight: "bold" }}>{code}</span>;
        }
        return code;
      },
    },
    {
      title: "Diễn giải",
      dataIndex: "description",
      width: 200,
      align: "left",
      render: (desc, record) => {
        if (record.type === "opening") {
          return <span style={{ color: "#1890ff", fontWeight: "bold" }}>{desc}</span>;
        }
        return desc;
      },
    },
    { 
      title: "ĐVT", 
      dataIndex: "unit", 
      align: "center", 
      width: 60 
    },
    {
      title: "Đơn giá",
      dataIndex: "unit_price",
      align: "right",
      width: 100,
      render: (price) => price ? fmt(price) : "",
    },
    {
      title: "Nhập",
      children: [
        {
          title: "SL",
          dataIndex: "in_qty",
          align: "right",
          width: 80,
          render: (qty) => qty ? fmt(qty) : "",
        },
        {
          title: "GT",
          dataIndex: "in_val",
          align: "right",
          width: 100,
          render: (val) => val ? fmt(val) : "",
        },
      ],
    },
    {
      title: "Xuất",
      children: [
        {
          title: "SL",
          dataIndex: "out_qty",
          align: "right",
          width: 80,
          render: (qty) => qty ? fmt(qty) : "",
        },
        {
          title: "GT",
          dataIndex: "out_val",
          align: "right",
          width: 100,
          render: (val) => val ? fmt(val) : "",
        },
      ],
    },
    {
      title: "Tồn",
      children: [
        {
          title: "SL",
          dataIndex: "balance_qty",
          align: "right",
          width: 80,
          render: (qty, record) => {
            const value = qty !== null && qty !== undefined ? fmt(qty) : "";
            if (record.type === "opening") {
              return <span style={{ color: "#1890ff", fontWeight: "bold" }}>{value}</span>;
            }
            return <span style={{ fontWeight: "500" }}>{value}</span>;
          },
        },
        {
          title: "GT",
          dataIndex: "balance_val",
          align: "right",
          width: 100,
          render: (val, record) => {
            const value = val !== null && val !== undefined ? fmt(val) : "";
            if (record.type === "opening") {
              return <span style={{ color: "#1890ff", fontWeight: "bold" }}>{value}</span>;
            }
            return <span style={{ fontWeight: "500" }}>{value}</span>;
          },
        },
      ],
    },
  ];

  return (
    <Modal
      title={`Sổ chi tiết tồn kho: ${productName ?? ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      style={{ top: 20 }}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        {/* Bộ lọc ngày */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <RangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={handleDateChange}
              allowClear
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={12}>
            <span style={{ color: "#666", fontSize: "12px" }}>
              {data?.start_date && data?.end_date 
                ? `Kỳ: ${dayjs(data.start_date).format("DD/MM/YYYY")} - ${dayjs(data.end_date).format("DD/MM/YYYY")}`
                : "Chọn khoảng thời gian để xem báo cáo"
              }
            </span>
          </Col>
        </Row>

        {/* Thông tin tổng quan */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="Tồn đầu kỳ (SL)"
                value={openingBalance.qty ?? 0}
                formatter={(value) => fmt(value)}
                valueStyle={{ fontSize: "16px" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="Tồn đầu kỳ (GT)"
                value={openingBalance.val ?? 0}
                formatter={(value) => fmt(value)}
                valueStyle={{ fontSize: "16px" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="Tồn cuối kỳ (SL)"
                value={closingBalance.qty ?? 0}
                formatter={(value) => fmt(value)}
                valueStyle={{ fontSize: "16px", color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: "center" }}>
              <Statistic
                title="Tồn cuối kỳ (GT)"
                value={closingBalance.val ?? 0}
                formatter={(value) => fmt(value)}
                valueStyle={{ fontSize: "16px", color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Table<Item>
        rowKey={(record, index) => `${record.type}-${record.doc_code}-${index}`}
        bordered
        loading={isFetching}
        dataSource={rows}
        columns={columns}
        pagination={false}
        scroll={{ x: 1000, y: 400 }}
        size="small"
        locale={{ emptyText: "Không có dữ liệu trong kỳ đã chọn" }}
        summary={() => {
          if (!totalRow) return null;
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <b>TỔNG CỘNG</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} />
              <Table.Summary.Cell index={2} />
              <Table.Summary.Cell index={3} />
              <Table.Summary.Cell index={4} />
              <Table.Summary.Cell index={5} />
              <Table.Summary.Cell index={6} align="right">
                <b>{fmt(totalRow.in_qty)}</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <b>{fmt(totalRow.in_val)}</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                <b>{fmt(totalRow.out_qty)}</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} align="right">
                <b>{fmt(totalRow.out_val)}</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={10} align="right">
                <b style={{ color: "#52c41a" }}>{fmt(totalRow.balance_qty)}</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={11} align="right">
                <b style={{ color: "#52c41a" }}>{fmt(totalRow.balance_val)}</b>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />

      {error && (
        <div style={{ color: "red", marginTop: 10, fontSize: "12px" }}>
          Lỗi: {JSON.stringify(error)}
        </div>
      )}
    </Modal>
  );
}