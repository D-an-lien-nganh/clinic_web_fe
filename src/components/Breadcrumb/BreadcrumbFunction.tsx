import { Breadcrumb } from "antd";
import React from "react";

export default function BreadcrumbFunction({ functionName, title }: { functionName: string; title: string }) {
  return (
    <div className="flex justify-between px-7 my-2 items-center">
      <div className="text-xl font-semibold text-black">{title}</div>

      <Breadcrumb
        className="text-lg max-md:hidden"
        separator=">"
        items={[
          {
            title: functionName,
          },
          {
            title: title,
          },
        ]}
      />
    </div>
  );
}
