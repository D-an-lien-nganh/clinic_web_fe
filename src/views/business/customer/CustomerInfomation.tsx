"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Button, Collapse, Space, message } from "antd";
import dayjs from "dayjs";
import {
  useCreateMarketingMutation,
  useEditMarketingMutation,
  useGetMarketingQuery,
} from "@/api/app_customer/apiMarketing";
import { province as provinceRaw } from "@/constants/province";
import { ward as wardRaw } from "@/constants/ward";
import {
  CustomerInfoForm,
  detectReferralType,
} from "./components/CustomerInfoForm";
import { CustomerCareForm } from "./components/CustomerCareForm";
import AppointmentModal from "./modal/AppointmentModal";
import { RiArrowLeftLine } from "react-icons/ri";
import { toBirthInput } from "@/utils/helper_date";

const { Panel } = Collapse;

export default function CreateCustomerPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();

  const actionType = (searchParams.get("actionType") || "create") as
    | "create"
    | "update";
  const customerId = searchParams.get("customerId");

  const [openAppointment, setOpenAppointment] = React.useState(false);

  // Nếu là update có thể fetch detail để fill form
  const { data: customerDetail, isFetching } = useGetMarketingQuery(
    customerId!,
    { skip: actionType !== "update" || !customerId }
  );

  const [initialSourceType, setInitialSourceType] = React.useState<
    "customer" | "hr" | "actor" | null
  >(null);
  const [initialReferrerCustomerId, setInitialReferrerCustomerId] =
    React.useState<number | undefined>(undefined);
  const [initialIntroducerUserId, setInitialIntroducerUserId] = React.useState<
    number | undefined
  >(undefined);

  const provinceMap = (provinceRaw?.[0] ?? {}) as Record<string, any>;
  const wardMap = (wardRaw?.[0] ?? {}) as Record<string, any>;

  const normalizeProvinceCode = (val?: string) => {
    if (!val) return undefined;
    if (provinceMap[val]) return val; // đã là code
    const found = Object.values(provinceMap).find(
      (p: any) => p.name === val || p.name_with_type === val
    );
    return found?.code;
  };

  const normalizeWardCode = (val?: string) => {
    if (!val) return undefined;
    if (wardMap[val]) return val; // đã là code
    const found = Object.values(wardMap).find(
      (w: any) => w.name === val || w.name_with_type === val
    );
    return found?.code;
  };

  React.useEffect(() => {
    if (actionType === "update" && customerDetail) {
      // 1. Tạo mapped values đầy đủ như CustomerInfoView
      const form_source_id =
        customerDetail?.form_source_id ?? customerDetail?.source ?? undefined;
      const form_referral_type =
        customerDetail?.form_referral_type ??
        detectReferralType(customerDetail?.source_name);
      const form_introducer_id =
        customerDetail?.form_introducer_id ?? undefined;

      // 2. Set toàn bộ form một lần duy nhất
      const mappedValues = {
        carreer: customerDetail.carreer ?? undefined,
        code: customerDetail.code,
        name: customerDetail.name,
        mobile: customerDetail.mobile,
        birth_input: toBirthInput(customerDetail),
        email: customerDetail.email,
        address: customerDetail.address,
        district: customerDetail.district,
        city: normalizeProvinceCode(
          customerDetail.city_code ?? customerDetail.city
        ),
        ward: normalizeWardCode(
          customerDetail.ward_code ?? customerDetail.ward
        ),
        gender: customerDetail.gender ?? "MA",
        source: form_source_id, // ✅ Sử dụng helper từ BE
        referral_type: form_referral_type || undefined, // ✅ Set ngay từ đầu
        introducer: form_introducer_id || undefined, // ✅ Set ngay từ đầu
      };

      form.setFieldsValue(mappedValues);

      // 3. Set state và override nếu cần
      const st =
        form_referral_type ?? detectReferralType(customerDetail?.source_name);
      setInitialSourceType(st);

      if (st === "customer") {
        const rid =
          customerDetail.current_referrer_customer_id ?? form_introducer_id;
        setInitialReferrerCustomerId(rid || undefined);
        // Không cần set lại form nữa vì đã set ở trên
      } else if (st === "hr") {
        const uid =
          customerDetail.current_introducer_user_id ?? form_introducer_id;
        setInitialIntroducerUserId(uid || undefined);
        // Không cần set lại form nữa
      }
    }
  }, [actionType, customerDetail, form]);

  const [createCustomer, { isLoading: isCreating }] =
    useCreateMarketingMutation();

  const [editCustomer, { isLoading: isUpdating }] = useEditMarketingMutation();

  const customerIdParam = searchParams.get("customerId");
  const numericCustomerId = React.useMemo(
    () =>
      customerIdParam
        ? Number(customerIdParam)
        : customerDetail?.id
        ? Number(customerDetail.id)
        : undefined,
    [customerIdParam, customerDetail]
  );

  const showCarePanel = actionType === "update" && !!numericCustomerId;

  const onFinish = async (values: any) => {
    try {
      if (values.birth) values.birth = dayjs(values.birth).format("YYYY-MM-DD");

      const payload: any = { ...values };

      delete payload.code;
      
      // ---- NEW: map referral 1–1
      const referralType = values.referral_type as
        | "customer"
        | "hr"
        | "actor"
        | undefined;
      const introducerId = values.introducer as number | undefined;

      // loại bỏ field UI phụ
      delete payload.introducer;

      if (referralType && introducerId) {
        if (referralType === "customer") {
          payload.referral_type = "customer";
          payload.referral_customer_id = Number(introducerId);
        } else if (referralType === "hr") {
          payload.referral_type = "hr";
          payload.referral_hr_id = Number(introducerId); // giá trị phải là HrUserProfile.id
        } else if (referralType === "actor") {
          payload.referral_type = "actor";
          payload.referral_actor = Number(introducerId); // LeadSourceActor.id
          payload.referral_source = Number(values.source); // không bắt buộc nếu đã có actor id, nhưng gửi kèm cũng OK
        }
      }
      // bỏ các field cũ nếu còn
      delete payload.customer;
      delete payload.collaborator;

      if (actionType === "create") {
        await createCustomer(payload).unwrap();
        message.success("Tạo khách hàng thành công!");
      } else {
        if (!numericCustomerId) {
          message.error("Thiếu ID khách hàng để cập nhật.");
          return;
        }
        await editCustomer({ id: numericCustomerId, ...payload }).unwrap();
        message.success("Cập nhật khách hàng thành công!");
      }
      router.push("/app/customer/not-bought");
    } catch (e: any) {
      const errMsg =
        e?.data?.detail ||
        e?.data?.message ||
        (actionType === "create"
          ? "Tạo khách hàng thất bại!"
          : "Cập nhật thất bại!");
      message.error(errMsg);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-[64px] flex items-center justify-between px-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white shadow hover:bg-gray-50 transition"
            title="Quay lại"
          >
            <RiArrowLeftLine className="text-gray-700 text-xl" />
          </button>
          <h1 className="text-lg font-semibold">
            {actionType === "create"
              ? "Thêm mới thông tin khách hàng"
              : `Cập nhật khách hàng mã ${customerDetail?.code ?? ""}`}
          </h1>
        </div>

        {/* CHỈ hiển thị khi actionType === 'update' */}
        {actionType === "update" && (
          <Button
            type="primary"
            className="bg-[#BD8306]"
            onClick={() => setOpenAppointment(true)}
          >
            Thêm lịch hẹn
          </Button>
        )}
      </div>

      {/* Body */}
      <div
        className="overflow-auto px-6 py-4"
        style={{ height: "calc(100vh - 72px - 64px)" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ gender: "MA" }}
        >
          <Collapse defaultActiveKey={["1", "3"]} ghost>
            <Panel header="Thông tin khách hàng" key="1">
              <CustomerInfoForm
                form={form}
                // NEW: truyền hint ban đầu từ backend
                initialSourceType={initialSourceType}
                initialReferrerCustomerId={initialReferrerCustomerId}
                initialIntroducerUserId={initialIntroducerUserId}
              />
            </Panel>
            {showCarePanel && (
              <Panel
                header={
                  <Space>
                    Thông tin chăm sóc khách hàng
                  </Space>
                }
                key="3"
              >
                <CustomerCareForm isUpdateMode customerId={numericCustomerId} />
              </Panel>
            )}
          </Collapse>

          <Form.Item className="mt-6 flex justify-end">
            <Button
              htmlType="submit"
              type="primary"
              className="bg-[#BD8306]"
              loading={isCreating || isFetching}
              disabled={actionType === "update" && !numericCustomerId}
            >
              {actionType === "create" ? "Lưu thông tin" : "Cập nhật"}
            </Button>
          </Form.Item>
        </Form>
      </div>

      {/* Modal Đặt lịch — chỉ render khi update */}
      {actionType === "update" && (
        <AppointmentModal
          open={openAppointment}
          onClose={() => setOpenAppointment(false)}
          onSuccess={() => {}}
          customerOptions={[]} // nếu cần options thì truyền vào như trước
          defaultCustomerId={numericCustomerId}
        />
      )}
    </div>
  );
}
