import BreadcrumbFunction from "@/components/Breadcrumb/BreadcrumbFunction";
import EmployeesList from "@/views/business/hr/employees/EmployeesList";
import React from "react";

function ScheduleWork() {
  return (
    <div>
      <BreadcrumbFunction functionName="Nhân sự" title="Quản lý nhân sự" />
      <EmployeesList />
    </div>
  );
}

export default ScheduleWork;
