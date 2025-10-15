"use client";
import { Collapse, Form, Skeleton, Alert } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useGetMarketingQuery } from "@/api/app_customer/apiMarketing";

import {
  CustomerInfoForm,
  detectReferralType,
} from "../components/CustomerInfoForm";
import { CustomerCareForm } from "../components/CustomerCareForm";
import MedicalHistoryForm from "../components/MedicalHistoryForm";
import HealthInfoByBookings from "../components/HealthInfoByBookings";
import ExaminationOrderPanelList from "./ExaminationOrderPanelList";
import { toBirthInput } from "@/utils/helper_date";

import { useExaminationPrint } from "./ExaminationOrder/useExaminationPrint";
import ExaminationPrintPreview from "./ExaminationOrder/ExaminationPrintPreview";

const { Panel } = Collapse;

type Props = {
  customerId?: string | number | null;
  role: "receptionist" | "doctor";
  registerAddHandler?: (fn: (() => void) | undefined) => void;
};

type Gender = "Nam" | "Nữ" | "Khác" | "";
type Referral = "Fanpage" | "Người giới thiệu" | "";

const toGender = (g: any): Gender => {
  if (!g) return "";
  const v = String(g).toUpperCase();
  if (v === "MA" || v === "NAM") return "Nam";
  if (v === "FE" || v === "NU" || v === "NỮ") return "Nữ";
  if (v === "OT" || v === "KHAC" || v === "KHÁC") return "Khác";
  return "";
};

const toReferral = (x: any): Referral =>
  x === "Fanpage" || x === "Người giới thiệu" ? x : "";

export default function CustomerInfoView({
  customerId,
  role,
  registerAddHandler,
}: Props) {
  const [form] = Form.useForm();
  const [printPayload, setPrintPayload] = useState<any | null>(null);

  // 🔥 State lưu thông tin sức khỏe mới nhất
  const [latestHealthData, setLatestHealthData] = useState<any>(null);

  const {
    printing,
    printRef,
    handlePrintExamination,
    printData,
    closePrintPreview,
  } = useExaminationPrint();

  const numericCustomerId = useMemo(
    () => (customerId != null ? Number(customerId) : undefined),
    [customerId]
  );

  const [problemForPrint, setProblemForPrint] = useState<string>("");

  const { data, isFetching, isError, error } = useGetMarketingQuery(
    numericCustomerId as any,
    { skip: !numericCustomerId }
  );

  const [initialSourceType, setInitialSourceType] = React.useState<
    "customer" | "hr" | "actor" | null
  >(null);
  const [initialReferrerCustomerId, setInitialReferrerCustomerId] = useState<
    number | undefined
  >(undefined);
  const [initialIntroducerUserId, setInitialIntroducerUserId] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    form.resetFields();
    setInitialSourceType(null);
    setInitialReferrerCustomerId(undefined);
    setInitialIntroducerUserId(undefined);
    setLatestHealthData(null); // 🔥 Reset health data khi đổi customer
  }, [numericCustomerId, form]);

  const mappedValues = useMemo(() => {
    if (!data) return undefined;

    const form_source_id = data?.form_source_id ?? data?.source ?? undefined;
    const form_referral_type =
      data?.form_referral_type ?? detectReferralType(data?.source_name);
    const form_introducer_id = data?.form_introducer_id ?? undefined;

    const base: any = {
      carreer: data?.carreer ?? "",
      code: data?.code ?? "",
      name: data?.name ?? "",
      gender: data?.gender ?? undefined,
      birth_input: toBirthInput(data),
      mobile: data?.mobile ?? "",
      email: data?.email ?? "",
      city: data?.city ?? undefined,
      district: data?.district ?? undefined,
      ward: data?.ward ?? undefined,
      address: data?.address ?? "",
      source: form_source_id,
      referral_type: form_referral_type || undefined,
      introducer: form_introducer_id || undefined,
    };

    const medical_history =
      (data?.customer_problems || []).map((p: any) => ({
        issue: p?.problem ?? "",
        pain: p?.encounter_pain ?? "",
        desire: p?.desire ?? "",
      })) ?? [];

    return { ...base, medical_history };
  }, [data]);

  useEffect(() => {
    if (!mappedValues || !data) return;

    form.setFieldsValue(mappedValues);

    const st =
      (data?.form_referral_type as "customer" | "hr" | "actor" | null) ??
      detectReferralType(data?.source_name ?? data?.lead_source_name);
    setInitialSourceType(st);

    if (st === "customer") {
      const rid = data.current_referrer_customer_id ?? mappedValues.introducer;
      form.setFieldsValue({
        referral_type: "customer",
        introducer: rid ? Number(rid) : undefined,
      });
      setInitialReferrerCustomerId(rid || undefined);
    } else if (st === "hr") {
      const uid = data.current_introducer_user_id ?? mappedValues.introducer;
      form.setFieldsValue({
        referral_type: "hr",
        introducer: uid ? Number(uid) : undefined,
      });
      setInitialIntroducerUserId(uid || undefined);
    } else if (st === "actor") {
      const aid = data.form_introducer_id ?? mappedValues.introducer;
      form.setFieldsValue({
        referral_type: "actor",
        introducer: aid ? Number(aid) : undefined,
      });
    }
  }, [mappedValues, data, form]);

  // 🔥 Format vitals từ health data cho việc in
  const formatVitalsForPrint = (health: any) => {
    if (!health) return undefined;

    return {
      bloodPressure: health.blood_presure || "", // ✅ Đúng field từ API
      heartRate: health.heart_beat ? `${health.heart_beat} bpm` : "", // ✅ Thêm đơn vị
      respiration: health.breathing_beat ? `${health.breathing_beat} bpm` : "", // ✅ Đổi tên field
      weight: health.weight ? `${health.weight} kg` : "", // ✅ Đúng format
      height: health.height ? `${health.height} cm` : "", // ✅ Đúng format
      generalStatus: health.general_status || health.note || "", // ✅ Thêm general status nếu có
    };
  };

  const showCarePanel = !!numericCustomerId;

  return (
    <Form form={form} layout="vertical">
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Không tải được dữ liệu khách hàng"
          description={
            (error as any)?.data?.detail || (error as any)?.status || ""
          }
          style={{ marginBottom: 12 }}
        />
      )}

      <Collapse
        bordered={false}
        expandIconPosition="start"
        ghost
        defaultActiveKey={["customer", "other", "health", "history", "care"]}
      >
        <Panel header="Thông tin khách hàng" key="customer">
          {isFetching ? (
            <Skeleton active />
          ) : (
            <CustomerInfoForm
              form={form}
              initialSourceType={initialSourceType}
              initialReferrerCustomerId={initialReferrerCustomerId}
              initialIntroducerUserId={initialIntroducerUserId}
            />
          )}
        </Panel>

        <ExaminationOrderPanelList
          customerId={String(customerId)}
          role={role}
          registerAddHandler={registerAddHandler}
          onRequestPrint={(data) => {
            const customerData = form.getFieldsValue();
            setPrintPayload(data);

            console.log("📋 In đơn khám - Exam data:", data);
            console.log("🏥 In đơn khám - Health data:", latestHealthData);

            handlePrintExamination({
              // Patient info
              customerName: customerData?.name ?? "",
              dob: customerData?.birth_input ?? "",
              address: customerData?.address ?? "",
              gender: toGender(customerData?.gender ?? ""),
              phone: customerData?.mobile ?? "",
              referralSource: toReferral(customerData?.referralSource),
              job: customerData?.carreer ?? "Không có thông tin",

              // Doctor
              doctorFullName: data.doctor_name ?? "",

              // Examination
              medicalHistory: data.medicalHistory ?? "",
              vitals: formatVitalsForPrint(latestHealthData),
              currentSymptoms: data.currentSymptoms ?? "",
              recentTests: data.tests
                ? Object.values(data.tests).join(", ")
                : "",
              diagnosis: data.diagnosis ?? "",
              treatmentMedicine: data.treatmentMedicine ?? "",
              treatmentTherapy: data.treatmentTherapy ?? "",
              treatmentDate: data.treatmentDate ?? "",
              problemForPrint: problemForPrint,
            });
          }}
        />

        {showCarePanel && role === "receptionist" && (
          <Panel header="Chăm sóc khách hàng" key="care">
            <Skeleton active loading={isFetching}>
              <CustomerCareForm
                isUpdateMode={true}
                customerId={numericCustomerId}
              />
            </Skeleton>
          </Panel>
        )}

        {numericCustomerId && (
          <Panel header="Thông tin sức khỏe" key="health">
            <Skeleton active loading={isFetching}>
              <HealthInfoByBookings
                customerId={numericCustomerId}
                onHealthDataChange={(health) => {
                  console.log("🔄 Health data updated:", health);
                  setLatestHealthData(health);
                }}
              />
            </Skeleton>
          </Panel>
        )}

        {numericCustomerId && (
          <Panel header="Tiền sử bệnh" key="history">
            <Skeleton active loading={isFetching}>
              <MedicalHistoryForm
                customerId={numericCustomerId}
                onProblemChange={(problemConcat) => {
                  setProblemForPrint(problemConcat);
                }}
              />
            </Skeleton>
          </Panel>
        )}
      </Collapse>

      {printPayload && (
        <div style={{ marginTop: 12 }}>
          <strong>Xem trước in (debug) — data từ MedicalOrderForm</strong>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(printPayload, null, 2)}
          </pre>
        </div>
      )}

      {printData && <ExaminationPrintPreview refEl={printRef} {...printData} />}
    </Form>
  );
}
