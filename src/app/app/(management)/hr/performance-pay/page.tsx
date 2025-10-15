"use client";

import React from "react";
import { Tabs, TabsProps } from "antd";
import BreadcrumbFunction from "@/components/Breadcrumb/BreadcrumbFunction";
import PerformanceTechnicianView from "@/views/business/hr/PerformancePay/Technician/PerformanceTechnicianView";
import PerformanceCollaboratorView from "@/views/business/hr/PerformancePay/Collaborator/PerformanceCollaboratorView";
import ActorLeadSourcePerformanceView from "@/views/business/hr/PerformancePay/Collaborator/ActorLeadSourcePerformanceView";

export default function page() {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: `Kỹ thuật viên`,
      children: <PerformanceTechnicianView />,
    },
    {
      key: "2",
      label: `Cộng tác viên`,
      children: <PerformanceCollaboratorView />,
    },
    {
      key: "3",
      label: `Nguồn khách khác`,
      children: <ActorLeadSourcePerformanceView />,
    },
  ];

  return (
    <div>
      <BreadcrumbFunction
        functionName="Nhân sự"
        title="Lương hiệu suất"
      />
      <div className="sm:px-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </div>
  );
}
