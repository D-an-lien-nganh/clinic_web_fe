"use client";

import React, { useState } from "react";
import { Tabs, TabsProps } from "antd";
import UserAccount from "./UserAccount";
import Configuration from "./Configuration";
import {
  useGetPositionListQuery,
  useGetDepartmentListQuery,
  useGetFloorListQuery,
  useGetTimeFrameListQuery,
  useGetDiscountListQuery,
  useGetUnitListQuery,
  useGetSourceListQuery,
  useCreateDiscountMutation,
  useEditDiscountMutation,
  useDeleteDiscountMutation,
  useCreateSourceMutation,
  useEditSourceMutation,
  useDeleteSourceMutation,
  useCreateFloorMutation,
  useEditFloorMutation,
  useDeleteFloorMutation,
  useCreateDepartmentMutation,
  useEditDepartmentMutation,
  useDeleteDepartmentMutation,
  useCreatePositionMutation,
  useEditPositionMutation,
  useDeletePositionMutation,
  useCreateTimeFrameMutation,
  useEditTimeFrameMutation,
  useDeleteTimeFrameMutation,
  useCreateUnitMutation,
  useEditUnitMutation,
  useDeleteUnitMutation,
  useGetTreatmentListQuery,
  useCreateTreatmentMutation,
  useEditTreatmentMutation,
  useDeleteTreatmentMutation,
  useGetTestServiceListQuery,
  useCreateTestServiceMutation,
  useEditTestServiceMutation,
  useDeleteTestServiceMutation,
} from "@/api/app_home/apiConfiguration";
import { useCreateTechnicalSettingMutation, useDeleteTechnicalSettingMutation, useEditTechnicalSettingMutation, useGetTechnicalSettingListQuery } from "@/api/app_product/apiService";

function SettingTabsView() {
  const [isTabs, setIsTabs] = useState<string>("account");

  const items: TabsProps["items"] = [
    {
      key: "account",
      label: "Tài khoản",
      children: <UserAccount />,
    },
    {
      key: "discount",
      label: "Mã giảm giá",
      children: (
        <Configuration
          isTabs={isTabs}
          display="table"
          useGetListQuery={useGetDiscountListQuery}
          useCreateMutation={useCreateDiscountMutation}
          useEditMutation={useEditDiscountMutation}
          useDeleteMutation={useDeleteDiscountMutation}
        />
      ),
    },
    {
      key: "source",
      label: "Nguồn khách hàng",
      children: (
        <Configuration
          isTabs={isTabs}
          display="list"
          useGetListQuery={useGetSourceListQuery}
          useCreateMutation={useCreateSourceMutation}
          useEditMutation={useEditSourceMutation}
          useDeleteMutation={useDeleteSourceMutation}
        />
      ),
    },
    {
      key: "department",
      label: "Phòng ban",
      children: (
        <Configuration
          isTabs={isTabs}
          display="table"
          useGetListQuery={useGetDepartmentListQuery}
          useCreateMutation={useCreateDepartmentMutation}
          useEditMutation={useEditDepartmentMutation}
          useDeleteMutation={useDeleteDepartmentMutation}
        />
      ),
    },
    {
      key: "floor",
      label: "Tầng điều trị",
      children: (
        <Configuration
          isTabs={isTabs}
          display="table"
          useGetListQuery={useGetFloorListQuery}
          useCreateMutation={useCreateFloorMutation}
          useEditMutation={useEditFloorMutation}
          useDeleteMutation={useDeleteFloorMutation}
        />
      ),
    },
    {
      key: "position",
      label: "Chức vụ",
      children: (
        <Configuration
          isTabs={isTabs}
          display="table"
          useGetListQuery={useGetPositionListQuery}
          useCreateMutation={useCreatePositionMutation}
          useEditMutation={useEditPositionMutation}
          useDeleteMutation={useDeletePositionMutation}
        />
      ),
    },
    {
      key: "unit",
      label: "Đơn vị tính",
      children: (
        <Configuration
          isTabs={isTabs}
          display="list"
          useGetListQuery={useGetUnitListQuery}
          useCreateMutation={useCreateUnitMutation}
          useEditMutation={useEditUnitMutation}
          useDeleteMutation={useDeleteUnitMutation}
        />
      ),
    },
    {
      key: "treatment-package",
      label: "Gói liệu trình",
      children: (
        <Configuration
          display="table"
          isTabs={isTabs}
          useGetListQuery={useGetTreatmentListQuery}
          useCreateMutation={useCreateTreatmentMutation}
          useEditMutation={useEditTreatmentMutation}
          useDeleteMutation={useDeleteTreatmentMutation}
        />
      ),
    },
    {
      key: "test-services",
      label: "Dịch vụ xét nghiệm",
      children: (
        <Configuration
          isTabs={isTabs}
          display="table"
          useGetListQuery={useGetTestServiceListQuery}
          useCreateMutation={useCreateTestServiceMutation}
          useEditMutation={useEditTestServiceMutation}
          useDeleteMutation={useDeleteTestServiceMutation}
        />
      ),
    },
    {
      key: "technical-settings",
      label: "Kỹ thuật",
      children: (
        <Configuration
          isTabs={isTabs}
          display="table"
          useGetListQuery={useGetTechnicalSettingListQuery}
          useCreateMutation={useCreateTechnicalSettingMutation}
          useEditMutation={useEditTechnicalSettingMutation}
          useDeleteMutation={useDeleteTechnicalSettingMutation}
        />
      ),
    },
  ];

  return (
    <div className="px-6">
      <div className="text-xl my-4 font-semibold">Cài đặt</div>
      <Tabs
        defaultActiveKey="account"
        items={items}
        onChange={(key) => setIsTabs(key)}
      />
    </div>
  );
}

export default SettingTabsView;
