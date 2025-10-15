"use client";

import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

export type Technique = { id: number; name: string };

type Row = { key: number | string; index: number; name: string };

type Props = {
  techniques?: Technique[];
  hasServiceSelected: boolean;
};

export default function TechniquesTable({ techniques = [], hasServiceSelected }: Props) {
  const data: Row[] = useMemo(
    () =>
      techniques.map((t, idx) => ({
        key: t.id ?? `${t.name}-${idx}`,
        index: idx + 1,
        name: t.name,
      })),
    [techniques]
  );

  const columns: ColumnsType<Row> = [
    { title: "STT", dataIndex: "index", width: 70, align: "center" },
    { title: "Các kỹ thuật trong gói", dataIndex: "name" },
  ];

  return (
    <Table
      bordered
      size="middle"
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 7, hideOnSinglePage: data.length <= 7 }}
      locale={{
        emptyText: hasServiceSelected
          ? "Dịch vụ này chưa có kỹ thuật."
          : "Chọn loại dịch vụ để xem kỹ thuật.",
      }}
    />
  );
}
