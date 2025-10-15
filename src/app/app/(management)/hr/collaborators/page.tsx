import BreadcrumbFunction from "@/components/Breadcrumb/BreadcrumbFunction";
import CollaboratorsView from "@/views/business/hr/collaborators/CollaboratorsView";
import PotentialCustomersView from "@/views/business/hr/PotentialCustomers/PotentialCustomersView";
import { Tabs, TabsProps } from "antd";
import React from "react";

export default function page() {
  const items: TabsProps["items"] = [
      {
        key: "1",
        label: `Cộng tác viên`,
        children: <CollaboratorsView />,
      },
      {
        key: "2",
        label: `Khách hàng tiềm năng`,
        children: <PotentialCustomersView />,
      },
    ];

  return (
    <div>
      <BreadcrumbFunction
        functionName="Nhân sự"
        title="Quản lý cộng tác viên"
      />
      <div className="sm:px-6">
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </div>
  );
}
