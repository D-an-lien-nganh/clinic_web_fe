// useTreatmentPrint.ts - Fixed to match working ExaminationPrint pattern
"use client";
import { useCallback, useRef, useState } from "react";
import { message } from "antd";
import html2canvas from "html2canvas";
import { DiscountOption } from "../Prescription/types";

export type TreatmentPrintRow = {
  stt: number;
  sessionTime?: string;
  sessionNote?: string;
  techniqueName: string;
  duration: string;
  experts: string;
  statusText?: string;
};

export type TreatmentPrintData = {
  clinicLogoUrl?: string;
  clinicName?: string;
  clinicAddress?: string;
  customerName?: string;
  employeeName?: string;
  clinicPhone?: string;
  code?: string;
  finalAmount: number;
  subtotal: number;
  isDoctor: boolean;
  issueDate?: string;
  doctorName: string;
  serviceTypeLabel: string;
  serviceName: string;
  packageName?: string;
  price: number;
  paid: number;
  debt: number;
  rows: TreatmentPrintRow[];
};

export function useTreatmentPrint() {
  const [printing, setPrinting] = useState(false);
  const [printData, setPrintData] = useState<TreatmentPrintData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintTreatment = useCallback(async (data: TreatmentPrintData) => {
    try {
      // Set data để render print preview
      setPrintData({
        // Default clinic info
        clinicName: "PHÒNG KHÁM CHUYÊN KHOA YHCT THANH BÌNH",
        clinicAddress: "Số 36 ngõ 133 Thái Hà, Phường Đống Đa, TP Hà Nội",
        clinicPhone: "0986.244.314",
        issueDate: new Date().toISOString(),
        ...data,
      });

      // Wait for printRef to be updated - SAME AS EXAMINATION
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!printRef.current) {
        message.error("Không tìm thấy vùng in (printRef).");
        return;
      }

      setPrinting(true);

      // Wait for next frame to ensure DOM is updated - SAME AS EXAMINATION
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(null))
      );

      // Generate high-quality image - SAME SETTINGS AS EXAMINATION
      const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
      const canvas = await html2canvas(printRef.current, {
        scale,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL("image/png");

      // Open new window for printing - SAME AS EXAMINATION
      const w = window.open("", "_blank");
      if (!w) {
        message.error(
          "Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker."
        );
        return;
      }

      // 🔥 CRITICAL FIX: Use SAME HTML structure and auto-print script as Examination
      w.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>In hóa đơn liệu trình</title>
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
      console.error("Print error:", e);
      message.error("Không thể tạo ảnh in. Vui lòng thử lại.");
    } finally {
      setPrinting(false);
    }
  }, []);

  const closePrintPreview = useCallback(() => setPrintData(null), []);

  return {
    printing,
    printRef,
    handlePrintTreatment,
    printData,
    closePrintPreview,
  };
}
