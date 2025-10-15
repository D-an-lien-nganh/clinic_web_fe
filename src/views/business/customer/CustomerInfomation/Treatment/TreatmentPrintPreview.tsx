"use client";
import React from "react";
import { TreatmentPrintData, TreatmentPrintRow } from "./useTreatmentPrint";

type Props = { refEl: React.RefObject<HTMLDivElement> } & TreatmentPrintData;

const Line = ({
  text,
  ph = "………………………………………………………………………………………………",
}: {
  text?: string;
  ph?: string;
}) => <span>{text && String(text).trim() ? text : ph}</span>;

export default function TreatmentPrintPreview({
  refEl,
  clinicLogoUrl,
  clinicName = "PHÒNG KHÁM CHUYÊN KHOA YHCT THANH BÌNH",
  clinicAddress = "Số 36 ngõ 133 Thái Hà, Phường Đống Đa, TP Hà Nội",
  clinicPhone = "0986.244.314",

  issueDate,

  customerName,
  employeeName,
  subtotal,
  isDoctor,
  finalAmount,

  doctorName,

  serviceTypeLabel,
  serviceName,
  packageName,

  rows,
}: Props) {
  const displayDate = issueDate ? new Date(issueDate) : new Date();
  const dd = displayDate.getDate().toString().padStart(2, "0");
  const mm = (displayDate.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = displayDate.getFullYear();
  const discountValue = Math.max(
    0,
    Number(finalAmount || 0) - Number(subtotal || 0)
  );

  return (
    <div
      ref={refEl}
      style={{
        width: 760,
        padding: 20,
        background: "#fff",
        color: "#111",
        fontFamily:
          "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial",
        border: "1px solid #eee",
        position: "absolute",
        left: -10000,
        top: 0,
        lineHeight: 1.5,
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
          <div style={{ fontWeight: 800, fontSize: 14 }}>{clinicName}</div>
          <div style={{ fontSize: 12 }}>Địa chỉ: {clinicAddress}</div>
          <div style={{ fontSize: 12 }}>Điện thoại: {clinicPhone}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "12px 0 16px" }}>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.5 }}>
          HÓA ĐƠN PHÁC ĐỒ ĐIỀU TRỊ
        </div>
      </div>

      {/* Thông tin chung */}
      <div style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
        <div>
          Họ tên bệnh nhân: {" "}
          <b>
            <Line text={customerName} />
          </b>
        </div>
        <div>
          Bác sĩ kê liệu trình: {" "}
          <b>
            <Line text={doctorName} />
          </b>
        </div>
        <div>
          Loại dịch vụ: {" "}
          <b>
            <Line text={serviceTypeLabel} />
          </b>
        </div>
        <div>
          Dịch vụ: {" "}
          <b>
            <Line text={serviceName} />
          </b>
        </div>
        <div>
          Gói liệu trình: {" "}
          <b>
            <Line text={packageName} />
          </b>
        </div>
      </div>

      {/* Bảng chi tiết buổi trị liệu */}
      <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 6 }}>
        Chi tiết buổi trị liệu
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
          marginTop: 4,
        }}
      >
        <thead>
          <tr style={{ background: "#f8f8f8" }}>
            {[
              "STT",
              "Thời gian",
              "Ghi chú",
              "Kỹ thuật",
              "Thời lượng",
              "KTV",
              "Trạng thái",
            ].map((h, i) => (
              <th
                key={i}
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                  verticalAlign: "middle",
                  fontWeight: 600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((r) => (
            <tr key={r.stt}>
              <td style={{ ...cellStyle, textAlign: "center", width: 48 }}>
                {r.stt}
              </td>
              <td style={{ ...cellStyle, textAlign: "center", width: 140 }}>
                {r.sessionTime || "—"}
              </td>
              <td style={{ ...cellStyle, textAlign: "left" }}>
                {r.sessionNote || "—"}
              </td>
              <td style={{ ...cellStyle, textAlign: "left" }}>
                {r.techniqueName}
              </td>
              <td style={{ ...cellStyle, textAlign: "center", width: 90 }}>
                {r.duration}
              </td>
              <td style={{ ...cellStyle, textAlign: "left", width: 160 }}>
                {r.experts}
              </td>
              <td style={{ ...cellStyle, textAlign: "center", width: 100 }}>
                {r.statusText || "—"}
              </td>
            </tr>
          ))}
          {(!rows || rows.length === 0) && (
            <tr>
              <td
                colSpan={7}
                style={{
                  border: "1px solid #eee",
                  padding: 12,
                  textAlign: "center",
                  verticalAlign: "middle",
                  color: "#666",
                }}
              >
                Không có kỹ thuật nào trong các buổi trị liệu
              </td>
            </tr>
          )}
        </tbody>

        {/* Tổng kết tiền */}
        <tfoot>
          <tr>
            <td
              colSpan={6}
              style={{
                padding: 8,
                textAlign: "right",
                borderTop: "1px dashed #aaa",
              }}
            >
              Tổng tiền
            </td>
            <td
              style={{
                padding: 8,
                textAlign: "right",
                borderTop: "1px dashed #aaa",
              }}
            >
              {subtotal.toLocaleString("vi-VN")} đ
            </td>
          </tr>
          <tr>
            <td colSpan={6} style={{ padding: 8, textAlign: "right" }}>
              Khuyến mãi:
            </td>
            <td style={{ padding: 8, textAlign: "right" }}>
              - {discountValue.toLocaleString("vi-VN")} đ
            </td>
          </tr>
          <tr>
            <td
              colSpan={6}
              style={{
                padding: "10px 8px",
                textAlign: "right",
                fontWeight: 800,
                fontSize: 15,
                borderTop: "1px solid #111",
              }}
            >
              Thành tiền
            </td>
            <td
              style={{
                padding: "6px 4px",
                textAlign: "right",
                fontWeight: 800,
                fontSize: 15,
                borderTop: "1px solid #111",
              }}
            >
              {finalAmount.toLocaleString("vi-VN")} đ
            </td>
          </tr>
        </tfoot>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginTop: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Thu ngân bên trái */}
        <div style={{ minWidth: 240 }}>
          Nhân viên thu ngân: {employeeName || "—"}
        </div>

        {/* Chữ ký khách hàng ép sát phải */}
        <div style={{ textAlign: "center", minWidth: 300 }}>
          <div>
            Ngày {dd ?? ""} tháng {mm ?? ""} năm {yyyy ?? ""}
          </div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>Chữ ký khách hàng</div>
          <div style={{ height: 64 }} />
          <div style={{ fontStyle: "italic" }}>
            (Ký, ghi rõ họ tên)
          </div>
        </div>
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #eee",
  padding: "6px 8px",
  textAlign: "center",
  verticalAlign: "middle",
};
