'use client';
import {
  useDeleteMarketingMutation,
  useGetMarketingListQuery,
} from '@/api/app_customer/apiMarketing';
import { Button, Form, Input, notification, Popconfirm, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useState, useRef } from 'react';
import { BsFiletypePdf, BsFiletypeXls } from 'react-icons/bs';
import { CiFilter } from 'react-icons/ci';
import { FaTrash } from 'react-icons/fa';
import AddAndUpdateMarketing from './components/AddAndUpdateMarketing';

interface DataType {
  key: React.Key;
  id: number;
  code: string;
  name: string;
  gender: string;
  source_name: string;
  mobile: string;
  email: string;
  user: string;
  note: string;
  marketer_detail: { first_name: string; last_name: string } | null;
  created_at: Date;
}

export default function Marketing() {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    data: marketingList,
    isLoading,
    refetch,
    error,
  } = useGetMarketingListQuery({
    page: pagination.current,
    pageSize: pagination.pageSize,
    searchTerm,
  });
  const [deleteMarketing] = useDeleteMarketingMutation();

  const onSearchChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setTempSearchTerm(e.target.value);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(tempSearchTerm);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }, 500);
  
    return () => clearTimeout(timeoutId);
  }, [tempSearchTerm]); 
  

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const onDelete = async (id: any) => {
    try {
      await deleteMarketing({ id }).unwrap();
      refetch();
      notification.success({
        message: 'Xóa khách hàng thành công',
        placement: 'bottomRight',
        className: 'h-16',
      });
    } catch (error) {
      notification.error({
        message: 'Xóa khách hàng thất bại',
        placement: 'bottomRight',
        className: 'h-16',
      });
    }
  };

  const handleRowClick = (record: DataType) => {
    setSelectedRowId(record.id);
    setIsDetailModalOpen(true);
  };

  const columns: ColumnsType<DataType> = [
    {
      title: '#',
      key: 'index',
      width: 45,
      align: 'center',
      render: (text, record, index) =>
        (pagination.current - 1) * 10 + index + 1,
    },
    {
      key: 'code',
      title: 'Mã KH',
      dataIndex: 'code',
      align: 'center',
    },
    {
      key: 'name',
      title: 'Họ và tên',
      dataIndex: 'name',
      align: 'center',
    },
    {
      key: 'mobile',
      title: 'SĐT',
      dataIndex: 'mobile',
      align: 'center',
    },
    {
      key: 'email',
      title: 'Người giới thiệu',
      dataIndex: 'email',
      align: 'center',
    },
    {
      key: 'source_name',
      title: 'Nguồn',
      dataIndex: 'source_name',
      align: 'center',
    },
    {
      title: 'Ngày tạo',
      key: 'created_at',
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (_, { created_at }) => (
        <div>{dayjs(created_at).format('DD/MM/YYYY')}</div>
      ),
      align: 'center',
    },
    {
      title: '',
      key: 'actions',
      dataIndex: '',
      align: 'center',
      render: (_, { id }) => (
        <div className='flex justify-center items-center space-x-4' onClick={(e) => e.stopPropagation()}>
          <AddAndUpdateMarketing refetch={refetch} edit={true} title='Sửa' marketingId={id} />
          <Popconfirm
            title='Bạn có chắc muốn xóa không?'
            onConfirm={() => onDelete(id)}
            okText='Xác nhận'
            cancelText='Hủy'
          >
            <Button
              style={{
                color: 'white',
                border: 'none',
                backgroundColor: 'none',
              }}
              size='large'
              icon={<FaTrash color='#F07525' />}
            ></Button>
            <div className='sm:hidden text-center'>Xóa</div>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const dataSource =
    marketingList?.results?.map((record: { id: any }) => ({
      ...record,
      key: record.id,
    })) || [];

  return (
    <div className='min-h-[calc(100vh-70px)] p-6'>
      <div className='mb-4 flex justify-between items-center'>
        <Form layout='inline' className='max-md:gap-2 w-2/3'>
          <Form.Item className='max-md:w-full w-1/3'>
            <Input placeholder='Tên, SĐT, Email' onChange={onSearchChange} />
          </Form.Item>
          <Button
            type='default'
            shape='circle'
            size='middle'
            className='flex items-center justify-center border-blue-500 text-blue-500 rounded-full p-4'
          >
            <CiFilter />
          </Button>
        </Form>
        <div className='flex gap-7'>
          <div className='flex gap-2'>
            <Button
              type='dashed'
              className='flex items-center justify-center border-blue-500 text-blue-500'
              icon={<BsFiletypePdf className='text-blue-500' />}
            >
              Xuất PDF
            </Button>
            <Button
              type='dashed'
              className='flex items-center justify-center border-blue-500 text-blue-500'
              icon={<BsFiletypeXls className='text-blue-500' />}
            >
              Xuất Excel
            </Button>
          </div>

          <AddAndUpdateMarketing
            refetch={refetch}
            edit={false}
            title='Thêm mới khách hàng'
            className='w-1/3'
          />
        </div>
      </div>

      {selectedRowId && (
        <AddAndUpdateMarketing
          refetch={refetch}
          edit={true}
          title='Chi tiết khách hàng'
          marketingId={selectedRowId}
          readOnly={true}
          isOpen={isDetailModalOpen}  // Thêm prop mới
          onClose={() => setIsDetailModalOpen(false)}  // Thêm prop mới
        />
      )}

      <div className='overflow-x-auto'>
        <Table
          columns={columns}
          dataSource={dataSource}
          onChange={handleTableChange}
          loading={isLoading}
          pagination={{
            ...pagination,
            total: marketingList?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100', '200'],
          }}
          bordered
          scroll={{ x: 1300 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' }
          })}
          rowClassName={() => 'hover:bg-gray-100'}
        />
      </div>
    </div>
  );
}