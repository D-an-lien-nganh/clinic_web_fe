"use client";

import { useRef, useState, useCallback } from "react";
import { message } from "antd";
import html2canvas from "html2canvas";

// Types cho dữ liệu in đơn khám
export type ExaminationPrintData = {
  // Header / Clinic meta
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicWebsite?: string;
  clinicFanpage?: string;

  // Receipt meta
  code?: string | number;
  issueDate?: string;

  // Patient info
  customerName?: string;
  dob?: string;
  address?: string;
  gender?: "Nam" | "Nữ" | "Khác" | "";
  job?: string;
  phone?: string;
  referralSource?: "Fanpage" | "Người giới thiệu" | "";

  // Doctor
  doctorFullName?: string;

  // Medical examination data
  medicalHistory?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    respiration?: string;
    weight?: string;
    height?: string;
    generalStatus?: string;
  };
  currentSymptoms?: string;
  recentTests?: string;
  diagnosis?: string;
  treatmentMedicine?: string;
  treatmentTherapy?: string;
  treatmentDate?: string;
  problemForPrint?: string;
};

/** Hook quản lý logic in đơn khám - tương tự logic handlePrintImage trong usePrescriptionForm */
export function useExaminationPrint() {
  // ===== printing state =====
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);
  
  // ===== print data state =====
  const [printData, setPrintData] = useState<ExaminationPrintData | null>(null);

  // ===== handle print - logic tương tự handlePrintImage =====
  const handlePrintExamination = useCallback(async (data: ExaminationPrintData) => {
    try {
      // Set data để render print preview
      setPrintData({
        // Default clinic info
        clinicName: "PHÒNG KHÁM CHUYÊN KHOA YHCT THANH BÌNH",
        clinicAddress: "Số 36 ngõ 133 Thái Hà, Phường Đống Đa, TP Hà Nội", 
        clinicPhone: "0986.244.314",
        clinicWebsite: "https://thabicare.vn/",
        clinicFanpage: "Thabicare - Trị liệu đông y cơ xương khớp",
        issueDate: new Date().toISOString(),
        ...data,
      });

      // Wait for printRef to be updated
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!printRef.current) {
        message.error("Không tìm thấy vùng in (printRef).");
        return;
      }

      setPrinting(true);
      
      // Wait for next frame to ensure DOM is updated
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      // Generate high-quality image - tương tự logic trong usePrescriptionForm
      const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
      const canvas = await html2canvas(printRef.current, {
        scale,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL("image/png");
      
      // Open new window for printing - tương tự logic trong usePrescriptionForm
      const w = window.open("", "_blank");
      if (!w) {
        message.error("Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.");
        return;
      }

      // Write HTML for print window - tương tự style trong usePrescriptionForm
      w.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>In phiếu khám bệnh</title>
            <style>
              @page { size: A4 portrait; margin: 8mm; }
              html, body { margin: 0; padding: 0; }
              .wrap { display:flex; justify-content:center; align-items:center; width:100%; }
              img { width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div class="wrap"><img src="${dataUrl}" /></div>
            <script>
              setTimeout(() => { 
                window.print(); 
                window.onfocus = () => window.close(); 
              }, 300);
            </script>
          </body>
        </html>
      `);
      w.document.close();

    } catch (e) {
      console.error(e);
      message.error("Không thể tạo ảnh in. Vui lòng thử lại.");
    } finally {
      setPrinting(false);
    }
  }, []);

  // ===== close print preview =====
  const closePrintPreview = useCallback(() => {
    setPrintData(null);
  }, []);

  return {
    printing,
    printRef,
    printData,
    handlePrintExamination,
    closePrintPreview,
  };
}