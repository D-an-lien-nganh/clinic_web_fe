"use client";
import { useCreateCustomerCareMutation, useDeleteCustomerCareMutation, useEditMarketingMutation, useGetCustomerCareListQuery, useGetLeadStatusListQuery, useGetMarketingQuery } from '@/api/app_customer/apiMarketing';
import { useGetAllUserQuery } from '@/api/app_home/apiAccount';
import { useGetCommissionListQuery, useGetTimeFrameListQuery } from '@/api/app_home/apiConfiguration';
import { useGetCustomerSourceListQuery } from '@/api/app_home/apiCustomerManagement';
import { useGetServiceListQuery } from '@/api/app_product/apiService';
import { locationData } from '@/constants/location';
import { Button, Col, DatePicker, Form, Input, Modal, notification, Radio, Row, Select, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import { RiDeleteBin5Line } from "react-icons/ri";

const { Option } = Select;


interface CustomerProblem {
  key: React.Key;
  id: number;
  problem: string;
  encounter_pain: string;
  desire: string;
}

interface UpdateNotBoughtProps {
  customerId?: number;
  refetch?: any;
  isLoading?: any;
  title?: string;
  readOnly?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  ref?: React.Ref<any>;
}

type Ward = {
  Id: string;
  Name: string;
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


const UpdateNotBought: React.FC<UpdateNotBoughtProps> = ({ customerId, ref, readOnly = false, refetch, isLoading, title, isOpen, onClose }) => {
  const [form] = Form.useForm();
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = isOpen !== undefined ? isOpen : internalModalOpen;
  const [districtList, setDistrictList] = useState<District[] | []>([]);
  const [wardList, setWardList] = useState<Ward[]>([]);
  const { data: customerSourceList } = useGetCustomerSourceListQuery();
  const { data: customerData } = useGetMarketingQuery(customerId, {
    skip: !customerId || !isModalOpen,
  });
  const { data: customerCareData, isLoading: isCareLoading, refetch: refetchCareList } = useGetCustomerCareListQuery();
  const { data: timeFrameList } = useGetTimeFrameListQuery();
  const { data: allUser } = useGetAllUserQuery();
  const [editCustomer] = useEditMarketingMutation();
  const [createCustomerCare] = useCreateCustomerCareMutation();
  const [deleteCustomerCare] = useDeleteCustomerCareMutation();
  const [newCareList, setNewCareList] = useState<any[]>([]);
  const { data: serviceList } = useGetServiceListQuery({});
  const { data: commissionList } = useGetCommissionListQuery();
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


  const showModal = () => {
    if (isOpen === undefined) {
      setInternalModalOpen(true);
    }
    if (customerId) {
      form.setFieldsValue({
        ...customerData,
        birth: customerData?.birth ? dayjs(customerData?.birth) : null,
        contact_date: customerData?.contact_date ? dayjs(customerData?.contact_date) : null,
        service: Array.isArray(customerData?.service)
          ? customerData?.service.map((service: any) => service.id || service)
          : [],
      });
      if (Array.isArray(customerData?.introducers) && customerData?.introducers.length > 0) {
        setRows(customerData?.introducers.map((intro: any) => ({
          id: Date.now() + intro?.introducer,
          introducer: intro?.introducer,
          commission: intro?.commission,
          commission_note: intro?.commission_note,
        })));
      } else {
        setRows([{
          id: Date.now(),
          introducer: null,
          commission: null
        }]);
      }
      if (Array.isArray(customerData?.customer_problems)) {
        setTableData(
          customerData?.customer_problems.map((problem: any, index: any) => ({
            key: problem.id || Date.now() + index,
            id: problem.id || index + 1,
            problem: problem?.problem || '',
            encounter_pain: problem?.encounter_pain || '',
            desire: problem?.desire || '',
          }))
        );
      }
    }
  };

  useEffect(() => {
    if (isModalOpen && customerData) {
      form.setFieldsValue({
        ...customerData,
        birth: customerData.birth ? dayjs(customerData.birth) : null,
        contact_date: customerData.contact_date ? dayjs(customerData.contact_date) : null,
        service: Array.isArray(customerData.service)
          ? customerData.service.map((service: any) => service.id || service)
          : [],
      });
      if (Array.isArray(customerData.introducers) && customerData.introducers.length > 0) {
        setRows(customerData.introducers.map((intro: any) => ({
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
      if (Array.isArray(customerData.customer_problems)) {
        setTableData(
          customerData.customer_problems.map((problem: any, index: any) => ({
            key: problem.id || Date.now() + index, // Đảm bảo key là duy nhất
            id: problem.id || index + 1,
            problem: problem.problem || '',
            encounter_pain: problem.encounter_pain || '',
            desire: problem.desire || '',
          }))
        );
      }
    }
  }, [customerData, form, isModalOpen]);


  useEffect(() => {
    if (isOpen !== undefined) {
      // If the component is externally controlled and opened
      if (isOpen) {
        // Prepare data for view mode (similar logic to showModal)
        if (customerId) {
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
  }, [isOpen, customerId, form]);

  const handleCancel = () => {
    setInternalModalOpen(false);

    if (isOpen !== undefined && onClose) {
      onClose();
    }

    form.resetFields();
    setTableData([]);
    setNewCareList([]);
  };
  const handleFinish = async () => {
    try {
      const values = await form.validateFields();

      for (const care of newCareList.filter(care => care.isNew)) {
        const payload = {
          customer: customerId,
          date: care.date ? dayjs(care.date).format('YYYY-MM-DD') : null,
          note: care.note,
          type: care.type,
        };
        await createCustomerCare(payload).unwrap();
      }

      const payload = {
        ...values,
        birth: values.birth
          ? dayjs(values.birth).format('YYYY-MM-DD')
          : null,
        contact_date: values.contact_date
          ? dayjs(values.contact_date).format('YYYY-MM-DD')
          : null,
        service: Array.isArray(values.service)
          ? values.service.map((id: any) => Number(id))
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
      await editCustomer({ id: customerId, ...payload }).unwrap();

      notification.success({
        message: 'Khách hàng đã được cập nhật!',
        className: "h-16",
        placement: "bottomRight",
      });
      refetch();
      if (customerCareData !== undefined) {
        refetchCareList();
      }
      setNewCareList([]);
      handleCancel();
    } catch (error) {
      notification.error({
        message: 'Đã xảy ra lỗi khi xử lý dữ liệu!',
        className: "h-16",
        placement: "bottomRight",
      });
    }
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

  const customerCareColumns: ColumnsType<any> = [
    {
      title: "Lần",
      dataIndex: "index",
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ngày",
      dataIndex: "date",
      align: "center",
      render: (value, record) =>
        record.isNew ? (
          <DatePicker
            style={{ width: "100%" }}
            value={value ? dayjs(value) : null}
            onChange={(date) =>
              setNewCareList((prev) =>
                prev.map((item) =>
                  item.key === record.key
                    ? { ...item, date: date ? date.toISOString() : null }
                    : item
                )
              )
            }
          />
        ) : (
          dayjs(value).format("DD/MM/YYYY")
        ),
    },
    {
      title: "Nội dung",
      dataIndex: "note",
      align: "center",
      render: (value, record) =>
        record.isNew ? (
          <Input
            placeholder="Nhập nội dung"
            value={value}
            onChange={(e) =>
              setNewCareList((prev) =>
                prev.map((item) =>
                  item.key === record.key
                    ? { ...item, note: e.target.value }
                    : item
                )
              )
            }
          />
        ) : (
          value
        ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      align: "center",
      render: (value, record) =>
        record.isNew ? (
          <Select
            placeholder="Chọn loại"
            style={{ width: "100%" }}
            value={value}
            onChange={(selectedValue) =>
              setNewCareList((prev) =>
                prev.map((item) =>
                  item.key === record.key
                    ? { ...item, type: selectedValue }
                    : item
                )
              )
            }
          >
            <Option value="incoming">Gọi đến</Option>
            <Option value="outgoing">Gọi đi</Option>
          </Select>
        ) : value === "incoming" ? (
          "Gọi đến"
        ) : (
          "Gọi đi"
        ),
    },
    {
      title: "Hành động",
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          danger
          onClick={() =>
            record.isNew
              ? setNewCareList((prev) =>
                prev.filter((item) => item.key !== record.key)
              )
              : handleDeleteRow(record.id)
          }
        >
          <RiDeleteBin5Line style={{ fontSize: "20px" }} />
        </Button>
      ),
    },
  ];

  const filteredCustomerCareList = customerCareData?.results?.filter(
    (care: any) => care.customer === customerId
  );

  const combinedCareData = [
    ...(filteredCustomerCareList?.map((item: any, index: any) => ({
      ...item,
      key: item.id,
      index: index + 1,
      isNew: false,
    })) || []),
    ...newCareList.map((item, index) => ({
      ...item,
      key: item.key,
      index: (filteredCustomerCareList?.length || 0) + index + 1,
      isNew: true,
    })),
  ];

  const handleAddRow = (index: number) => {
    const newRow = { id: rows.length + 1, introducer: null, commission: null };
    setRows([...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)]);
  };

  const handleRemoveRow = (id: any) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const handleAddRowCustomerCare = () => {
    setNewCareList([
      ...newCareList,
      { key: Date.now(), date: null, note: '', type: '', isNew: true }
    ]);
  };


  const handleDeleteRow = async (careId: number) => {
    try {
      await deleteCustomerCare({ customerCareId: careId }).unwrap();
      notification.success({
        message: 'Đã xóa thông tin chăm sóc khách hàng!',
        className: "h-20",
        placement: "bottomRight",
      });
      if (customerCareData !== undefined) {
        refetchCareList();
      }
    } catch (error) {
      notification.error({
        message: 'Có lỗi khi xóa thông tin chăm sóc!',
        className: "h-16",
        placement: "bottomRight",
      });
    }
  };

  const generateColumns = (): ColumnsType<CustomerProblem> => [
    {
      title: "STT",
      dataIndex: "id",
      align: "center",
      render: (_, __, index) => <div>{index + 1}</div>,
    },
    {
      title: "Vấn đề",
      dataIndex: "problem",
      align: "center",
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
      title: "Nỗi đau",
      dataIndex: "encounter_pain",
      align: "center",
      render: (_, record) => (
        <Input
          placeholder='Nhập nỗi đau'
          value={record.encounter_pain}
          onChange={(e) =>
            setTableData((prev) =>
              prev.map((item) =>
                item.key === record.key ? { ...item, encounter_pain: e.target.value } : item
              )
            )
          }
        />
      ),
    },
    {
      title: "Mong muốn",
      dataIndex: "desire",
      align: "center",
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
      title: "Hành động",
      align: "center",
      render: (_, record) => (
        <Button
          type="link"
          style={{ fontSize: '20px' }}
          danger
          onClick={() =>
            setTableData((prev) => prev.filter((item) => item.key !== record.key))
          }
        >
          <RiDeleteBin5Line style={{ fontSize: '20px' }} />
        </Button>
      ),
    },
  ];

  return (
    <>
      {!readOnly && (
        <Button
          onClick={showModal}
          style={{
            color: 'white',
            border: 'none',
            backgroundColor: '#BD8306',
          }}
          size={'middle'}
        >
          Cập nhật
        </Button>
      )}
      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        title={` ${title}: ${customerData?.name || ''}`}
        footer={[
          <Button key='cancel' onClick={handleCancel}>
            Hủy
          </Button>,
          <Button key='submit' type='primary' onClick={handleFinish} loading={isLoading || isCareLoading}>
            Xác nhận
          </Button>,
        ]}
        width={1289}
        destroyOnClose
      >
        <Form form={form} layout='vertical' disabled={readOnly}>
          <Row gutter={24} align="middle">
            <Col span={8} className='mb-10'>
              <Form.Item
                label="Họ và tên khách hàng"
                name="name"
              >
                <Input placeholder="Nhập họ và tên khách hàng" />
              </Form.Item>
            </Col>

            <Col span={8} className='mb-10'>
              <Form.Item
                label="Giới tính"
                name="gender"
              >
                <Radio.Group disabled>
                  <Radio value="MA">Nam</Radio>
                  <Radio value="FE">Nữ</Radio>
                  <Radio value="OT">Khác</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Nguồn khách hàng'
                name='source'
              >
                <Select placeholder='Chọn nguồn khách hàng' disabled>
                  {customerSourceList?.results?.map(
                    (source: { id: number; name: string }) => (
                      <Option key={source.id} value={source.id}>
                        {source.name}
                      </Option>
                    )
                  )}
                </Select>
              </Form.Item>
              <Form.Item name="source_link">
                <Input readOnly placeholder="Nhập link nguồn (nếu có)" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Ngày sinh" name="birth">
                <DatePicker disabled format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Chọn ngày sinh" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label='Người tiếp thị'
                name='marketer'
              >
                <Select disabled placeholder='Chọn người tiếp thị'>
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

          <h3 className='text-[18px] font-bold mt-4'>Thông tin liên hệ</h3>
          <Row gutter={16}>
            <Col span={8} key="mobile">
              <Form.Item
                label="Số điện thoại"
                name="mobile"
              >
                <Input readOnly placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>

            <Col span={8} key="email">
              <Form.Item label="Email" name="email">
                <Input placeholder="Nhập email" readOnly />
              </Form.Item>
              <div>Địa chỉ liên hệ</div>
              <Row gutter={24}>
                <Col span={24} key="city">
                  <Form.Item name="city" className="mb-2">
                    <Select
                      disabled
                      placeholder={"Chọn Tỉnh / Thành phố"}
                      onChange={(value) =>
                        setDistrictList(locationData?.filter((item: { Name: string }) => item.Name === value)[0]?.Districts.map((district: any) => ({
                          ...district,
                          Wards: district.Wards.map((ward: any) => ({
                            Id: ward.Id || '',
                            Name: ward.Name || '',
                            Level: ward.Level,
                          })),
                        })))
                      }
                      value={customerData?.city}
                    >
                      {locationData?.map((item: { Id: string; Name: string }) => (
                        <Option key={item.Id} value={item.Name}>
                          {item.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24} key="district">
                  <Form.Item name="district" className="mb-2">
                    <Select
                      disabled
                      placeholder={"Chọn Quận / Huyện"}
                      onChange={(value) =>
                        setWardList((districtList?.filter((item: any) => item.Name === value)[0] as any)?.Wards)
                      }
                      value={customerData?.district}
                    >
                      {districtList?.map((item: { Id: string; Name: string }) => (
                        <Option key={item.Id} value={item.Name}>
                          {item.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24} key="ward">
                  <Form.Item name="ward" className="mb-2">
                    <Select placeholder={"Chọn Phường / Xã"} disabled allowClear value={customerData?.ward}>
                      {wardList?.map((item: { Id: string; Name: string }) => (
                        <Option key={item.Id} value={item.Name}>
                          {item.Name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24} key="address">
                  <Form.Item name="address" className="mb-2">
                    <Input readOnly placeholder="Nhập địa chỉ" value={customerData?.address} />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={8} key="social-media">
              <Row gutter={24}>
                <Col span={24} key="contact_date">
                  <Form.Item
                    label='Ngày hẹn đến'
                    name='contact_date'
                    rules={[
                      {
                        validator: (_, value) => {
                          if (value && dayjs(value).isBefore(dayjs(), 'day')) {
                            return Promise.reject(
                              'Ngày hẹn đến phải sau ngày hiện tại'
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
                <Col span={24} key="time_frame">
                  <Form.Item
                    label="Chọn khung giờ"
                    name="time_frame"
                    rules={[{ required: true, message: "Vui lòng chọn khung giờ!" }]}
                  >
                    <Select placeholder="Chọn khung giờ">
                      {timeFrameList?.results?.map((timeFrame: any) => (
                        <Select.Option key={timeFrame.id} value={timeFrame.id}>
                          {`${timeFrame.start} - ${timeFrame.end}`}
                        </Select.Option>
                      ))}
                    </Select>
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
            <Col span={12}></Col>
          </Row>
          <Table
            columns={generateColumns()}
            dataSource={tableData}
            rowKey="key"
            pagination={false}
            bordered
            footer={() => (
              <Button
                type="dashed"
                style={{ color: "#BD8306" }}
                onClick={() =>
                  setTableData((prev) => [
                    ...prev,
                    {
                      key: Date.now(),
                      id: prev.length + 1,
                      problem: "",
                      encounter_pain: "",
                      desire: "",
                    },
                  ])
                }
                block
              >
                + Thêm
              </Button>
            )}
          />

          <h3 className='text-[18px] font-bold mt-4'>Thông tin chăm sóc khách hàng</h3>
          <div>Yêu cầu trải nghiệm</div>
          <div className="w-full">
            <Table
              columns={customerCareColumns}
              dataSource={combinedCareData}
              rowKey="key"
              pagination={false}
              bordered
              footer={() => (
                <Button
                  type="dashed"
                  style={{ color: "#BD8306" }}
                  onClick={handleAddRowCustomerCare}
                  block
                >
                  + Thêm
                </Button>
              )}
            />
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default UpdateNotBought;