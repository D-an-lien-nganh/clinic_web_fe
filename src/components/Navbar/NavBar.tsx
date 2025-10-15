"use client";
import React, { useCallback, useEffect, useState } from "react";
import { ConfigProvider, Menu } from "antd";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setIsCollapse } from "@/lib/features/collapseSlice";
import { AppDispatch, RootState } from "@/lib/store";
import { CiSettings, CiMedicalCase } from "react-icons/ci";
import { FaRegUserCircle, FaProductHunt, FaUserCircle } from "react-icons/fa";

import { AiOutlineArrowsAlt } from "react-icons/ai";
import { BsArrowsAngleContract } from "react-icons/bs";
import { MdOutlineAccountBalance, MdOutlineInventory2 } from "react-icons/md";

const LS_SELECTED_KEY = "sidebar:selectedKey";
const LS_OPEN_KEY = "sidebar:openKey";
const LS_COLLAPSED = "sidebarCollapsed";

function NavBar({ title, data }: { title: string; data: any }) {
  const isCollapse = useSelector((s: RootState) => s.collapse.isCollapse);
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const ORDER = [
    "Quản lý khách hàng",
    "Quản lý trị liệu",
    "Quản lý nhân sự",
    "Quản lý sản phẩm",
    "Kế toán",
  ];

  const getOrderIndex = (title: string) => {
    const i = ORDER.indexOf(title);
    return i === -1 ? 999 : i;
  };

  const sortedCategories = React.useMemo(() => {
    const categories = Array.isArray(data?.categories)
      ? [...data.categories]
      : [];
    return categories.sort(
      (a: any, b: any) => getOrderIndex(a.title) - getOrderIndex(b.title)
    );
  }, [data]);

  const getIconForTitle = (title: string) => {
    switch (title) {
      case "Quản lý khách hàng":
        return <FaRegUserCircle size={18} />;
      case "Quản lý trị liệu":
        return <CiMedicalCase size={18} />;
      case "Quản lý sản phẩm":
        return <MdOutlineInventory2 size={18} />;
      case "Quản lý dịch vụ, sản phẩm":
        return <MdOutlineInventory2 size={18} />;
      case "Kế toán":
        return <MdOutlineAccountBalance size={18} />;
      case "Quản lý nhân sự":
        return <FaUserCircle size={18} />;
      default:
        return null;
    }
  };

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");

  // Tìm tiêu đề category từ link item
  const findParentTitleByLink = useCallback(
    (link: string) => {
      for (const c of data?.categories ?? []) {
        if (c.detail_function_list?.some((i: any) => i.link === link)) {
          return c.title as string;
        }
      }
      return undefined;
    },
    [data]
  );

  // Khởi tạo: từ URL nếu match, không thì lấy từ localStorage
  useEffect(() => {
    // collapse
    const storedCollapsed = localStorage.getItem(LS_COLLAPSED);
    if (storedCollapsed !== null) {
      dispatch(setIsCollapse(JSON.parse(storedCollapsed)));
    }

    const urlKey = pathname?.startsWith("/app/")
      ? pathname.replace("/app/", "").split("?")[0]
      : "";

    const urlHasItem =
      !!urlKey &&
      (data?.categories ?? []).some((c: any) =>
        c.detail_function_list?.some((i: any) => i.link === urlKey)
      );

    const savedSelected = localStorage.getItem(LS_SELECTED_KEY) || "";
    const selected = urlHasItem ? urlKey : savedSelected;

    if (selected) setSelectedKey(selected);

    const parentFromUrl = urlHasItem
      ? findParentTitleByLink(selected!)
      : undefined;
    const savedOpen = localStorage.getItem(LS_OPEN_KEY) || "";
    const open = parentFromUrl || savedOpen;

    if (open) setOpenKeys([open]);
  }, [pathname, data, dispatch, findParentTitleByLink]);

  // Lưu openKeys khi người dùng mở/đóng submenu
  const onOpenChange = (keys: string[]) => {
    const k = keys[keys.length - 1];
    setOpenKeys(k ? [k] : []);
    localStorage.setItem(LS_OPEN_KEY, k || "");
  };

  // Click vào item
  const handleItemClick = (link: string) => {
    setSelectedKey(link);
    localStorage.setItem(LS_SELECTED_KEY, link);
    const parent = findParentTitleByLink(link);
    if (parent) {
      setOpenKeys([parent]);
      localStorage.setItem(LS_OPEN_KEY, parent);
    }
    router.push(`/app/${link}`);
  };

  // Toggle collapse (giữ như bạn có)
  const toggleCollapsed = (e: any) => {
    e.stopPropagation();
    const newCollapseState = !isCollapse;
    dispatch(setIsCollapse(newCollapseState));
    localStorage.setItem(LS_COLLAPSED, JSON.stringify(newCollapseState));
  };

  return (
    <div
      className={`h-full relative ${
        isCollapse ? "w-[110px]" : "w-[350px]"
      } p-4 shadow-lg flex flex-col`}
    >
      <div className="flex items-center justify-center gap-2 mb-6">
        <Image
          src="/logo.png"
          alt="logo"
          width={270}
          height={160}
          className="rounded-2xl"
        />
      </div>

      <div
        className={`absolute top-[16px] right-4 ${
          isCollapse ? "w-[45px] h-[45px]" : "w-[60px] h-[60px]"
        } bg-transparent overflow-hidden cursor-pointer`}
        style={{ zIndex: 200 }}
      >
        <div
          className={`triangle-top-right ${
            isCollapse ? "w-[45px] h-[45px]" : "w-[60px] h-[60px]"
          }`}
          onClick={toggleCollapsed}
        >
          {isCollapse ? (
            <AiOutlineArrowsAlt className="absolute top-1.5 right-1.5 text-white font-bold" />
          ) : (
            <BsArrowsAngleContract className="absolute top-[10px] right-[10px] text-white font-bold" />
          )}
        </div>
      </div>

      <ConfigProvider
        theme={{ components: { Menu: { itemHoverBg: "#f0f0f0" } } }}
      >
        <Menu
          mode="inline"
          inlineCollapsed={isCollapse}
          className="flex-1 !border-none rounded-lg"
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          selectedKeys={selectedKey ? [selectedKey] : []}
        >
          {sortedCategories.map((main: any) => (
            <Menu.SubMenu
              key={main.title}
              title={<span className="font-semibold">{main.title}</span>}
              icon={
                <span className="font-semibold">
                  {getIconForTitle(main.title)}
                </span>
              }
              className="font-semibold border shadow-6 mx-1 !bg-white mb-1"
            >
              {main.detail_function_list?.map((sub: any) => (
                <Menu.Item
                  key={sub.link}
                  onClick={() => handleItemClick(sub.link)}
                  className="!rounded-r-none !rounded-l-full ml-4 font-medium"
                >
                  {sub.title}
                </Menu.Item>
              ))}
            </Menu.SubMenu>
          ))}

          {data?.is_admin && (
            <Menu.Item
              key="setting"
              onClick={() => handleItemClick("setting")}
              className="border !shadow-6 !mt-3 !h-12 font-medium"
              icon={<CiSettings size={18} />}
            >
              Cài đặt hệ thống
            </Menu.Item>
          )}
        </Menu>
      </ConfigProvider>
    </div>
  );
}

export default NavBar;
