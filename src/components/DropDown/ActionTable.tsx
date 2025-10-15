import { Dropdown, DropdownProps } from "antd";
import { MenuProps } from "antd/lib";
import React, { useState } from "react";
import { BsThreeDots } from "react-icons/bs";

function ActionTable({
  items,
}: {
  items: { key: string; label: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    setOpen(false);
  };
  const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen) => {

    setOpen(nextOpen);

  };
  return (
    <div>
      <div className="flex gap-2 max-sm:hidden">
        {items.map((item) => item.label)}
      </div>
      <Dropdown
        className="flex-1 sm:hidden"
        menu={{ items, onClick: handleMenuClick }}
        open={open}
        onOpenChange={handleOpenChange}
      >
        <BsThreeDots />
      </Dropdown>
    </div>
  );
}

export default ActionTable;
