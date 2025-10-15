 import React, {useEffect, useState} from "react";
import {
    Form,
    Input,
    Select,
    Radio,
    DatePicker,
    Collapse,
    Button, TimePicker, Table, Row, Col,
} from "antd";



const {Option} = Select;
const {TextArea} = Input;

import dayjs from "dayjs";
import {ColumnsType} from "antd/es/table";
import {RiDeleteBin5Line} from "react-icons/ri";
import {useGetBillsByIdQuery,useEditBillsMutation} from "@/api/app_treatment/apiTreatment"
 import {useGetServiceListQuery} from "@/api/app_product/apiService";

interface DataTypeList {
    key: React.Key;
    id: number;
    problem: string;
    pain: string;
    desire: string;
}

interface TableItem {
    key: number; // STT
    name?: string; // Tên thuốc
    quantity?: string; // Số lượng
    unit?: string; // Đơn vị
    dosage?: string; // Liều lượng
    note?: string; // Lưu ý
    price?: string; // Số tiền
}

;

interface TherapyRecord {
    key: string | number;
    therapyType: string;
    sessionCount: number;
    unit: string;
    completedSessions: number;
}

const DetailReportfile = ({code, id,onComplete}: { code: string, id: number,onComplete?: () => void  }) => {
    const [form] = Form.useForm();
    const {data: datadetail} = useGetBillsByIdQuery(id);
    const [editBills, { isLoading, isError, error }] = useEditBillsMutation();
    const { data: serviceList, isFetching } = useGetServiceListQuery({});
    const [tableData, setTableData] = useState<TableItem[]>([])
    const [therapyData, setTherapyData] = useState<TherapyRecord[]>([]);
    const [examinationValues, setExaminationValues] = useState([]);

    const [dataList, setDataList] = useState<DataTypeList[]>([]);

    const dataSources =
        serviceList?.results?.map((record: { id: any }) => ({
            ...record,
            key: record.id,
        })) || [];

    useEffect(() => {
        if (datadetail) {
            form.setFieldsValue({
                fullName: datadetail.customer_details.name,
                Gender: datadetail.customer_details.gender,
                sourcename: datadetail.customer_details?.source_details?.source_name || "",
                sourcelink: datadetail.customer_details?.source_details?.source_link || "",
                birthDate: datadetail.customer_details.birth_date
                    ? dayjs(datadetail.customer_details.birth_date, 'YYYY-MM-DD')
                    : null,
                gender: datadetail.customer_details.gender || 'Khác',
                referrer: datadetail.customer_details.marketer_full,
                introducerSource: datadetail?.customer_details?.source_name || "",


                introducers: datadetail.customer_details?.introducers?.map((item:any) => ({
                    introducer_name: item.introducer_name,
                    commission: item.commission
                })) || [],
                Experience_day: datadetail.customer_details?.examination_histories
                    ?.filter((item: any) => item.day)
                    .map((item: any) => item.day) || [],
                treatment_method:datadetail.doctor_process_details?.treatment_method || "",
                introducer: datadetail.customer_details.introducers[0]?.introducer === 103 ? 'A' : 'B',
                commissionLevel: datadetail.customer_details.introducers[0]?.commission || '5%',
                phone_number: datadetail.customer_details.mobile,
                email: datadetail.customer_details.email,
                city: datadetail.customer_details.city || null,
                district: datadetail.customer_details.district || null,
                ward: datadetail.customer_details.ward || null,
                address: datadetail.customer_details.address || null,
                doctor: datadetail?.doctor || "",
                social_media: datadetail.customer_details.source_name || 'Youtube',
                total_amount: datadetail?.total_amount || "",
                total_amount_real: datadetail?.total_amount_real || "",
                amount_remaining: datadetail?.amount_remaining || "",
                total_product_amount: datadetail?.total_product_amount || "",
                total_service_amount: datadetail?.total_service_amount || "",


                examHistory: datadetail.doctor_process_details?.nurse_process_details?.booking_detail?.created
                    ? dayjs(datadetail.doctor_process_details.nurse_process_details.booking_detail.created, 'YYYY-MM-DD')
                    : null,
                experienceday: datadetail.doctor_process_details?.nurse_process_details?.booking_detail?.experience_day || null,
                receiving_day: datadetail.doctor_process_details?.nurse_process_details?.booking_detail?.receiving_day || null,
                service: datadetail.treatment_request?.map((tr: any) => tr.service_details.service_name) || [],
                present_symptom: datadetail.doctor_process_details?.datadetail?.doctor_process_details?.present_symptom || '',
                medicalHistory: datadetail.doctor_process_details?.medical_history || '',
                diagnosis: datadetail.doctor_process_details?.diagnosis || '',
                presentSymptom: datadetail.doctor_process_details?.present_symptom || '',
                nearestExamination: datadetail.doctor_process_details?.nurse_process_details?.nearest_examination || '',
                bloodPressure: datadetail.doctor_process_details?.nurse_process_details?.blood_presure || '',
                heartBeat: datadetail.doctor_process_details?.nurse_process_details?.heart_beat || '',
                height: datadetail.doctor_process_details?.nurse_process_details?.height || '',
                weight: datadetail.doctor_process_details?.nurse_process_details?.weight || '',
                breathingBeat: datadetail.doctor_process_details?.nurse_process_details?.breathing_beat || '',

                medicine: datadetail.doctor_process_details?.diagnosis_medicines?.map((med: any) => med.product_name) || [],
            });
            // Cập nhật dữ liệu bảng thuốc
            if (datadetail.doctor_process_details?.diagnosis_medicines) {
                const formattedData = datadetail.doctor_process_details.diagnosis_medicines.map((med: any, index: any) => ({
                    key: index + 1,
                    name: med.product_name,
                    quantity: med.quantity,
                    unit: med.unit_str,
                    dosage: med.dose,
                    note: med.note,
                    price: med.price,
                }));

                setTableData([...formattedData, {key: formattedData.length + 1}]); // Thêm hàng trống cuối bảng
            }
            if (datadetail.treatment_request) {
                const formattedTherapyData = datadetail.treatment_request.map((tr: any, index: any) => ({
                    key: index + 1,
                    therapyType: tr.service_details.service_name,
                    sessionCount: tr.service_details.service_number,
                    unit: tr.service_details.service_unit,
                    completedSessions: 0, // Mặc định là 0, có thể cập nhật từ API nếu có
                }));

                setTherapyData([...formattedTherapyData, {key: formattedTherapyData.length + 1}]); // Thêm hàng trống cuối bảng
            }
        }
    }, [datadetail, form]);


    // Đổi tên biến ở đây

    const columns = [
        {
            title: "STT",
            dataIndex: "key",
            width: 50,
        },
        {
            title: "Tên thuốc",
            dataIndex: "name",
            render: (text: any, record: any) => (
                <Input
                    value={text}
                    onChange={(e) => handleInputChange(record.key, 'name', e.target.value)}
                    placeholder="Nhập tên thuốc"
                />
            ),
        },
        {
            title: "Số lượng",
            dataIndex: "quantity",
            width: 100,
            render: (text: any, record: any) => (
                <Input
                    value={text}
                    onChange={(e) => handleInputChange(record.key, 'quantity', e.target.value)}
                    placeholder="Nhập số lượng"
                />
            ),
        },
        {
            title: "Đơn vị",
            dataIndex: "unit",
            width: 100,
            render: (text: any, record: any) => (
                <Input
                    value={text}
                    onChange={(e) => handleInputChange(record.key, 'unit', e.target.value)}
                    placeholder="Nhập đơn vị"
                />
            ),
        },
        {
            title: "Liều lượng",
            dataIndex: "dosage",
            width: 100,
            render: (text: any, record: any) => (
                <Input
                    value={text}
                    onChange={(e) => handleInputChange(record.key, 'dosage', e.target.value)}
                    placeholder="Nhập liều lượng"
                />
            ),
        },
        {
            title: "Lưu ý",
            dataIndex: "note",
            render: (text: any, record: any) => (
                <Input
                    value={text}
                    onChange={(e) => handleInputChange(record.key, 'note', e.target.value)}
                    placeholder="Nhập lưu ý"
                />
            ),
        },
        {
            title: "Số tiền (VND)",
            dataIndex: "price",
            width: 120,
            render: (text: any, record: any) => (
                <Input
                    value={text}
                    onChange={(e) => handleInputChange(record.key, 'price', e.target.value)}
                    placeholder="Nhập số tiền"
                />
            ),
        },
    ];

    const handleInputChange = (key: any, field: any, value: any) => {
        setTableData(prevData => {
            const newData = [...prevData];
            const index = newData.findIndex(item => item.key === key);
            if (index > -1) {
                newData[index] = {...newData[index], [field]: value};
            } else {
                newData.push({key, [field]: value});
            }
            return newData;
        });
    };

    const handleAddNewRow = () => {
        const newRow = {key: tableData.length + 1};
        setTableData([...tableData, newRow]);
    };


    const updateTherapyField = (key: any, field: any, value: any) => {
        setTherapyData((prevData) =>
            prevData.map((item) =>
                item.key === key ? {...item, [field]: value} : item
            )
        );
    };


    const therapyColumns = [
        {
            title: "STT",
            dataIndex: "key",
            key: "key",
        },
        {
            title: "Loại trị liệu",
            dataIndex: "therapyType",
            key: "therapyType",
            render: (text: any, record: any) => (
                <Input
                    defaultValue={text}
                    onChange={(e) => updateTherapyField(record.key, "therapyType", e.target.value)}
                />
            ),
        },
        {
            title: "Số buổi",
            dataIndex: "sessionCount",
            key: "sessionCount",
            render: (text: any, record: any) => (
                <Input
                    type="number"
                    defaultValue={text}
                    onChange={(e) => updateTherapyField(record.key, "sessionCount", e.target.value)}
                />
            ),
        },
        {
            title: "Đơn vị",
            dataIndex: "unit",
            key: "unit",
        },
        {
            title: "Buổi đã thực hiện",
            dataIndex: "completedSessions",
            key: "completedSessions",
            render: (text: any, record: any) => (
                <Input
                    type="number"
                    defaultValue={text}
                    onChange={(e) => updateTherapyField(record.key, "completedSessions", e.target.value)}
                />
            ),
        }
    ];


    const createColumns = (): ColumnsType<DataTypeList> => [
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
            render: (_, rowData: DataTypeList) => (
                <Input
                    value={rowData.problem}
                    onChange={(e) =>
                        setDataList((prev) =>
                            prev.map((entry) =>
                                entry.key === rowData.key
                                    ? {...entry, problem: e.target.value}
                                    : entry
                            )
                        )
                    }
                />
            ),
        },
        {
            title: 'Nỗi đau',
            dataIndex: 'pain',
            align: 'center',
            render: (_, rowData: DataTypeList) => (
                <Input
                    value={rowData.pain}
                    onChange={(e) =>
                        setDataList((prev) =>
                            prev.map((entry) =>
                                entry.key === rowData.key
                                    ? {...entry, pain: e.target.value}
                                    : entry
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
            render: (_, rowData: DataTypeList) => (
                <Input
                    value={rowData.desire}
                    onChange={(e) =>
                        setDataList((prev) =>
                            prev.map((entry) =>
                                entry.key === rowData.key
                                    ? {...entry, desire: e.target.value}
                                    : entry
                            )
                        )
                    }
                />
            ),
        },
        {
            title: 'Hành động',
            align: 'center',
            render: (_, rowData: DataTypeList) => (
                <Button
                    type='link'
                    style={{fontSize: '20px'}}
                    danger
                    onClick={() =>
                        setDataList((prev) => prev.filter((entry) => entry.key !== rowData.key))
                    }
                >
                    <RiDeleteBin5Line style={{fontSize: '20px'}}/>
                </Button>
            ),
        },
    ];
    const items = [
        {
            key: "1",
            label: "Thông tin liên hệ",
            children: (
                <Row gutter={24}>
                    <Col span={8} key="phone-number">
                        <Form.Item
                            label="Số điện thoại"
                            name="phone_number"
                            labelCol={{span: 24}}
                            wrapperCol={{span: 24}}

                        >
                            <Input disabled/>
                        </Form.Item>
                    </Col>

                    <Col span={8} key="email">
                        <Form.Item
                            label="Email"
                            name="email"
                            labelCol={{span: 24}}
                            wrapperCol={{span: 24}}
                        >
                            <Input disabled/>
                        </Form.Item>
                        <div>Địa chỉ liên hệ</div>
                        <Row gutter={24}>
                            <Col span={24} key="city">
                                <Form.Item name="city" className="mb-2">
                                    <Input disabled/>
                                </Form.Item>
                            </Col>
                            <Col span={24} key="district">
                                <Form.Item name="district" className="mb-2">

                                    <Input disabled/>
                                </Form.Item>
                            </Col>
                            <Col span={24} key="ward">
                                <Form.Item name="ward" className="mb-2">
                                    <Input disabled/>
                                </Form.Item>
                            </Col>
                            <Col span={24} key="address">
                                <Form.Item name="address" className="mb-2">
                                    <Input disabled/>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>

                    <Col span={8} key="social-media">
                        <Row gutter={24}>
                            <Col span={10} key="social-media-select">
                                <Form.Item
                                    label="Mạng xã hội"
                                    name="sourcename"
                                    rules={[{required: true, message: "Vui lòng chọn mạng xã hội!"}]}
                                    labelCol={{span: 24}}
                                    wrapperCol={{span: 24}}

                                >
                                    <Input disabled/>
                                </Form.Item>
                            </Col>
                            <Col span={14} key="social-media-input">
                                <Form.Item
                                    name={'sourcelink'}
                                    label
                                    labelCol={{span: 24}}
                                    wrapperCol={{span: 24}}
                                >
                                    <Input disabled/>
                                </Form.Item>
                            </Col>

                        </Row>
                    </Col>
                </Row>
            ),
        },
        {
            key: "2",
            label: "Thông tin chi tiết",
            children: (
                <>
                    <Form.Item
                        label="Lịch sử khám"
                        name="Experience_day"
                    >
                        <Select
                            disabled
                            mode="multiple"
                            placeholder="Chọn ngày khám"
                            allowClear
                            optionFilterProp="children"
                        >
                            {datadetail?.customer_details?.examination_histories
                                ?.filter((item: any) => item.day) // Lọc bỏ ngày null
                                .map((item: any) => (
                                    <Select.Option key={item.id} value={item.day}>
                                        {dayjs(item.day).format("DD/MM/YYYY")}
                                    </Select.Option>
                                ))}
                        </Select>
                    </Form.Item>

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                label='Dịch vụ quan tâm'
                                name='service'
                                rules={[{required: true, message: 'Vui lòng chọn dịch vụ!'}]}
                            >
                                <Select
                                    disabled
                                    mode='multiple'
                                    placeholder='Chọn dịch vụ'
                                    allowClear
                                    optionFilterProp='children'
                                >
                                    {datadetail?.treatment_request?.map((tr: any) => (
                                        <Select.Option key={tr.service_details.id}
                                                       value={tr.service_details.service_name}>
                                            {tr.service_details.service_name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>

                        </Col>
                        <Col span={8}></Col>
                    </Row>
                    <Table
                        columns={createColumns()}
                        dataSource={dataList}
                        rowKey='key'
                        pagination={false}
                        bordered

                    />
                </>
            ),
        },
        {
            key: "3",
            label: "Thông tin sức khỏe",
            children: (
                <div className={'flex justify-between'}>
                    <Form.Item labelCol={{span: 24}} name="nearestExamination" label="Các xét nghiệm đã có">
                        <Input disabled/>
                    </Form.Item>
                    <div className={'flex items-center'}>


                        <Form.Item name="bloodPressure" label="Huyết áp">
                            <Input disabled/>
                        </Form.Item>
                        <Form.Item name="heartBeat" label="Nhịp tim">
                            <Input disabled/>
                        </Form.Item>
                        <Form.Item name="breathingBeat" label="Nhịp thở">
                            <Input disabled/>
                        </Form.Item>
                    </div>
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item name="height" label="Chiều cao (cm)">
                                <Input disabled/>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="weight" label="Cân nặng (kg)">
                                <Input disabled/>
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            ),
        },
        {
            key: "4",
            label: "Khám lâm sàng",
            children: (
                <Row gutter={24} align="top">
                    {/* Cột trái - Thông tin khám bệnh */}
                    <Col span={9}>
                        <Form.Item label="Triệu chứng bệnh hiện tại" name="presentSymptom" rules={[{required: true}]}>
                            <Input.TextArea disabled/>
                        </Form.Item>

                        <Form.Item label="Tiền sử bệnh" name="medical_history" rules={[{required: true}]}>
                            <Input.TextArea disabled/>
                        </Form.Item>

                        <Form.Item label="Chuẩn đoán" name="diagnosis">
                            <Input disabled/>
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Bắt đầu khám" name="startTime" rules={[{required: true}]}>
                                    <TimePicker disabled format="HH:mm" style={{width: "100%"}}/>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Kết thúc khám" name="endTime" rules={[{required: true}]}>
                                    <TimePicker disabled format="HH:mm" style={{width: "100%"}}/>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Col>

                    {/* Cột phải - Thông tin hóa đơn */}
                    <Col span={14}>
                        <Table
                            bordered
                            columns={columns}
                            dataSource={[...tableData, {key: tableData.length + 1}]} // Luôn có hàng trống cuối cùng
                            pagination={false}

                        />


                        <div style={{marginTop: "16px", fontWeight: "bold"}}>
                            <h3>Tổng tiền: {datadetail?.total_amount || ""}</h3>
                            <Form.Item label="Khuyến mãi" name="discount">

                                <Input disabled />
                            </Form.Item>
                            <h3>Thành tiền: {datadetail?.total_amount_real || ""}</h3>
                        </div>
                    </Col>
                </Row>

            ),
        },
        {
            key: "5",
            label: "Tái khám",
            children: (
                <Col span={24}>
                    <Form.Item label="Ngày đến tái khám" name="receiving_day">
                        <DatePicker disabled format="DD/MM/YYYY" style={{width: "100%"}}/>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Lời khuyên" name="advice">
                                <Input disabled defaultValue="Thoái hóa đốt sống cổ"/>
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item label="Đánh giá của bác sĩ" name="doctorReview">
                                <Input disabled defaultValue="Cần theo dõi thêm, tập vật lý trị liệu"/>
                            </Form.Item>
                        </Col>
                    </Row>

                </Col>

            ),
        },
        {
            key: "6",
            label: "Dịch vụ trị liệu",
            children: (
                <Row gutter={16}>
                    {/* Cột chứa các Form Item */}
                    <Col span={12}>
                        <Form.Item label="Phương pháp trị liệu" name="treatment_method" rules={[{required: true}]}>
                            <Input.TextArea disabled/>
                        </Form.Item>

                        <Form.Item label="Chuyên gia phụ trách" name="doctor">
                            <Input disabled/>
                        </Form.Item>
                    </Col>

                    {/* Cột chứa bảng Table */}
                    <Col span={12}>
                        <Table bordered dataSource={therapyData} columns={therapyColumns} pagination={false}/>
                    </Col>
                </Row>

            ),
        },
    ];
const Onfinish =()=>{
    if (onComplete) {
        onComplete();
    }
}
    return (
        <div>
            <Form

                form={form}
                name="customer-info-form"
                layout="vertical"
                onFinish={() => Onfinish()}

            >
                {/* Thông tin khách hàng */}
                <h2 className="text-xl font-semibold mb-4">Thông tin khách hàng</h2>
                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="fullName"
                            label="Họ tên khách hàng"

                        >
                            <Input disabled/>
                        </Form.Item>
                        <Form.Item
                            name="birthDate"
                            label="Ngày sinh"
                            rules={[{required: true, message: 'Vui lòng chọn ngày sinh!'}]}
                        >
                            <DatePicker disabled format="DD/MM/YYYY" style={{width: '100%'}}/>
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item
                            name="Gender"
                            label="Giới tính"

                        >
                            <Radio.Group disabled>
                                <Radio value="Nam">Nam</Radio>
                                <Radio value="Nữ">Nữ</Radio>
                                <Radio value="Khác">Khác</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                            name="referrer"
                            label="Người tiếp thị"
                        >
                            <Input disabled/>
                        </Form.Item>
                    </Col>

                    <Col span={8}>
                        <Form.Item name="introducerSource" label="Nguồn khách hàng">

                            <Input disabled/>
                        </Form.Item>
                        <Form.List name="introducers">
                            {(fields) => (
                                <>
                                    {fields.map(({key, name}) => (
                                        <Row gutter={16} key={key}>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Người giới thiệu"
                                                    name={[name, "introducer_name"]}
                                                >
                                                    <Input disabled/>
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Chọn mức"
                                                    name={[name, "commission"]}
                                                >
                                                    <Input disabled/>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    ))}
                                </>
                            )}
                        </Form.List>

                    </Col>
                </Row>


                <div className="mb-6">
                    <Collapse defaultActiveKey={["1"]} items={items}/>
                </div>


            </Form>
            <div className="flex justify-end">
                <Button  className={'!bg-[#BD8306] !text-[#fff]'}  onClick={() => Onfinish()}>Hoàn thành</Button>
            </div>
        </div>
    );
};

 export default DetailReportfile;

