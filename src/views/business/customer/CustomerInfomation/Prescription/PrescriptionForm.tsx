"use client";

import React, { useMemo } from "react";
import { Button, Form, Select, message } from "antd";
import PrescriptionTable from "./ui/PrescriptionTable";
import PrintPreview from "./ui/PrintPreview";
import { usePrescriptionForm } from "./hooks/usePrescriptionForm";
import { PrescriptionFormProps } from "./types";

export default function PrescriptionForm({
  role,
  initialDiscountId,
  customerId,
  serverSubtotal,
  initial,
  initialDoctorUserId,
  onSubmit,
  submitting,
  submitText = "Lưu",
  customerName,
  employeeName,
  note,
}: PrescriptionFormProps) {
  const isDoctor = role === "doctor";

  const {
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
  } = usePrescriptionForm({
    initial,
    initialDoctorUserId,
    initialDiscountId,
  });

  const lineAmount = (r: any) => (r.quantity || 0) * (r.price || 0);
  const finalAmount = useMemo(() => buildFinalAmount(isDoctor), [buildFinalAmount, isDoctor]);

  const handleSubmit = async () => {
    try {
      await form.validateFields(["doctor_id"]);
      const doctorId = Number(form.getFieldValue("doctor_id"));
      if (!Number.isFinite(doctorId) || doctorId <= 0) {
        message.error("Vui lòng chọn bác sĩ kê đơn hợp lệ.");
        return;
      }
      if (!rows.length) return message.error("Vui lòng thêm ít nhất 1 sản phẩm.");
      if (rows.some((r) => !r.productId)) return message.error("Vui lòng chọn sản phẩm cho tất cả dòng.");

      const existingIds = new Set((initial ?? []).map((it) => Number(it.id)).filter(Number.isFinite));

      const items = rows
        .filter((r) => r.productId)
        .map((r) => {
          const item: any = {
            product: Number(r.productId),
            quantity: Math.max(0, Number(r.quantity ?? 1)),
            dose: r.dosage?.toString().trim() || undefined,
            note: r.note?.toString().trim() || undefined,
          };
          if (r.price !== undefined && r.price !== null) item.price = Number(r.price);
          if (r.id != null && existingIds.has(Number(r.id))) item.id = Number(r.id);
          return item;
        });

      await onSubmit({
        doctor_id: doctorId,
        items,
        medicine_discount: discountId,
      });
    } catch (err: any) {
      if (err?.errorFields) {
        message.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      } else {
        message.error(
          err?.data?.detail || err?.data?.error || err?.message || "Có lỗi khi lưu đơn thuốc."
        );
      }
    }
  };

  const doctorLabel =
    doctorOptions.find((o) => Number(o.value) === Number(form.getFieldValue("doctor_id")))?.label ||
    undefined;

  return (
    <div className="space-y-6">
      {/* Doctor select */}
      <Form form={form} layout="vertical">
        <Form.Item
          name="doctor_id"
          label="Bác sĩ kê đơn"
          rules={[{ required: true, message: "Chọn bác sĩ kê đơn" }]}
        >
          <Select
            placeholder="Chọn bác sĩ"
            options={doctorOptions}
            loading={empLoading}
            showSearch
            optionFilterProp="label"
            style={{ maxWidth: 420 }}
          />
        </Form.Item>
      </Form>

      {/* Table */}
      <PrescriptionTable
        isDoctor={isDoctor}
        rows={rows}
        productOptions={productOptions}
        productLoading={productLoading}
        discLoading={discLoading}
        discountOptions={discountOptions}
        discountId={discountId}
        setDiscountId={setDiscountId}
        subtotal={subtotal}
        lineAmount={lineAmount}
        onProductChange={onProductChange}
        setRow={setRow}
        addRow={addRow}
        removeRow={(rowId) => removeRow(rowId, initial)}
        finalAmount={finalAmount}
      />

      {/* Hidden print DOM */}
      <PrintPreview
        refEl={printRef}
        doctorLabel={doctorLabel}
        customerId={customerId}
        rows={rows}
        subtotal={subtotal}
        isDoctor={isDoctor}
        selectedDiscount={selectedDiscount}
        finalAmount={finalAmount}
        clinicLogoUrl="/THABI_LOGO-01.jpg"
        customerName={customerName || ""}
        employeeName={employeeName || ""}
        note={note || ""}
      />

      {/* Footer actions */}
      <div className="flex justify-end">
        <Button type="default" size="large" onClick={handlePrintImage} loading={printing}>
          In hóa đơn
        </Button>
        <Button type="primary" size="large" className="ml-3" loading={submitting} onClick={handleSubmit}>
          {submitText}
        </Button>
      </div>
    </div>
  );
}
