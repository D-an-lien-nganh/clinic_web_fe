"use client";

import React from "react";
import { DiscountOption, RowItem } from "../types";

type Props = {
  refEl: React.RefObject<HTMLDivElement>;
  doctorLabel: string | undefined;
  customerId?: string | null;
  rows: RowItem[];
  subtotal: number;
  isDoctor: boolean;
  selectedDiscount?: DiscountOption;
  finalAmount: number;
  customerName?: string | null;
  employeeName?: string | null;
  note?: string | null;
  clinicLogoUrl?: string | null;
};

export default function PrintPreview({
  refEl,
  doctorLabel,
  customerId,
  rows,
  subtotal,
  isDoctor,
  selectedDiscount,
  finalAmount,
  customerName,
  employeeName,
  note,
  clinicLogoUrl,
}: Props) {
  const issueDate = new Date().toISOString();
  const displayDate = issueDate ? new Date(issueDate) : new Date();
  const dd = displayDate.getDate().toString().padStart(2, "0");
  const mm = (displayDate.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = displayDate.getFullYear();
  return (
    <div
      ref={refEl}
      style={{
        width: 560,
        padding: 16,
        background: "#fff",
        color: "#111",
        fontFamily:
          "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial",
        border: "1px solid #eee",
        position: "absolute",
        left: -10000,
        top: 0,
      }}
      aria-hidden
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 140,
          }}
        >
          {clinicLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinicLogoUrl}
              alt="logo"
              width={80}
              height={80}
              style={{ objectFit: "contain" }}
              crossOrigin="anonymous"
            />
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: 12, minWidth: 140 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>
            PHÒNG KHÁM CHUYÊN KHOA YHCT THANH BÌNH
          </div>
          <div style={{ fontSize: 12 }}>
            Địa chỉ: Số 36 ngõ 133 Thái Hà, Phường Đống Đa, TP Hà Nội
          </div>
          <div style={{ fontSize: 12 }}>Điện thoại: 0986.244.314</div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "4px 0 8px" }}>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>
          HÓA ĐƠN / ĐƠN THUỐC
        </div>
        <div style={{ fontSize: 12, color: "#555" }}>
          (Bản in cho khách hàng)
        </div>
      </div>

      {/* Info */}
      <div style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>
        <div>
          <b>Bác sĩ kê đơn:</b> {doctorLabel || "—"}
        </div>
        <div>
          <b>Khách hàng:</b> {customerName || "—"}
        </div>
        <div>
          <b>Mã KH:</b> {customerId || "—"}
        </div>
      </div>

      {/* Table */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                width: 32,
                textAlign: "center",
              }}
            >
              STT
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                textAlign: "left",
              }}
            >
              Sản phẩm
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                width: 60,
                textAlign: "center",
              }}
            >
              SL
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                width: 58,
                textAlign: "center",
              }}
            >
              ĐVT
            </th>
            <th
              style={{
                border: "1px solid #ddd",
                padding: 6,
                textAlign: "right",
                width: 100,
              }}
            >
              Thành tiền
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`p-${r.id}`}>
              <td
                style={{
                  border: "1px solid #eee",
                  padding: 6,
                  textAlign: "center",
                }}
              >
                {idx + 1}
              </td>
              <td style={{ border: "1px solid #eee", padding: 6 }}>
                <div style={{ fontWeight: 600 }}>{r.productName || "—"}</div>
                {r.dosage && (
                  <div style={{ fontSize: 12, color: "#555" }}>
                    Liều dùng: {r.dosage}
                  </div>
                )}
                {r.note && (
                  <div style={{ fontSize: 12, color: "#555" }}>
                    Ghi chú: {r.note}
                  </div>
                )}
              </td>
              <td
                style={{
                  border: "1px solid #eee",
                  padding: 6,
                  textAlign: "center",
                }}
              >
                {r.quantity}
              </td>
              <td
                style={{
                  border: "1px solid #eee",
                  padding: 6,
                  textAlign: "center",
                }}
              >
                {r.unit || "-"}
              </td>
              <td
                style={{
                  border: "1px solid #eee",
                  padding: 6,
                  textAlign: "right",
                }}
              >
                {((r.quantity || 0) * (r.price || 0)).toLocaleString("vi-VN")}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={4}
              style={{
                padding: 6,
                textAlign: "right",
                borderTop: "1px dashed #aaa",
              }}
            >
              Tổng tiền
            </td>
            <td
              style={{
                padding: 6,
                textAlign: "right",
                borderTop: "1px dashed #aaa",
              }}
            >
              {subtotal.toLocaleString("vi-VN")}
            </td>
          </tr>
          <tr>
            <td colSpan={4} style={{ padding: 6, textAlign: "right" }}>
              Khuyến mãi {selectedDiscount ? `(${selectedDiscount.label})` : ""}
            </td>
            <td style={{ padding: 6, textAlign: "right" }}>
              -
              {(!isDoctor && selectedDiscount
                ? selectedDiscount.type === "percentage"
                  ? Math.round((subtotal * (selectedDiscount.rate || 0)) / 100)
                  : selectedDiscount.rate || 0
                : 0
              ).toLocaleString("vi-VN")}
            </td>
          </tr>
          <tr>
            <td
              colSpan={4}
              style={{
                padding: "8px 6px",
                textAlign: "right",
                fontWeight: 800,
                fontSize: 14,
                borderTop: "1px solid #111",
              }}
            >
              Thành tiền
            </td>
            <td
              style={{
                padding: "8px 6px",
                textAlign: "right",
                fontWeight: 800,
                fontSize: 14,
                borderTop: "1px solid #111",
              }}
            >
              {finalAmount.toLocaleString("vi-VN")}
            </td>
          </tr>
        </tfoot>
      </table>

      <div
        style={{
          fontSize: 12,
          color: "#444",
          marginTop: 10,
          whiteSpace: "pre-line",
        }}
      >
        * Lời dặn của bác sĩ: {note || "Không có"}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginTop: 16,
        }}
      >
        <div>Nhân viên thu ngân: {employeeName || "—"}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: 6 }}>
              Ngày {dd} tháng {mm} năm {yyyy}
            </div>
            <div style={{ fontWeight: 300 }}>Chữ ký khách hàng</div>
            <div style={{ height: 64 }} />
            <div style={{ fontStyle: "italic" }}>(Ký, ghi rõ họ tên)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
