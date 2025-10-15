"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, Radio, Select, Spin, Button, Tooltip } from "antd";
import type { FormInstance } from "antd";
import { useGetSourceListQuery } from "@/api/app_home/apiConfiguration";
import {
  apiMarketing,
  useGetCustomerListQuery,
} from "@/api/app_customer/apiMarketing";
import { useGetEmployeeListQuery } from "@/api/app_hr/apiHR";
import { RiAddLine } from "react-icons/ri";

// dữ liệu địa bàn
import { province as provinceRaw } from "@/constants/province";
import { ward as wardRaw } from "@/constants/ward";
import SmartDateInput from "../custom_component/SmartDateInput";
import { ProvinceItem, WardItem, validateBirthInput } from "./type";
import QuickAddSourceModal from "../modal/QuickAddSourceModal";
import QuickAddIntroducerModal from "../modal/QuickAddIntroducerModal";

interface CustomerInfoFormProps {
  form: FormInstance;
  initialSourceType?: "customer" | "hr" | "actor" | null;
  initialReferrerCustomerId?: number;
  initialIntroducerUserId?: number;
  hideCodeField?: boolean; // NEW: prop to hide code field
}

// xác định loại referral từ tên nguồn
export const detectReferralType = (
  sourceName?: string
): "customer" | "hr" | "actor" | null => {
  if (!sourceName) return null;
  const s = sourceName.toLowerCase();
  if (/khách\s*hàng|customer/.test(s)) return "customer";
  if (/ctv|cộng\s*tác\s*viên|collaborator/.test(s)) return "hr";
  return "actor";
};

// ---- chuẩn hoá cấu trúc địa bàn
const useNormalizedLocation = () => {
  const provinceMap = (provinceRaw?.[0] ?? {}) as Record<string, ProvinceItem>;
  const wardMap = (wardRaw?.[0] ?? {}) as Record<string, WardItem>;

  const provincesArr: ProvinceItem[] = useMemo(
    () => Object.values(provinceMap || {}),
    [provinceMap]
  );
  const wardsArr: WardItem[] = useMemo(
    () => Object.values(wardMap || {}),
    [wardMap]
  );

  const wardsByProvince: Record<string, WardItem[]> = useMemo(() => {
    const idx: Record<string, WardItem[]> = {};
    for (const w of wardsArr) {
      if (!idx[w.parent_code]) idx[w.parent_code] = [];
      idx[w.parent_code].push(w);
    }
    return idx;
  }, [wardsArr]);

  return { provincesArr, wardsByProvince };
};

export const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({
  form,
  initialSourceType = null,
  initialReferrerCustomerId,
  initialIntroducerUserId,
  hideCodeField = false, // NEW: default false for backward compatibility
}) => {
  const [wardList, setWardList] = useState<WardItem[]>([]);

  const [openAddSource, setOpenAddSource] = useState(false);
  const [openAddIntroducer, setOpenAddIntroducer] = useState(false);

  const watchedSourceId = Form.useWatch("source", form);
  const watchedCity = Form.useWatch("city", form);

  const { provincesArr, wardsByProvince } = useNormalizedLocation();

  // Nguồn khách hàng
  const {
    data: sourceData,
    isLoading: loadingSource,
    refetch,
  } = useGetSourceListQuery(undefined);

  // referral_type phụ thuộc tên nguồn đã chọn
  const referralType = useMemo<"customer" | "hr" | "actor" | null>(() => {
    const src = sourceData?.results?.find((s: any) => s.id === watchedSourceId);
    return detectReferralType(src?.name);
  }, [watchedSourceId, sourceData]);

  const watchedReferralType = Form.useWatch("referral_type", form);

  const inferredReferralType = useMemo<
    "customer" | "hr" | "actor" | null
  >(() => {
    const src = sourceData?.results?.find((s: any) => s.id === watchedSourceId);
    return detectReferralType(src?.name);
  }, [watchedSourceId, sourceData]);

  const effectiveReferralType = watchedReferralType ?? inferredReferralType;

  useEffect(() => {
    if (!watchedReferralType) {
      form.setFieldsValue({ referral_type: inferredReferralType || undefined });
    }
  }, [inferredReferralType, watchedReferralType, form]);

  useEffect(() => {
    if (!sourceData?.results || watchedSourceId) return; // đã có source thì thôi

    // 1) Ưu tiên match theo tên nguồn nếu BE có cung cấp
    const beSourceName =
      (form.getFieldValue("source_name") as string) ||
      (form.getFieldValue("lead_source_name") as string);

    if (beSourceName) {
      const byName = sourceData.results.find(
        (s: any) =>
          (s.name || "").trim().toLowerCase() ===
          beSourceName.trim().toLowerCase()
      );
      if (byName?.id) {
        form.setFieldsValue({ source: byName.id });
        return;
      }
    }

    // 2) Fallback: chọn nguồn đầu tiên có type suy luận khớp effectiveReferralType
    if (effectiveReferralType) {
      const byType = sourceData.results.find(
        (s: any) => detectReferralType(s?.name) === effectiveReferralType
      );
      if (byType?.id) {
        form.setFieldsValue({ source: byType.id });
      }
    }
  }, [sourceData, watchedSourceId, effectiveReferralType, form]);

  // --- dữ liệu cho từng loại người giới thiệu ---
  const { data: customerResp, isLoading: loadingCustomer } =
    useGetCustomerListQuery(undefined, {
      skip: effectiveReferralType !== "customer",
    });

  const customerOptions = useMemo(() => {
    const arr = (customerResp?.results ?? customerResp ?? []) as any[];
    return arr.map((c) => {
      const name =
        c?.full_name?.full_name ||
        c?.full_name ||
        c?.name ||
        c?.customer_name ||
        `KH #${c?.id}`;
      const code =
        c?.customer_code ||
        c?.customerCode ||
        c?.code ||
        c?.customer_id ||
        c?.id;
      return { value: c?.id, label: `${name} (${code})` };
    });
  }, [customerResp]);

  const { data: collaboratorResp, isLoading: loadingCollaborator } =
    useGetEmployeeListQuery(
      {
        page: 1,
        pageSize: 50,
        searchTerm: "",
        startDate: "",
        endDate: "",
        format: "",
        department: "",
        type: "collaborator",
      },
      { skip: effectiveReferralType !== "hr" } as any
    );

  const collaboratorOptions = useMemo(() => {
    const arr = (collaboratorResp?.results ?? collaboratorResp ?? []) as any[];
    return arr.map((e) => {
      const name =
        e?.full_name?.full_name ||
        e?.full_name ||
        e?.employee_name ||
        e?.name ||
        `CTV #${e?.id}`;
      const code = e?.code || e?.user || e?.id;
      const hrProfileId = e?.hr_profile_id ?? e?.id ?? e?.user;
      return { value: hrProfileId, label: `${name} (${code})` };
    });
  }, [collaboratorResp]);

  const { useGetLeadSourceActorsQuery } = apiMarketing;
  const { data: actors = [], isLoading: loadingActors } =
    useGetLeadSourceActorsQuery(
      { source: watchedSourceId, page: 1, pageSize: 50 },
      { skip: effectiveReferralType !== "actor" || !watchedSourceId }
    );

  const actorOptions = useMemo(
    () =>
      actors.map((a: any) => ({
        value: a.id,
        label: `${a.name}${
          a.code ? ` (${a.code})` : a.external_id ? ` (${a.external_id})` : ""
        }`,
      })),
    [actors]
  );

  // Prefill khi UPDATE (optional)
  useEffect(() => {
    if (
      initialSourceType === "customer" &&
      initialReferrerCustomerId &&
      customerOptions.length > 0
    ) {
      const current = form.getFieldValue("introducer");
      if (!current)
        form.setFieldsValue({
          introducer: Number(initialReferrerCustomerId),
          referral_type: "customer",
        });
    }
    if (
      initialSourceType === "hr" &&
      initialIntroducerUserId &&
      collaboratorOptions.length > 0
    ) {
      const current = form.getFieldValue("introducer");
      if (!current)
        form.setFieldsValue({
          introducer: Number(initialIntroducerUserId),
          referral_type: "hr",
        });
    }
  }, [
    initialSourceType,
    initialReferrerCustomerId,
    initialIntroducerUserId,
    customerOptions,
    collaboratorOptions,
    form,
  ]);

  // ----- địa bàn -----
  useEffect(() => {
    if (!watchedCity) {
      setWardList([]);
      return;
    }
    const wards = wardsByProvince[watchedCity] ?? [];
    setWardList(wards);

    const currentWard = form.getFieldValue("ward");
    if (currentWard && !wards.some((w) => w.code === currentWard)) {
      form.setFieldsValue({ ward: undefined });
    }
  }, [watchedCity, wardsByProvince, form]);

  const provinceOptions = useMemo(
    () =>
      provincesArr
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "vi"))
        .map((p) => ({ value: p.code, label: p.name_with_type })),
    [provincesArr]
  );
  const wardOptions = useMemo(
    () =>
      wardList
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "vi"))
        .map((w) => ({ value: w.code, label: w.name_with_type })),
    [wardList]
  );

  const introducerOptions =
    effectiveReferralType === "customer"
      ? customerOptions
      : effectiveReferralType === "hr"
      ? collaboratorOptions
      : actorOptions;

  const loadingIntroducer =
    (effectiveReferralType === "customer" && loadingCustomer) ||
    (effectiveReferralType === "hr" && loadingCollaborator) ||
    (effectiveReferralType === "actor" && loadingActors);

  const isEmptyIntroducer =
    !!watchedSourceId && !loadingIntroducer && introducerOptions.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* === CỘT TRÁI === */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4">
          <Form.Item
            label="Họ tên khách hàng"
            name="name"
            className="col-span-6"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>
          <Form.Item label="Giới tính" name="gender" className="col-span-6">
            <Radio.Group className="flex gap-4">
              <Radio value="MA">Nam</Radio>
              <Radio value="FE">Nữ</Radio>
              <Radio value="OT">Khác</Radio>
            </Radio.Group>
          </Form.Item>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Form.Item
            label="Số điện thoại"
            name="mobile"
            className="col-span-4"
            rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
          >
            <Input maxLength={10} placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Ngày sinh"
            name="birth_input"
            className="col-span-4"
            rules={[{ validator: validateBirthInput }]}
          >
            <SmartDateInput />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            className="col-span-4"
            rules={[{ type: "email", message: "Email không hợp lệ" }]}
          >
            <Input placeholder="Nhập địa chỉ Email" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <Form.Item label="Nghề nghiệp" name="carreer" className="col-span-6">
            <Input placeholder="Nhập nghề nghiệp" />
          </Form.Item>
        </div>
      </div>

      {/* === CỘT PHẢI === */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4">
          <Form.Item
            label="Tỉnh / Thành phố"
            name="city"
            className="col-span-6"
          >
            <Select
              placeholder="Chọn Tỉnh/Thành phố"
              allowClear
              showSearch
              optionFilterProp="label"
              options={provinceOptions}
              filterOption={(input, opt) =>
                (opt?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item label="Xã / Phường" name="ward" className="col-span-6">
            <Select
              placeholder="Chọn Xã/Phường"
              allowClear
              showSearch
              optionFilterProp="label"
              options={wardOptions}
              filterOption={(input, opt) =>
                (opt?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </div>

        <div className="md:col-span-12">
          <Form.Item
            label="Địa chỉ chi tiết"
            name="address"
            rules={[{ required: true, message: "Nhập địa chỉ chi tiết" }]}
          >
            <Input placeholder="Số nhà, tên đường..." />
          </Form.Item>
        </div>

        {/* Nguồn KH + Người giới thiệu */}
        <div className="grid grid-cols-12 gap-4">
          <Form.Item
            className="col-span-6"
            name="source"
            label={
              <span className="inline-flex items-center gap-2">
                Nguồn khách hàng
                <Tooltip title="Thêm nhanh nguồn">
                  <Button
                    type="text"
                    size="small"
                    icon={<RiAddLine />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenAddSource(true);
                    }}
                    aria-label="Thêm nguồn khách hàng"
                  />
                </Tooltip>
              </span>
            }
            rules={[
              { required: true, message: "Vui lòng chọn nguồn khách hàng" },
            ]}
          >
            <Select
              placeholder="Chọn nguồn"
              loading={loadingSource}
              allowClear
              onChange={(val) => {
                const src = sourceData?.results?.find((s: any) => s.id === val);
                const t = detectReferralType(src?.name);
                form.setFieldsValue({
                  referral_type: t || undefined,
                  introducer: undefined,
                });
              }}
            >
              {sourceData?.results?.map((src: any) => (
                <Select.Option key={src.id} value={src.id}>
                  {src.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            className="col-span-6"
            name="introducer"
            label={
              <span className="inline-flex items-center gap-2">
                Người giới thiệu
                <Tooltip title="Thêm nhanh người giới thiệu">
                  <Button
                    type="text"
                    size="small"
                    icon={<RiAddLine />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenAddIntroducer(true);
                    }}
                    aria-label="Thêm người giới thiệu"
                  />
                </Tooltip>
              </span>
            }
            rules={[
              {
                validator: async (_, v) => {
                  if (!watchedSourceId)
                    throw new Error("Vui lòng chọn nguồn khách hàng trước.");
                  if (isEmptyIntroducer)
                    throw new Error(
                      "Nguồn đã chọn chưa có dữ liệu giới thiệu."
                    );
                  if (!v) throw new Error("Vui lòng chọn người giới thiệu.");
                },
              },
            ]}
          >
            <Select
              placeholder={
                !watchedSourceId
                  ? "Chọn nguồn trước"
                  : loadingIntroducer
                  ? "Đang tải danh sách..."
                  : isEmptyIntroducer
                  ? "Chưa có dữ liệu"
                  : effectiveReferralType === "customer"
                  ? "Chọn khách hàng"
                  : effectiveReferralType === "hr"
                  ? "Chọn CTV/nhân sự"
                  : "Chọn người trong nguồn"
              }
              showSearch
              optionFilterProp="label"
              disabled={
                !watchedSourceId || loadingIntroducer || isEmptyIntroducer
              }
              loading={loadingIntroducer}
              notFoundContent={
                loadingIntroducer ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Spin size="small" />
                    <span>Đang tải danh sách...</span>
                  </div>
                ) : null
              }
              options={introducerOptions}
              filterOption={(input, opt) =>
                (opt?.label as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </div>

        {/* hidden cho parent đọc khi submit */}
        <Form.Item name="referral_type" hidden>
          <Input />
        </Form.Item>

        <QuickAddSourceModal
          open={openAddSource}
          onClose={() => setOpenAddSource(false)}
          onCreated={async (created) => {
            await refetch();
            if (created?.id) {
              form.setFieldsValue({ source: created.id });
            }
          }}
        />
        <QuickAddIntroducerModal
          open={openAddIntroducer}
          onClose={() => setOpenAddIntroducer(false)}
          initialSourceId={watchedSourceId} // prefill nguồn đang chọn
          lockSource={!!watchedSourceId} // khoá nếu bạn muốn user không đổi nguồn
          onCreated={async (created) => {
            if (created?.id) {
              form.setFieldsValue({ introducer: created.id });
            }
          }}
        />
      </div>
    </div>
  );
};

export default CustomerInfoForm;
