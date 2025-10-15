"use client";

import React from "react";
import { Row, Col, Button, Checkbox, Collapse, DatePicker, Input, Select, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";

const { Text } = Typography;

export type ServicePkg = {
  id: number;
  name: string;
  price?: number;
  duration?: number;
  note?: string;
};

export type Technique = { id: number; name: string };
export type ServiceLite = {
  id: number;
  name: string;
  code: string;
  type: string;
  packages: ServicePkg[];
  techniques: Technique[];
};

export type SessionItem = {
  id: number;            // local key
  serverId?: number;     // DB id nếu đã tồn tại
  technicianId?: number;
  techniqueId?: number;
  durationMin?: number;
  room?: string;
  attended?: boolean;
  _saved?: boolean;
};

export type Session = {
  id: number;            // local key
  serverId?: number;     // DB id nếu đã tồn tại
  appointment?: Dayjs | null;
  items: SessionItem[];
};

type Option = { value: any; label: string };

type Props = {
  sessions: Session[];
  selectedPackage?: ServicePkg;
  selectedService?: ServiceLite;

  technicianOptions: Option[];
  techniqueOptions: Option[];

  addSession: () => void;
  addItem: (sid: number) => void;
  setSession: (sid: number, patch: Partial<Session>) => void;
  setItem: (sid: number, itemId: number, patch: Partial<SessionItem>) => void;
  removeItemLocal: (sid: number, itemId: number) => void;

  onToggleAttended: (s: Session, it: SessionItem, checked: boolean) => void;
  onDeleteItem: (s: Session, it: SessionItem) => void;

  onSaveAll: () => void;
  saving?: boolean;
  disabled?: boolean;
};

export default function TreatmentSessions({
  sessions,
  selectedPackage,
  selectedService,
  technicianOptions,
  techniqueOptions,
  addSession,
  addItem,
  setSession,
  setItem,
  removeItemLocal,
  onToggleAttended,
  onDeleteItem,
  onSaveAll,
  saving,
}: Props) {
  return (
    <>
      {/* Khung Phác đồ */}
      <div
        style={{
          border: "1px dashed #D4B258",
          borderRadius: 8,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#eaf5ff",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px dashed #D4B258",
          }}
        >
          <Text strong>Phác đồ dịch vụ</Text>
          <Text>
            Giá tiền:{" "}
            <Text strong>
              {selectedPackage?.price
                ? selectedPackage.price.toLocaleString("vi-VN") + " vnd"
                : "-"}
            </Text>
          </Text>
        </div>

        {/* Nội dung */}
        <div style={{ maxHeight: 520, overflow: "auto", padding: 12 }}>
          {sessions.map((s, idx) => (
            <div key={s.id} style={{ borderBottom: "1px dashed #D4B258", padding: "8px 0" }}>
              <Collapse
                bordered={false}
                collapsible="icon"
                expandIconPosition="start"
                items={[
                  {
                    key: String(s.id),
                    // Label trái: Buổi X + Ngày hẹn
                    label: (
                      <div className="flex items-center gap-10">
                        <span className="font-semibold">{`Buổi ${idx + 1}`}</span>
                        <div className="flex items-center gap-8">
                          <span className="text-gray-500">Ngày hẹn</span>
                          <DatePicker
                            showTime
                            style={{ width: 220 }}
                            value={s.appointment ?? null}
                            onChange={(d) => setSession(s.id, { appointment: d ?? null })}
                            placeholder="20/08/2024 - 10:00"
                            format="DD/MM/YYYY - HH:mm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    ),
                    // Extra phải: Thêm mới dịch vụ
                    extra: (
                      <Button
                        type="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem(s.id);
                        }}
                      >
                        + Thêm mới dịch vụ
                      </Button>
                    ),
                    // Children: danh sách item
                    children: (
                      <div>
                        {s.items.map((it) => (
                          <div
                            key={it.id}
                            style={{
                              padding: 8,
                              border: "1px dotted #e5e7eb",
                              borderRadius: 8,
                              marginBottom: 8,
                              background: "#fff",
                            }}
                          >
                            <Row gutter={8} align="middle" wrap>
                              <Col xs={24} md={6}>
                                <Select
                                  style={{ width: "100%" }}
                                  placeholder="Kỹ thuật viên"
                                  options={technicianOptions}
                                  value={it.technicianId}
                                  onChange={(v) => setItem(s.id, it.id, { technicianId: v })}
                                  showSearch
                                  optionFilterProp="label"
                                />
                              </Col>

                              <Col xs={24} md={6}>
                                <Select
                                  style={{ width: "100%" }}
                                  placeholder={selectedService ? "Chọn kỹ thuật" : "Chọn dịch vụ trước"}
                                  options={techniqueOptions}
                                  value={it.techniqueId}
                                  onChange={(v) => setItem(s.id, it.id, { techniqueId: v })}
                                  disabled={!selectedService}
                                  showSearch
                                  optionFilterProp="label"
                                />
                              </Col>

                              <Col xs={12} md={4}>
                                <Select
                                  style={{ width: "100%" }}
                                  placeholder="Thời lượng"
                                  value={it.durationMin}
                                  onChange={(v) => setItem(s.id, it.id, { durationMin: v })}
                                  options={[10, 15, 20, 30, 40, 60].map((m) => ({
                                    value: m,
                                    label: `${m} phút`,
                                  }))}
                                />
                              </Col>

                              <Col xs={12} md={4}>
                                <Input
                                  placeholder="Phòng"
                                  value={it.room}
                                  onChange={(e) => setItem(s.id, it.id, { room: e.target.value })}
                                />
                              </Col>

                              <Col xs={24} md={4}>
                                <div className="flex items-center justify-end gap-3">
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => onDeleteItem(s, it)}
                                    title="Xóa"
                                  />
                                  <Checkbox
                                    checked={!!it.attended}
                                    onChange={(e) => onToggleAttended(s, it, e.target.checked)}
                                  >
                                    {it.attended ? "Đã đến điều trị" : "Chưa đến điều trị"}
                                  </Checkbox>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ))}

          {/* Thêm buổi */}
          <div className="flex justify-center py-2">
            <Button icon={<PlusOutlined />} onClick={addSession}>
              Thêm
            </Button>
          </div>
        </div>
      </div>

      {/* Nút Lưu toàn bộ */}
      <div className="flex justify-end mt-3">
        <Button type="primary" size="large" onClick={onSaveAll} loading={saving}>
          Lưu
        </Button>
      </div>
    </>
  );
}
