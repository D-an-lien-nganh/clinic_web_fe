import { useCallback } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface UseExportProps {
  columns: any[];
  data: any[];
  fileName: string;
  pdfTheme?: "striped" | "grid" | "plain";
  pdfOptions?: any;
}

const useExport = ({ columns, data, fileName, pdfTheme = "striped", pdfOptions = {} }: UseExportProps) => {
  // Xuất Excel
  const onExcelPrint = useCallback(() => {
    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    const workbook = XLSX.utils.book_new();

    // Thêm tiêu đề
    const title = [[fileName.toUpperCase()]];
    const headers = [Object.keys(data[0] || {})];
    XLSX.utils.sheet_add_aoa(worksheet, title, { origin: "A1" });
    XLSX.utils.sheet_add_aoa(worksheet, headers, { origin: "A3" });
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A4", skipHeader: true });

    // Định dạng cột (tùy chỉnh theo nhu cầu)
    worksheet["!cols"] = headers[0].map(() => ({ wch: 20 }));

    // Định dạng tiêu đề
    worksheet["A1"].s = {
      font: { name: "Times New Roman", sz: 18, bold: true },
      alignment: { horizontal: "center" },
    };

    // Gộp ô cho tiêu đề
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers[0].length - 1 } }];

    XLSX.utils.book_append_sheet(workbook, worksheet, fileName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }, [data, fileName]);

  // Xuất PDF
  const onPdfPrint = useCallback(() => {
    const doc = new jsPDF("landscape");

    // Tiêu đề
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(fileName.toUpperCase(), doc.internal.pageSize.width / 2, 15, { align: "center" });

    // Thêm bảng
    autoTable(doc, {
      head: [Object.keys(data[0] || {})],
      body: data.map((item: any) => Object.values(item)),
      startY: 25,
      theme: pdfTheme,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontSize: 12,
        halign: "center",
        valign: "middle",
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
        halign: "center",
        valign: "middle",
        lineColor: [150, 150, 150],
        lineWidth: 0.2,
        overflow: "linebreak",
      },
      ...pdfOptions,
    });

    // Thêm footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Trang ${i}/${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: "right" });
    }

    doc.save(`${fileName}.pdf`);
  }, [data, fileName, pdfTheme, pdfOptions]);

  return { onExcelPrint, onPdfPrint };
};

export default useExport;