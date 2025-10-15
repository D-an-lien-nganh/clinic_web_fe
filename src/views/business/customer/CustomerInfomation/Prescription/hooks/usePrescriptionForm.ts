"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { message, Form } from "antd";
import html2canvas from "html2canvas";

import {
  DiagnosisMedicineDTO,
  RowItem,
  ProductOption,
  DiscountOption,
} from "../types";

// API hooks
import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
import { useGetProductListQuery } from "@/api/app_product/apiService";
import { useGetDiscountListQuery } from "@/api/app_home/apiConfiguration";
import { useDeleteDiagnosisMedicineMutation } from "@/api/app_treatment/apiTreatment";

/** gom toàn bộ state + side effects vào hook */
export function usePrescriptionForm(params: {
  initial?: DiagnosisMedicineDTO[] | null;
  initialDoctorUserId?: number | null;
  initialDiscountId?: number | undefined;
}) {
  const { initial, initialDoctorUserId, initialDiscountId } = params;

  // ===== form =====
  const [form] = Form.useForm();

  // ===== employees (doctors) =====
  const { data: empData, isLoading: empLoading } = useGetEmployeeListQuery({
    page: 1,
    pageSize: 200,
    searchTerm: "",
    startDate: "",
    endDate: "",
    format: "",
    department: "",
  });

  const doctorOptions = useMemo(() => {
    const list = (empData?.results ?? empData ?? []) as any[];
    const raw = list.map((e) => ({
      user: Number(e?.id),
      typeVal: String(e?.type ?? e?.employee_type ?? e?.employeeType).toLowerCase(),
      label:
        (e?.full_name ?? "").trim() +
        (e?.position?.department_name ?? e?.department ?? e?.position?.title
          ? ` - ${e?.position?.department_name ?? e?.department ?? e?.position?.title}`
          : ""),
    }));

    const currentId = Number(initialDoctorUserId);
    const filtered = raw.filter((r) => r.typeVal === "employee");

    if (currentId && !filtered.some((r) => r.user === currentId)) {
      const curr = raw.find((r) => r.user === currentId);
      if (curr) filtered.unshift(curr);
    }
    return filtered.map((r) => ({ value: r.user, label: r.label }));
  }, [empData, initialDoctorUserId]);

  // Prefill doctor
  useEffect(() => {
    if (initialDoctorUserId != null) {
      form.setFieldsValue({ doctor_id: Number(initialDoctorUserId) });
    }
  }, [initialDoctorUserId, form]);

  // Remap label sau khi options có
  useEffect(() => {
    const current = form.getFieldValue("doctor_id");
    if (current == null) {
      if (initialDoctorUserId != null) {
        form.setFieldsValue({ doctor_id: Number(initialDoctorUserId) });
      }
      return;
    }
    if (doctorOptions.some((opt) => Number(opt.value) === Number(current))) {
      form.setFieldsValue({ doctor_id: Number(current) });
    }
  }, [doctorOptions, initialDoctorUserId, form]);

  // ===== products =====
  const { data: productResp, isLoading: productLoading } =
    useGetProductListQuery({ page: 1, pageSize: 500, searchTerm: "" });

  const productOptions: ProductOption[] = useMemo(
    () =>
      (productResp?.results ?? [])
        .filter((p: any) => p.product_type !== "consumable")
        .map((p: any) => ({
          value: p.id,
          label: `${p.name} (${p.code})`,
          unit_name: p.unit_name,
          sell_price: Number(p.sell_price || 0),
        })),
    [productResp]
  );

  // ===== discount =====
  const { data: discResp, isLoading: discLoading } = useGetDiscountListQuery();
  const discountOptions: DiscountOption[] = useMemo(
    () =>
      (discResp?.results ?? []).map((d: any) => ({
        value: Number(d.id),
        label:
          d.type === "percentage"
            ? `${d.name} (${d.rate}%)`
            : `${d.name} (${Number(d.rate).toLocaleString()}đ)`,
        type: d.type,
        rate: Number(d.rate),
      })),
    [discResp]
  );

  // ===== rows state =====
  const [rows, setRows] = useState<RowItem[]>([{ id: Date.now(), quantity: 1 }]);
  const [discountId, setDiscountId] = useState<number | undefined>(initialDiscountId);
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  // map initial -> rows
  useEffect(() => {
    if (!initial || !initial.length) return;
    const mapped: RowItem[] = initial.map((it) => {
      const option = productOptions.find((p) => p.value === it.product);
      return {
        id: it.id,
        productId: it.product,
        productName: option?.label,
        quantity: Number(it.quantity ?? 1),
        unit: option?.unit_name || (it.unit ? `Unit ${it.unit}` : undefined),
        dosage: it.dose ?? undefined,
        note: it.note ?? undefined,
        price: Number(it.price),
      };
    });
    setRows(mapped.length ? mapped : [{ id: Date.now(), quantity: 1 }]);
  }, [initial, productOptions]);

  useEffect(() => setDiscountId(initialDiscountId), [initialDiscountId]);

  const setRow = useCallback(
    (rowId: number, patch: Partial<RowItem>) =>
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))),
    []
  );

  const addRow = useCallback(
    () => setRows((prev) => [...prev, { id: Date.now(), quantity: 1 }]),
    []
  );

  const [deleteMedicine] = useDeleteDiagnosisMedicineMutation();

  const removeRow = useCallback(
    async (rowId: number, initialList?: DiagnosisMedicineDTO[] | null) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;
      const serverItem = initialList?.find((it) => it.id === row.id);
      if (serverItem?.id) {
        try {
          await deleteMedicine(serverItem.id).unwrap();
          message.success("Xóa thuốc thành công");
        } catch (err: any) {
          message.error(err?.data?.detail || err?.data?.error || "Xóa thuốc không thành công");
          return;
        }
      }
      setRows((prev) => prev.filter((r) => r.id !== rowId));
    },
    [rows, deleteMedicine]
  );

  // ===== money calc =====
  const lineAmount = useCallback((r: RowItem) => (r.quantity || 0) * (r.price || 0), []);
  const subtotal = useMemo(() => rows.reduce((s, r) => s + lineAmount(r), 0), [rows, lineAmount]);
  const selectedDiscount = useMemo(
    () => discountOptions.find((d) => d.value === discountId),
    [discountOptions, discountId]
  );

  const buildFinalAmount = useCallback(
    (isDoctor: boolean) => {
      const discountAmount =
        !isDoctor && selectedDiscount
          ? selectedDiscount.type === "percentage"
            ? Math.round((subtotal * (selectedDiscount.rate || 0)) / 100)
            : selectedDiscount.rate || 0
          : 0;
      return Math.max(subtotal - discountAmount, 0);
    },
    [selectedDiscount, subtotal]
  );

  // ===== events =====
  const onProductChange = useCallback(
    (rowId: number, productId: number) => {
      const found = productOptions.find((x) => x.value === productId);
      setRow(rowId, {
        productId,
        productName: found?.label,
        unit: found?.unit_name,
        price: found?.sell_price,
      });
    },
    [productOptions, setRow]
  );

  const handlePrintImage = useCallback(async () => {
    try {
      if (!printRef.current) {
        message.error("Không tìm thấy vùng in (printRef).");
        return;
      }
      setPrinting(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
      const canvas = await html2canvas(printRef.current, {
        scale,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>In đơn thuốc</title>
            <style>
              @page { size: A5 portrait; margin: 8mm; }
              html, body { margin: 0; padding: 0; }
              .wrap { display:flex; justify-content:center; align-items:center; width:100%; }
              img { width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <div class="wrap"><img src="${dataUrl}" /></div>
            <script>
              setTimeout(() => { window.print(); window.onfocus = () => window.close(); }, 300);
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

  return {
    form,
    printRef,
    printing,
    empLoading,
    productLoading,
    discLoading,
    doctorOptions,
    productOptions,
    discountOptions,
    rows,
    setRow,
    addRow,
    removeRow,
    onProductChange,
    subtotal,
    selectedDiscount,
    discountId,
    setDiscountId,
    buildFinalAmount,
    handlePrintImage,
  };
}
