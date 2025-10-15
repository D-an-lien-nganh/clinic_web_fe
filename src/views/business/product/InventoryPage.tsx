import { useMemo, useState } from "react";
import { Table, Input, DatePicker, Typography, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { useGetInventorySummaryQuery } from "@/api/app_product/apiService";
import InventoryDetailModal from "./InventoryDetailModal";

const { RangePicker } = DatePicker;

type Row = {
  key: string | number;
  product_code: string;
  product_name: string;
  unit: string | null;
  open_qty: number; open_val: number;
  in_qty: number; in_val: number;
  out_qty: number; out_val: number;
  close_qty: number; close_val: number;
};

const fmt = (n: any) =>
  typeof n === "number"
    ? n.toLocaleString("vi-VN")
    : (Number(n || 0)).toLocaleString("vi-VN");

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const startDate = range?.[0]?.format("YYYY-MM-DD");
  const endDate = range?.[1]?.format("YYYY-MM-DD");

  const { data, isFetching } = useGetInventorySummaryQuery({
    page,
    pageSize,
    startDate,
    endDate,
    search, // nếu backend có hỗ trợ
  });

  const rows: Row[] = useMemo(() => {
    const list = data?.results ?? data ?? []; // phòng trường hợp API trả danh sách thuần
    return (list || []).map((r: any, idx: number) => ({
      key: r.product_code || r.product_name || idx,
      ...r,
    }));
  }, [data]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id?: number; name?: string } | null>(null);

  const onClickName = (record: any) => {
    // bạn cần product_id từ backend; nếu chưa có, có thể map code->id ở FE hoặc trả kèm id trong summary
    setSelected({ id: record.product_id ?? record.id, name: record.product_name });
    setOpen(true);
  };

  const columns: ColumnsType<Row> = [
    {
      title: "STT",
      width: 70,
      align: "center",
      render: (_t, _r, i) => (page - 1) * pageSize + i + 1,
      fixed: "left",
    },
    { title: "Mã hàng", dataIndex: "product_code", width: 130, align: "center", fixed: "left" },
    {
      title: "Tên hàng hoá",
      dataIndex: "product_name",
      width: 260,
      fixed: "left",
      render: (text, record) => (
        <Typography.Link onClick={() => onClickName(record)}>{text}</Typography.Link>
      ),
    },
    { title: "ĐVT", dataIndex: "unit", width: 90, align: "center" },

    // Group: Đầu kỳ
    {
      title: "Đầu kỳ",
      children: [
        { title: "Số lượng", dataIndex: "open_qty", align: "right", width: 120, render: fmt },
        { title: "Giá trị", dataIndex: "open_val", align: "right", width: 160, render: fmt },
      ],
    },
    // Group: Nhập kho
    {
      title: "Nhập kho",
      children: [
        { title: "Số lượng", dataIndex: "in_qty", align: "right", width: 120, render: fmt },
        { title: "Giá trị", dataIndex: "in_val", align: "right", width: 160, render: fmt },
      ],
    },
    // Group: Xuất kho
    {
      title: "Xuất kho",
      children: [
        { title: "Số lượng", dataIndex: "out_qty", align: "right", width: 120, render: fmt },
        { title: "Giá trị", dataIndex: "out_val", align: "right", width: 160, render: fmt },
      ],
    },
    // Group: Cuối kỳ
    {
      title: "Cuối kỳ",
      children: [
        { title: "Số lượng", dataIndex: "close_qty", align: "right", width: 120, render: fmt },
        { title: "Giá trị", dataIndex: "close_val", align: "right", width: 160, render: fmt },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Space wrap size="middle">
        <Input
          allowClear
          placeholder="Tìm mã/tên hàng…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 260 }}
        />
        <RangePicker
          onChange={(v) => { setRange(v as any); setPage(1); }}
          format="DD/MM/YYYY"
          allowEmpty={[true, true]}
        />
      </Space>

      <Table<Row>
        rowKey="key"
        loading={isFetching}
        dataSource={rows}
        columns={columns}
        bordered
        scroll={{ x: "max-content" }}
        pagination={{
          current: page,
          pageSize,
          total: data?.count ?? rows?.length,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
        }}
        summary={(pageData) => {
          // nếu backend đã thêm dòng TOTAL cuối danh sách, không cần summary
          const last = pageData?.[pageData.length - 1];
          if (last && last.product_code === "TOTAL") return null;
          return null;
        }}
      />

      <InventoryDetailModal
        open={open}
        onClose={() => setOpen(false)}
        productId={selected?.id}
        productName={selected?.name}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
