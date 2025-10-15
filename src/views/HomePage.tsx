"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import { useAvailableFunctionsQuery } from "@/api/app_home/apiAccount";

function HomePage() {
  const { data: availableFunctionsData, isLoading } =
    useAvailableFunctionsQuery({});

  const sortedCategories = useMemo(() => {
    const ORDER = [
      "Quản lý khách hàng",
      "Quản lý trị liệu",
      "Quản lý nhân sự",
      "Quản lý sản phẩm",
      "Kế toán",
    ];

    const getOrderIndex = (title: string) => {
      const idx = ORDER.indexOf(title);
      return idx === -1 ? 999 : idx;
    };

    const cats = Array.isArray(availableFunctionsData?.categories)
      ? [...availableFunctionsData.categories]
      : [];

    return cats.sort(
      (a: any, b: any) => getOrderIndex(a.title) - getOrderIndex(b.title)
    );
  }, [availableFunctionsData]);

  if (isLoading) return <p className="text-center mt-20">Đang tải...</p>;

  return (
    <div
      className="min-h-screen 
                bg-gradient-to-tr from-yellow-50 via-yellow-100 to-yellow-50 
                py-16"
    >
      <div
        className="container mx-auto 
                  flex flex-wrap md:flex-nowrap
                  gap-8 
                  overflow-x-visible md:overflow-x-auto
                  justify-center"
      >
        {sortedCategories.map((list: any) => (
          <div
            key={list.id}
            className="w-72 h-[450px] 
                       bg-white/90 border-2 border-yellow-400 
                       rounded-xl p-6 flex flex-col"
          >
            <h2 className="text-yellow-700 font-semibold text-xl mb-6 text-center">
              {list.title}
            </h2>

            <div className="flex-1 space-y-3">
              {list.detail_function_list.map((item: any) => (
                <Link
                  key={item.id}
                  href={`/app/${item.link}`}
                  className="flex items-center gap-2 
                             text-yellow-800 hover:text-yellow-600 
                             transition-colors"
                >
                  <FaCheck className="flex-shrink-0" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;
