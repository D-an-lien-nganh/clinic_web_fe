import {
  useCreateMarketingMutation,
  useEditMarketingMutation,
  useGetMarketingQuery,
} from '@/api/app_customer/apiMarketing';
import { useGetAllUserQuery } from '@/api/app_home/apiAccount';
import { useGetCommissionListQuery } from '@/api/app_home/apiConfiguration';
import { useGetCustomerSourceListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetServiceListQuery } from '@/api/app_product/apiService';
import { locationData } from '@/constants/location';
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  notification,
  Radio,
  Row,
  Select,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Table } from 'antd/lib';
import dayjs from 'dayjs';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import { RiDeleteBin5Line } from 'react-icons/ri';

const { Option } = Select;

interface CustomerProblem {
  key: React.Key;
  id: number;
  problem: string;
  encounter_pain: string;
  desire: string;
}

type Ward = {
  Id?: string;
  Name?: string;
  Level: string;
};

type District = {
  Id: string;
  Name: string;
  Wards: Ward[];
};

type IntroducerType = {
  id: number;
  introducer: number | null;
  commission: number | null;
  commission_note?: string;
  introducer_name?: string;
};


export default function AddAndUpdateMarketing({
  edit,
  marketingId,
  title,
  className,
  refetch,
  isOpen,
  onClose,
  ref,
  readOnly = false,
}: {
  edit?: boolean;
  marketingId?: any;
  title?: string;
  className?: string;
  refetch?: any;
  ref?: React.Ref<any>;
  readOnly?: boolean;
  isOpen?: boolean; 
  onClose?: () => void; 
}) {
  const [form] = Form.useForm();
  const [districtList, setDistrictList] = useState<District[] | []>([]);
  const [wardList, setWardList] = useState([]);
  const [createMarketing] = useCreateMarketingMutation();
  const [editMarketing] = useEditMarketingMutation();
  const [internalModalOpen, setInternalModalOpen] = useState(false);  
  const isModalOpen = isOpen !== undefined ? isOpen : internalModalOpen;
  const { data: data } = useGetMarketingQuery(marketingId, {
    skip: !marketingId || !isModalOpen,
  });
  const { data: customerSourceList } = useGetCustomerSourceListQuery();
  const { data: commissionList } = useGetCommissionListQuery();
  const { data: serviceList } = useGetServiceListQuery({});
  const { data: allUser } = useGetAllUserQuery();

  const [rows, setRows] = useState<IntroducerType[]>([]);

  const [tableData, setTableData] = useState([
    {
      key: Date.now(),
      id: 1,
      problem: '',
      encounter_pain: '',
      desire: '',
    },
  ]);

  useImperativeHandle(ref, () => ({
    handleOpenModal: () => {
      setInternalModalOpen(true);
      // Đảm bảo marketingId đã được cập nhật trước khi mở modal
      if (edit && marketingId) {
        // Trường hợp chỉnh sửa - chuẩn bị dữ liệu
        // Các bước chuẩn bị dữ liệu khi chỉnh sửa sẽ được xử lý trong useEffect
      } else {
        // Trường hợp thêm mới - reset form
        form.resetFields();
        setRows([{ id: Date.now(), introducer: null, commission: null }]);
        setTableData([
          {
            key: Date.now(),
            id: 1,
            problem: '',
            encounter_pain: '',
            desire: '',
          },
        ]);
      }
    }
  }));
  useEffect(() => {
    if (isModalOpen && edit && data) {
      form.setFieldsValue({
        ...data,
        birth: data.birth ? dayjs(data.birth) : null,
        contact_date: data.contact_date ? dayjs(data.contact_date) : null,
        service: Array.isArray(data.service)
          ? data.service.map((service: any) => service.id || service)
          : [],
      });
      if (Array.isArray(data.customer_problems)) {
        setTableData(
          data.customer_problems.map((problem: any, index: any) => ({
            key: problem.id || Date.now() + index, // Đảm bảo key là duy nhất
            id: problem.id || index + 1,
            problem: problem.problem || '',
            encounter_pain: problem.encounter_pain || '',
            desire: problem.desire || '',
          }))
        );
      }
      // Ensure at least one row is always present when editing
      if (Array.isArray(data.introducers) && data.introducers.length > 0) {
        setRows(data.introducers.map((intro: any) => ({
          id: intro.id || Date.now(),
          introducer: intro.introducer,
          commission: intro.commission,
          commission_note: intro.commission_note,
        })));
      } else {
        // If no introducers, add a default empty row
        setRows([{
          id: Date.now(),
          introducer: null,
          commission: null
        }]);
      }
    } else {
      form.resetFields();
    }
  }, [edit, data, form,isModalOpen]);

  useEffect(() => {
    if (isOpen !== undefined) {
      // If the component is externally controlled and opened
      if (isOpen) {
        // Prepare data for view mode (similar logic to showModal)
        if (edit && marketingId) {
          // Data will be loaded through the other useEffect
        } else {
          form.resetFields();
          setRows([{ id: Date.now(), introducer: null, commission: null }]);
          setTableData([
            {
              key: Date.now(),
              id: 1,
              problem: '',
              encounter_pain: '',
              desire: '',
            },
          ]);
        }
      }
    }
  }, [isOpen, edit, marketingId, form]);

  const handleAddRow = (index: number) => {
    const newRow = { id: rows.length + 1, introducer: null, commission: null };
    setRows([...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)]);
  };


  // Xóa một hàng
  const handleRemoveRow = (id: any) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleChange = (id: any, field: any, value: any) => {
    setRows(
      rows.map((row) =>
        row.id === id
          ? {
            ...row,
            [field]: value,
            ...(field === 'commission' ? {
              commission_note: commissionList?.results?.find((comm: any) => comm.id === value)?.note
            } : {})
          }
          : row
      )
    );
  };

  const handleCancel = () => {
    // Close internal modal state
    setInternalModalOpen(false);
    
    // Call external onClose callback if provided
    if (onClose) {
      onClose();
    }
    
    if (!edit) {
      form.resetFields();
      setRows([]); // Chỉ reset rows khi thêm mới
    }
  };


  const showModal = () => {
    setInternalModalOpen(true);

    if (!edit) {
      form.resetFields();
      setRows([{ id: Date.now(), introducer: null, commission: null }]); // Thêm một hàng trống khi thêm mới
    } else if (data) {
      form.setFieldsValue({
        ...data,
        birth: data.birth ? dayjs(data.birth) : null,
        contact_date: data.contact_date ? dayjs(data.contact_date) : null,
        service: Array.isArray(data.service)
          ? data.service.map((service: any) => service.id || service)
          : [],
      });
      if (Array.isArray(data.customer_problems)) {
        setTableData(
          data.customer_problems.map((problem: any, index: any) => ({
            key: problem.id || Date.now() + index, // Đảm bảo key là duy nhất
            id: problem.id || index + 1,
            problem: problem.problem || '',
            encounter_pain: problem.encounter_pain || '',
            desire: problem.desire || '',
          }))
        );
      }
      if (Array.isArray(data.introducers) && data.introducers.length > 0) {
        setRows(data.introducers.map((intro: any) => ({
          id: Date.now() + intro.introducer,
          introducer: intro.introducer,
          commission: intro.commission,
          commission_note: intro.commission_note,
        })));
      } else {
        setRows([{
          id: Date.now(),
          introducer: null,
          commission: null
        }]);
      }
    }
  };

  const onFinish = async (values: any) => {
    try {
      const validatedValues = await form.validateFields();
      const payload = {
        ...validatedValues,
        contact_date: validatedValues.contact_date
          ? dayjs(validatedValues.contact_date).format('YYYY-MM-DD')
          : null,
        birth: validatedValues.birth
          ? dayjs(validatedValues.birth).format('YYYY-MM-DD')
          : null,
        service: Array.isArray(validatedValues.service)
          ? validatedValues.service.map((id: any) => Number(id))
          : [],
        introducers: rows
          .filter(row => row.introducer && row.commission)
          .map(row => ({
            id: row.id,
            introducer: Number(row.introducer),
            commission: Number(row.commission),
          })),

        customer_problems: tableData.map((item) => ({
          problem: item.problem,
          encounter_pain: item.encounter_pain,
          desire: item.desire,
        })),
      };

      if (edit) {
        await editMarketing({ id: marketingId, ...payload }).unwrap();
        refetch();
        notification.success({
          message: 'Khách hàng đã được cập nhật!',
          placement: 'bottomRight',
          className: 'h-16',
        });
      } else {
        await createMarketing(payload).unwrap();
        refetch();
        setRows(payload.introducers.length > 0 ? payload.introducers : [{ id: Date.now(), introducer: null, commission: null }]);
        notification.success({
          message: 'Khách hàng đã được thêm mới!',
          placement: 'bottomRight',
          className: 'h-16',
        });
      }

      handleCancel();
    } catch (error) {
      console.error('Error during submission:', error);
      notification.error({
        message: 'Lỗi',
        description: 'Đã xảy ra lỗi khi xử lý dữ liệu!',
      });
    }
  };

  const handleDeleteRow = (key: any) => {
    setTableData((prev) => prev.filter((item) => item.key !== key));
  };


  const generateColumns = (): ColumnsType<CustomerProblem> => [
    {
      title: 'STT',
      dataIndex: 'id',
      align: 'center',
      render: (_, __, index) => <div>{index + 1}</div>,
    },
    {
      title: 'Vấn đề',
      dataIndex: 'problem',
      align: 'center',
      render: (_, record) => (
        <Input
          placeholder='Nhập vấn đề'
          value={record.problem}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, problem: e.target.value }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: 'Nỗi đau',
      dataIndex: 'encounter_pain',
      align: 'center',
      render: (_, record) => (
        <Input
          placeholder='Nhập nỗi đau'
          value={record.encounter_pain}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, encounter_pain: e.target.value }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: 'Mong muốn',
      dataIndex: 'desire',
      align: 'center',
      render: (_, record) => (
        <Input
          placeholder='Nhập mong muốn'
          value={record.desire}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.key === record.key
                  ? { ...item, desire: e.target.value }
                  : item
              )
            )
          }
        />
      ),
    },
    {
      title: 'Hành động',
      align: 'center',
      render: (_, record) => (
        <Button
          type='link'
          style={{ fontSize: '20px' }}
          danger
          onClick={() => handleDeleteRow(record.key)}
        >
          <RiDeleteBin5Line style={{ fontSize: '20px' }} />
        </Button>
      ),
    }

  ];

  return (
    <>
      {!readOnly && (
        <div
          className={`flex gap-2 flex-wrap justify-end items-center w-max ${className}`}
        >
          <Button
            onClick={showModal}
            style={{
              color: 'white',
              border: 'none',
              backgroundColor: edit ? 'none' : '#BD8306',
            }}
            size={'middle'}
          >
            {edit ? <FaEdit color='#000' /> : 'Thêm khách hàng'}
          </Button>
        </div>
      )}


      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        title={title}
        footer={[
          <Button key='cancel' onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key='submit' type='primary' onClick={onFinish}>
            Xác nhận
          </Button>,
        ]}
        width={1289}
        destroyOnClose
      >
        <Form
          form={form}
          id='marketingForm'
          layout='vertical'
          onFinish={onFinish}
          initialValues={{
            gender: 'MA',
          }}
          disabled={readOnly}
        >
          <Row gutter={24} align='middle'>
            <Col span={8} className='mb-10'>
              <Form.Item
                label='Họ và tên khách hàng'
                name='name'
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập họ tên khách hàng!',
                  },
                ]}
              >
                <Input placeholder='Nhập họ và tên khách hàng' />
              </Form.Item>
            </Col>

            {/* Giới tính */}
            <Col span={8} className='mb-10'>
              <Form.Item label='Giới tính' name='gender'>
                <Radio.Group>
                  <Radio value='MA'>Nam</Radio>
                  <Radio value='FE'>Nữ</Radio>
                  <Radio value='OT'>Khác</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            {/* Nguồn khách hàng */}
            <Col span={8}>
              <Form.Item
                label='Nguồn khách hàng'
                name='source'
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn nguồn khách hàng!',
                  },
                ]}
              >
                <Select placeholder='Chọn nguồn khách hàng'>
                  {customerSourceList?.results?.map(
                    (source: { id: number; name: string }) => (
                      <Option key={source.id} value={source.id}>
                        {source.name}
                      </Option>
                    )
                  )}
                </Select>
              </Form.Item>
              <Form.Item name='source_link'>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Nguồn khách hàng */}
            <Col span={8}>
              <Form.Item label='Ngày sinh' name='birth'>
                <DatePicker
                  format='DD/MM/YYYY'
                  style={{ width: '100%' }}
                  placeholder='Chọn ngày sinh'
                />
              </Form.Item>
            </Col>

            {/* Người tiếp thị */}
            <Col span={8}>
              <Form.Item
                label='Người tiếp thị'
                name='marketer'
                rules={[
                  { required: true, message: 'Vui lòng chọn người tiếp thị!' },
                ]}
              >
                <Select placeholder='Chọn người tiếp thị'>
                  {allUser?.map((user: any) => (
                    <Option key={user.id} value={user.id}>
                      {user.full_name || `${user.first_name} ${user.last_name}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8} className='mt-7'>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column', // Căn các hàng theo chiều dọc
                  gap: 8,
                }}
              >
                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    style={{
                      display: 'flex', // Căn các phần tử trong hàng theo chiều ngang
                      alignItems: 'center', // Căn giữa theo trục dọc
                      gap: 16,
                    }}
                  >
                    <div className='border rounded-full'>
                      <Button
                        type='text'
                        icon={<FaPlus />}
                        onClick={() => handleAddRow(index)}
                      />
                    </div>
                    {/* Chọn người giới thiệu */}
                    <Select
                      style={{ width: 180 }}
                      placeholder='Chọn người giới thiệu'
                      value={row.introducer}
                      onChange={(value) =>
                        handleChange(row.id, 'introducer', value)
                      }
                    >
                      {allUser?.map((user: any) => (
                        <Option key={user.id} value={user.id}>
                          {user.full_name ||
                            `${user.first_name} ${user.last_name}`}
                        </Option>
                      ))}
                    </Select>

                    {/* Chọn mức */}
                    <Select
                      style={{ width: 130 }}
                      placeholder='Chọn mức'
                      value={row.commission}
                      onChange={(value) =>
                        handleChange(row.id, 'commission', value)
                      }
                    >
                      {commissionList?.results?.map(
                        (commission: { id: number; note: string }) => (
                          <Option key={commission.id} value={commission.id}>
                            {commission.note}
                          </Option>
                        )
                      )}
                    </Select>

                    {/* Nút xóa */}
                    <div className='border rounded-full'>
                      <Button
                        danger
                        type='text'
                        icon={<FaMinus />}
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1} // Không cho xóa nếu chỉ còn 1 hàng
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          <hr />

          {/* Thông tin liên hệ */}
          <h3 className='text-[16px] font-bold mt-4'>Thông tin liên hệ</h3>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label='Số điện thoại'
                name='mobile'
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                ]}
              >
                <Input placeholder='Nhập số điện thoại' />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Email'
                name='email'
                rules={[
                  {
                    type: 'email',
                    message: 'Vui lòng nhập đúng định dạng email!',
                  },
                ]}
              >
                <Input placeholder='Nhập email' />
              </Form.Item>
              <div>Địa chỉ liên hệ</div>
              <Row gutter={24}>
                <Col span={24}>
                  <Form.Item name='city' className='mb-2'>
                    <Select
                      placeholder={'Chọn Tỉnh / Thành phố'}
                      onChange={(value) =>
                        setDistrictList(
                          locationData?.filter(
                            (item: { Name: string }) => item.Name === value
                          )[0]?.Districts
                        )
                      }
                    >
                      {locationData &&
                        locationData?.map(
                          (item: { Id: string; Name: string }) => (
                            <Option key={item.Id} value={item.Name}>
                              {item.Name}
                            </Option>
                          )
                        )}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name='district' className='mb-2'>
                    <Select
                      placeholder={'Chọn Quận / Huyện'}
                      onChange={(value) =>
                        setWardList(
                          (
                            districtList?.filter(
                              (item: any) => item.Name === value
                            )[0] as any
                          )?.Wards
                        )
                      }
                    >
                      {districtList?.map(
                        (item: { Id: string; Name: string }) => (
                          <Option key={item.Id} value={item.Name}>
                            {item.Name}
                          </Option>
                        )
                      )}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name='ward' className='mb-2'>
                    <Select placeholder={'Chọn Phường / Xã'} allowClear>
                      {wardList?.map((item: { Id: string; Name: string }) => (
                        <Option key={item.Id} value={item.Name}>
                          {item.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name='address' className='mb-2'>
                    <Input placeholder='Nhập địa chỉ' />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
            <Col span={8}>
              <Row gutter={24}>
                <Col span={14}></Col>
                <Col span={24}>
                  <Form.Item
                    label='Ngày hẹn liên hệ'
                    name='contact_date'
                    rules={[
                      {
                        validator: (_, value) => {
                          if (value && dayjs(value).isBefore(dayjs(), 'day')) {
                            return Promise.reject(
                              'Ngày hẹn liên hệ phải sau ngày hiện tại'
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <DatePicker
                      format='DD/MM/YYYY'
                      style={{ width: '100%' }}
                      placeholder='Chọn hẹn liên hệ'
                      disabledDate={(current) =>
                        current && current < dayjs().startOf('day')
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
          <hr />
          <div className='text-[16px] font-bold mt-4'>Thông tin chi tiết</div>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label='Dịch vụ quan tâm'
                name='service'
                rules={[{ required: true, message: 'Vui lòng chọn dịch vụ!' }]}
              >
                <Select
                  mode='multiple'
                  placeholder='Chọn dịch vụ'
                  allowClear
                  optionFilterProp='children'
                >
                  {serviceList?.results?.map(
                    (service: { id: number; name: string }) => (
                      <Option key={service.id} value={service.id}>
                        {service.name}
                      </Option>
                    )
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}></Col>
          </Row>
          <Table
            columns={generateColumns()}
            dataSource={tableData}
            rowKey='key'
            pagination={false}
            bordered
            footer={() => (
              <Button
                type='dashed'
                style={{ color: '#BD8306' }}
                onClick={() =>
                  setTableData((prev) => [
                    ...prev,
                    {
                      key: Date.now(),
                      id: prev.length + 1,
                      problem: '',
                      encounter_pain: '',
                      desire: '',
                    },
                  ])
                }
                block
              >
                + Thêm
              </Button>
            )}
          />
        </Form>
      </Modal>
    </>
  );
}
