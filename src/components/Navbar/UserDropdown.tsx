import { Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import Link from 'next/link';
import React, { useState } from 'react';
import { FiLogOut, FiUser } from 'react-icons/fi';
import Logout from './Logout';

const UserDropdown = ({
  firstName,
  lastName,
  jobPosition,
  avatar,
}: {
  firstName: string;
  lastName: string;
  jobPosition: string;
  avatar: string | null;
}) => {
  const [isLogout, setIsLogout] = useState<boolean>(false);

  const items: MenuProps['items'] = [
    {
      key: '2',
      label: (
        <Link href='/app/profile'>
          <div className='flex gap-2 items-center  font-semibold'>
            <FiUser /> Hồ sơ của bạn
          </div>
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: (
        <div
          className='flex gap-2 items-center font-semibold'
          onClick={() => setIsLogout(true)}
        >
          <FiLogOut /> Đăng xuất
        </div>
      ),
    },
  ];
  return (
    <>
      <Dropdown menu={{ items }}>
        <div className='flex gap-2' onClick={(e) => e.preventDefault()}>
          <span className='hidden text-right lg:block'>
            <span className='block text-sm font-semibold'>
              {lastName} {firstName}
            </span>
            <span className='block text-xs'>{jobPosition}</span>
          </span>
          {avatar ? (
            <Avatar
              style={{ verticalAlign: 'middle' }}
              src={avatar}
              size='large'
            />
          ) : (
            <Avatar style={{ verticalAlign: 'middle' }} size='large'>
              {firstName[0]}
            </Avatar>
          )}
        </div>
      </Dropdown>
      <Logout setIsLogout={setIsLogout} isLogout={isLogout} />
    </>
  );
};

export default UserDropdown;
