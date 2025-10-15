"use client";

import Image from "next/image";
import React from "react";

type Vitals = {
  bloodPressure?: string; // "120/80 mmHg"
  heartRate?: string; // "78 bpm"
  respiration?: string; // "18 bpm"
  weight?: string; // "60 kg"
  height?: string; // "170 cm"
  generalStatus?: string; // "Tỉnh táo, tiếp xúc tốt…"
};

type Props = {
  refEl: React.RefObject<HTMLDivElement>;

  // Header / Clinic meta
  clinicName?: string; // default: "PHÒNG KHÁM CHUYÊN KHOA YHCT THANH BÌNH"
  clinicAddress?: string; // default: "Số 36 ngõ 133 Thái Hà, Phường Đống Đa, TP Hà Nội"
  clinicPhone?: string; // default: "0986.244.314"
  clinicWebsite?: string; // default: "https://thabicare.vn/"
  clinicFanpage?: string; // default: "Thabicare - Trị liệu đông y cơ xương khớp"

  // Receipt meta
  code?: string | number; // mã đơn
  issueDate?: string; // ngày in (ISO/string). Nếu không truyền sẽ dùng today

  // Patient
  customerName?: string;
  dob?: string; // "01/01/1990"
  address?: string;
  gender?: "Nam" | "Nữ" | "Khác" | "";
  job?: string;
  phone?: string;
  referralSource?: "Fanpage" | "Người giới thiệu" | "";

  // Doctor — full name only
  doctorFullName?: string;

  // Section II – Phần khám
  medicalHistory?: string; // Tiền sử bệnh
  vitals?: Vitals; // Toàn thân (lần đầu)
  currentSymptoms?: string; // Triệu chứng hiện tại
  recentTests?: string; // Xét nghiệm gần nhất
  diagnosis?: string; // Chẩn đoán
  treatmentMedicine?: string; // Hướng điều trị - Thuốc
  treatmentTherapy?: string; // Hướng điều trị - Trị liệu
  treatmentDate?: string; // Ngày/tháng/năm ký phần II (optional)
  problemForPrint?: string; 
};

export default function ExaminationPrintPreview({
  refEl,
  // clinic defaults
  clinicName = "PHÒNG KHÁM CHUYÊN KHOA YHCT THANH BÌNH",
  clinicAddress = "Số 36 ngõ 133 Thái Hà, Phường Đống Đa, TP Hà Nội",
  clinicPhone = "0986.244.314",
  clinicWebsite = "https://thabicare.vn/",
  clinicFanpage = "Thabicare - Trị liệu đông y cơ xương khớp",

  code,
  issueDate,

  customerName,
  dob,
  address,
  gender = "",
  job,
  phone,
  referralSource = "",

  doctorFullName,

  medicalHistory,
  vitals,
  currentSymptoms,
  recentTests,
  diagnosis,
  treatmentMedicine,
  treatmentTherapy,
  treatmentDate,
  problemForPrint,
}: Props) {
  const line = (
    text?: string,
    placeholder = "………………………………………………………………………………………………"
  ) => (text && text.trim() ? text : placeholder);

  const renderVitalsBlock = (v?: Vitals, showWH = true) => (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <span>
          Huyết áp: <b>{line(v?.bloodPressure, "………………")}</b>
        </span>
        <span>
          Nhịp tim: <b>{line(v?.heartRate, "………………")}</b>
        </span>
        <span>
          Nhịp thở: <b>{line(v?.respiration, "………………")}</b>
        </span>
      </div>
      {showWH && (
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}
        >
          <span>
            Cân nặng: <b>{line(v?.weight, "………………")}</b>
          </span>
          <span>
            Chiều cao: <b>{line(v?.height, "………………")}</b>
          </span>
        </div>
      )}
    </div>
  );

  const renderSignRow = (date?: string) => {
    // Nếu không truyền date -> lấy ngày hiện tại
    const displayDate = date ? new Date(date) : new Date();

    // Tách ngày/tháng/năm
    const day = displayDate.getDate().toString().padStart(2, "0");
    const month = (displayDate.getMonth() + 1).toString().padStart(2, "0");
    const year = displayDate.getFullYear();

    return (
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div />
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 6 }}>
            Ngày {day} tháng {month} năm {year}
          </div>
          <div style={{ fontWeight: 600 }}>Bác sỹ khám bệnh</div>
          <div style={{ height: 64 }} />
          <div style={{ fontStyle: "italic" }}>{doctorFullName || " "}</div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={refEl}
      style={{
        width: 700,
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
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div>
          <Image
            src="/THABI_LOGO-01.jpg"
            alt="Thabi Care Logo"
            width={100}
            height={100}
            style={{
              width: 100,
              height: "auto",
              objectFit: "contain",
              opacity: 0.95,
            }}
            priority
            unoptimized // tránh qua loader, tương thích hơn khi html2canvas chụp
          />
        </div>
        <div style={{ textAlign: "right", fontSize: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{clinicName}</div>
          <div style={{ fontSize: 12 }}>Địa chỉ: {clinicAddress}</div>
          <div style={{ fontSize: 12 }}>Điện thoại: {clinicPhone}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "6px 0 10px" }}>
        <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.5 }}>
          PHIẾU KHÁM BỆNH
        </div>
      </div>

      {/* I. Thông tin khách hàng */}
      <div style={{ fontWeight: 700, marginTop: 6, marginBottom: 4 }}>
        I. THÔNG TIN KHÁCH HÀNG
      </div>
      <div style={{ fontSize: 13 }}>
        <div>
          Họ tên: <b>{line(customerName)}</b>
        </div>
        <div>
          Ngày sinh: <span>{line(dob)}</span>
        </div>
        <div>
          Địa chỉ: <span>{line(address)}</span>
        </div>
        <div>Giới tính: <span>{line(gender)}</span></div>
        <div>
          Nghề nghiệp: <span>{line(job)}</span>
        </div>
        <div>
          Số điện thoại: <span>{line(phone)}</span>
        </div>
        {/* <div style={{ marginTop: 4 }}>
          Anh/chị biết đến Phòng khám thông qua:&nbsp;&nbsp;
          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={referralSource === "Fanpage"}
              readOnly
            />{" "}
            Fanpage
          </label>
          <label>
            <input
              type="checkbox"
              checked={referralSource === "Người giới thiệu"}
              readOnly
            />{" "}
            Người giới thiệu
          </label>
        </div> */}
      </div>

      {/* II. Phần khám */}
      <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>
        II. PHẦN KHÁM
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>1. Tiền sử bệnh: </div>
        <div style={{ marginTop: 4, fontSize: 13, whiteSpace: "pre-wrap" }}>
          {line(problemForPrint)}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>2. Toàn thân:</div>
        {renderVitalsBlock(vitals, true)}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>3. Triệu chứng bệnh hiện tại:</div>
        <div style={{ marginTop: 4, fontSize: 13, whiteSpace: "pre-wrap" }}>
          {line(currentSymptoms)}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>
          4. Các xét nghiệm đã có (gần nhất):
        </div>
        <div style={{ marginTop: 4, fontSize: 13, whiteSpace: "pre-wrap" }}>
          {line(recentTests)}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>5. Chẩn đoán:</div>
        <div style={{ marginTop: 4, fontSize: 13, whiteSpace: "pre-wrap" }}>
          {line(diagnosis)}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>6. Hướng điều trị</div>

        <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontWeight: 600 }}>a. ☐ Thuốc</div>
            <div style={{ marginTop: 4, fontSize: 13, whiteSpace: "pre-wrap" }}>
              {line(treatmentMedicine)}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>b. ☐ Trị liệu</div>
            <div style={{ marginTop: 4, fontSize: 13, whiteSpace: "pre-wrap" }}>
              {line(treatmentTherapy)}
            </div>
          </div>
        </div>

        {renderSignRow(treatmentDate)}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px dashed #bbb",
          marginTop: 12,
          paddingTop: 8,
          fontSize: 12,
          color: "#333",
        }}
      >
        <div>Website: {clinicWebsite}</div>
        <div>Fanpage: {clinicFanpage}</div>
      </div>
    </div>
  );
}
