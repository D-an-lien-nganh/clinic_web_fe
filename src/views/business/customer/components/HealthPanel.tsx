"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Form, message } from "antd";
import HealthInfoForm from "./HealthInfoForm";
import {
  useCreateDoctorHealthCheckMutation,
  useEditDoctorHealthCheckMutation,
  DoctorHealthPayload,
} from "@/api/app_treatment/apiTreatment";

type Props = {
  booking: any;
  health?: any;
  customerId: number;
  onReload?: () => void;
};

function mapHealthToForm(h?: any) {
  console.log("🔍 Mapping health to form:", h);
  
  return {
    health: {
      last_exam: h?.nearest_examination ?? "",
      height_cm: h?.height ?? undefined,
      weight_kg: h?.weight ?? undefined,
      blood_pressure: h?.blood_presure ?? "", // ⚠️ Lưu ý: API dùng blood_presure (sai chính tả)
      heart_rate: h?.heart_beat ?? "",
      breath_rate: h?.breathing_beat ?? undefined,
    },
  };
}

export default function HealthPanel({ booking, health, customerId, onReload }: Props) {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState<boolean>(!health?.id);

  const [createHealth, { isLoading: creating }] = useCreateDoctorHealthCheckMutation();
  const [editHealth, { isLoading: updating }] = useEditDoctorHealthCheckMutation();

  // Tính toán initialValues
  const initialValues = useMemo(() => {
    const mapped = mapHealthToForm(health);
    console.log("📋 Initial values:", mapped);
    return mapped;
  }, [health]);

  // 🔥 Sync form mỗi khi health thay đổi
  useEffect(() => {
    console.log("🔄 Syncing form with health:", health);
    
    const formData = mapHealthToForm(health);
    form.setFieldsValue(formData);
    
    // Log giá trị sau khi set
    console.log("✅ Form values after set:", form.getFieldsValue());
    
    // Chỉ tự động mở edit mode nếu chưa có data
    if (!health?.id) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [health, form]);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      console.log("💾 Saving values:", values);
      
      const p = values.health || {};

      const data: DoctorHealthPayload = {
        nearest_examination: p.last_exam || undefined,
        blood_presure: p.blood_pressure || undefined,
        heart_beat: p.heart_rate !== "" && p.heart_rate != null ? String(p.heart_rate) : undefined,
        height: Number.isFinite(Number(p.height_cm)) ? Number(p.height_cm) : undefined,
        weight: Number.isFinite(Number(p.weight_kg)) ? Number(p.weight_kg) : undefined,
        breathing_beat: p.breath_rate !== "" && p.breath_rate != null ? Number(p.breath_rate) : undefined,
        customer: customerId,
      };

      let saved: any;
      if (health?.id) {
        saved = await editHealth({ id: health.id, data }).unwrap();
        message.success("Đã cập nhật thông tin sức khỏe");
      } else {
        saved = await createHealth({ booking: booking.id, ...data }).unwrap();
        message.success("Đã lưu thông tin sức khỏe");
      }

      console.log("✅ Saved data:", saved);

      // Update form với dữ liệu mới từ server
      form.setFieldsValue(mapHealthToForm(saved));
      setIsEditing(false);

      // Reload để cập nhật healthMap ở component cha
      await onReload?.();
    } catch (e: any) {
      console.error("❌ Save error:", e);
      message.error(e?.data?.error || "Lưu thông tin sức khỏe thất bại");
    }
  };

  const onCancel = () => {
    // Reset về dữ liệu ban đầu
    form.setFieldsValue(mapHealthToForm(health));
    
    // Nếu chưa có data thì vẫn giữ edit mode
    setIsEditing(!health?.id);
  };

  return (
    <Form 
      form={form} 
      layout="vertical" 
      initialValues={initialValues}
      preserve={false}
    >
      <HealthInfoForm
        form={form}
        isEditing={isEditing}
        existed={!!health?.id}
        loading={creating || updating}
        onEdit={() => setIsEditing(true)}
        onSave={onSave}
        onCancel={onCancel}
      />
    </Form>
  );
}