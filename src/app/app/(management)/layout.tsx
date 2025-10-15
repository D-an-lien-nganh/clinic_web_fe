'use client';

import { useAvailableFunctionsQuery } from '@/api/app_home/apiAccount';
import NavBar from '@/components/Navbar/NavBar';
import UserDropdown from '@/components/Navbar/UserDropdown';
import { getAccessTokenFromCookie } from '@/utils/token';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

function Layout({ children }: { children: React.ReactNode }) {
  const [isDrawer, setIsDrawer] = useState(false);
  const { data: availableFunctionsData, isLoading } =
    useAvailableFunctionsQuery({});

  const token = getAccessTokenFromCookie();

  const pathname = usePathname().slice(9) + '/';

  const { title, isMatch } = useMemo(() => {
    if (availableFunctionsData) {
      const functionList = availableFunctionsData?.categories?.reduce(
        (acc: any, item: any) => acc.concat(item?.detail_function_list),
        []
      );

      if (pathname.startsWith('/admin/') && availableFunctionsData?.is_admin) {
        return { title: `Hệ thống`, isMatch: true };
      }

      for (let item of functionList) {
        if (pathname === item.link) {
          return { title: item.title, isMatch: true };
        }
      }
    }

    return { title: '', isMatch: false };
  }, [pathname, availableFunctionsData]);

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    jobPosition: '',
    logo: '/images/default_company_logo.png',
    companyName: '',
    fullAddress: '',
    avatar: null,
  });

  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    const userDataObj = userDataString ? JSON.parse(userDataString) : null;
    // Construct full address string from parts
    const addressParts = [
      userDataObj?.user_profile?.company?.address,
      userDataObj?.user_profile?.company?.district,
      userDataObj?.user_profile?.company?.city,
    ]
      .filter(Boolean)
      .join(', ');

    setUserInfo({
      firstName: userDataObj?.first_name,
      lastName: userDataObj?.last_name,
      jobPosition: userDataObj?.user_profile?.position?.title,
      logo: userDataObj?.user_profile?.company?.logo,
      companyName: userDataObj?.user_profile?.company?.name,
      fullAddress: addressParts,
      avatar: userDataObj?.user_profile?.image,
    });
  }, []);

  return (
    <div className='flex h-full relative min-h-screen'>
      <NavBar title={title} data={availableFunctionsData} />
      <div className='w-full h-full relative z-100'>
        <div className='absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b to-white from-yellow-400 z-0'></div>
        <div className='flex gap-4 items-center justify-end p-4 relative'>
          <UserDropdown
            firstName={userInfo.firstName}
            lastName={userInfo.lastName}
            jobPosition={userInfo.jobPosition}
            avatar={userInfo.avatar}
          />
        </div>
        <div className='relative'>{children}</div>
      </div>
    </div>
  );
}

export default React.memo(Layout);
