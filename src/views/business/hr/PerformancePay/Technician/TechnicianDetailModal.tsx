"use client";

import React from "react";
import { Modal, Tabs, DatePicker, Table, Space, Divider } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TableProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useGetExpertTechniqueDetailsQuery } from "@/api/app_treatment/apiTreatment";

type TabKey = "TLCB" | "TLDS";

type DetailRow = {
  index: number;
  date: string;
  technique_name: string;
  count: number;
};

type GroupRow = {
  key: string;
  customer_name: string;
  treatment_type_label: string;
  total_count: number;
  details: DetailRow[];
};

interface Props {
  open: boolean;
  onClose: () => void;
  expertId: number | null;
  expertName?: string;
}

export default function TechnicianDetailModal({
  open,
  onClose,
  expertId,
  expertName,
}: Props) {
  const [tab, setTab] = React.useState<TabKey>("TLCB");
  const [from, setFrom] = React.useState<Dayjs>(dayjs().startOf("month"));
  const [to, setTo] = React.useState<Dayjs>(dayjs());

  const ready = open && typeof expertId === "number";

  const args = React.useMemo(
    () =>
      ready
        ? {
            expertId: expertId as number,
            type: tab,
            startDate: from.format("YYYY-MM-DD"),
            endDate: to.format("YYYY-MM-DD"),
          }
        : null,
    [ready, expertId, tab, from, to]
  );

  const { data, isFetching } = useGetExpertTechniqueDetailsQuery(
    // @ts-expect-error allow null when skipped
    args,
    { skip: !ready, refetchOnMountOrArgChange: true }
  );

  // ---------------- Columns ----------------
  const detailColumns: ColumnsType<DetailRow> = [
    { title: "STT", dataIndex: "index", key: "index", align: "center", width: 80 },
    { title: "Ngày", dataIndex: "date", key: "date", align: "center", width: 140 },
    { title: "Kỹ thuật", dataIndex: "technique_name", key: "technique_name", align: "left" },
    { title: "Số lượt làm", dataIndex: "count", key: "count", align: "center", width: 140 },
  ];

  const mainColumns: ColumnsType<GroupRow> = [
    { title: "Bệnh nhân", dataIndex: "customer_name", key: "customer_name", align: "left" },
    { title: "Loại trị liệu", dataIndex: "treatment_type_label", key: "treatment_type_label", align: "center", width: 220 },
    { title: "Tổng số lượt làm", dataIndex: "total_count", key: "total_count", align: "center", width: 180 },
  ];

  // --------------- Data transform ---------------
  const mainData: GroupRow[] = React.useMemo(() => {
    const groups = data?.groups ?? [];
    return groups.map((g: any, gi: number) => {
      const details: DetailRow[] = (g.details || []).map((d: any, idx: number) => ({
        index: idx + 1,
        date: dayjs(d.date).format("DD/MM/YYYY"),
        technique_name: d.technique_name,
        count: d.count,
      }));

      return {
        key: `grp-${g.customer?.id ?? "x"}-${g.treatment_type ?? "NA"}-${gi}`,
        customer_name: g.customer?.name ?? "-",
        treatment_type_label: g.treatment_type === "TLDS" ? "Trị liệu dưỡng sinh" : "Trị liệu chữa bệnh",
        total_count: g.total_count ?? 0,
        details,
      };
    });
  }, [data]);

  // --------------- row expand behavior ---------------
  const expandable: TableProps<GroupRow>["expandable"] = {
    expandedRowRender: (record) => (
      <div className="p-4">
        <Table<DetailRow>
          size="small"
          rowKey={(r) => `detail-${record.key}-${r.index}`}
          columns={detailColumns}
          dataSource={record.details}
          pagination={{ pageSize: 20 }}
          bordered
        />
      </div>
    ),
    // mở/đóng bằng click cả hàng
    expandRowByClick: true,
    columnWidth: 48,
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnClose
      title={
        <div className="flex flex-wrap items-center gap-3">
          <span>Chi tiết lượt làm — </span>
          <strong>{expertName || "Nhân viên"}</strong>
          <Divider type="vertical" />
          <Space size={8} wrap>
            <span>Từ ngày</span>
            <DatePicker value={from} onChange={(d) => d && setFrom(d)} />
            <span>Đến ngày</span>
            <DatePicker value={to} onChange={(d) => d && setTo(d)} />
          </Space>
        </div>
      }
    >
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as TabKey)}
        items={[
          { key: "TLCB", label: "Lượt làm trị liệu chữa bệnh" },
          { key: "TLDS", label: "Lượt làm trị liệu dưỡng sinh" },
        ]}
      />

      <Table<GroupRow>
        rowKey={(r) => r.key}
        columns={mainColumns}
        dataSource={mainData}
        bordered
        loading={isFetching}
        expandable={expandable}
        locale={{ emptyText: "Chưa có lượt thực hiện trị liệu nào" }}
      />
    </Modal>
  );
}
