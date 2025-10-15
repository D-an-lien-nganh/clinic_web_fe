import React, { useState, useEffect } from "react";
import { Radio, Modal, Table, Input, InputNumber, Select, Button, Row, Collapse, Col, notification } from "antd";
import { CheckOutlined, PlusOutlined, SwapOutlined } from "@ant-design/icons";
import { ColumnsType, ColumnType } from "antd/es/table";
import {
    useGetBillsByIdQuery,
    useEditBillsMutation,
    useCreateSessionServiceMutation,
    usePatchSessionServiceMutation,
    useDeleteSessionServiceMutation
} from "@/api/app_treatment/apiTreatment"

import { useGetServiceListQuery } from "@/api/app_product/apiService";
const { Option } = Select;
const { Panel } = Collapse;
interface ServiceType {
    key: string;
    id?: number;
    name: string;
    price: number;
    unit?: number;
    sessionId: string;
}
interface SessionData {
    id: number;
    session: number;
    service: number;
    service_detail?: {
        id: number;
        name: string;
        unit: number;
        price: string;
    };
    duration?: number;
}
interface ServiceType2 {

    name: string;
    price: number;
    unit?: number;

}
interface RequestId {
    id: string | number;
}
interface ServiceDetail {
    id: number;
    name: string;
    unit: number;
    price: string;
}
interface GroupedDataItem {
    id: number;
    key: string;
    name: string;
    price: string;
    sessionId: number;
    unit: number;
}

interface GroupedData {
    [key: number]: GroupedDataItem[];
}
interface RenderPropscolums3 {
    activeRowKey: string | null;
    handleEditChange: (field: keyof SummaryDataType, value: any) => void;
    currentEdit: Partial<SummaryDataType> | null;
    startEditing: (record: SummaryDataType) => void;
    saveEdit: () => void;
}

interface SummaryDataType {
    id: string;
    name: string;
    price: number;
    unit: number;

}interface TreatmentRequest {
    id: number;
}

// Props của component
interface AddRegimenProps {
    id: number;
    onComplete?: () => void;
}
interface Props {
    groupedData: { [sessionId: string]: ServiceType[] };
    serviceschild: any[]; // dữ liệu danh sách các service con của bạn
    onComplete?: () => void;
}
const AddRegimen = ({ id, onComplete }: { id: number, onComplete?: () => void }) => {
    // Lấy dữ liệu từ API
    const { data } = useGetBillsByIdQuery(id);
    const [editBills, { isLoading, isError, error }] = useEditBillsMutation();
    const [createSessionService] = useCreateSessionServiceMutation();

    const [deleteSessionService] = useDeleteSessionServiceMutation();

    const [updateSessionService] = usePatchSessionServiceMutation();
    const { data: serviceList, isFetching } = useGetServiceListQuery({});
    // Trạng thái
    const [selectedService, setSelectedService] = useState("");


    useEffect(() => {
        if (data?.treatment_request?.length > 0) {
            const initialService = data.treatment_request[0]?.service_name;
            setSelectedService(initialService);



        }
    }, [data]);



    const [tableData, setTableData] = useState<ServiceType[]>([]);
    const [collapseDataSource, setCollapseDataSource] = useState<ServiceType[]>([]);
    const [activeRowKey, setActiveRowKey] = useState<string | null>(null);
    const [currentEdit, setCurrentEdit] = useState<SummaryDataType | null>(null);

    // Dữ liệu dịch vụ con
    const serviceschild = data?.treatment_request?.flatMap((request: any) =>
        request?.service_childs?.map((child: any) => ({
            id: child?.id || "N/A",
            name: child?.name || "Không có dữ liệu",
            price: child?.price || "0",
        })) || []
    );
    const dataSourcess =
        serviceList?.results?.map((record: { id: any }) => ({
            ...record,
            key: record.id,
        })) || [];

    const initialData = data?.treatment_request?.flatMap((request: any) => {

        return request?.treatment_sessions?.flatMap((session: any) => {

            return session?.service_details?.map((detail: any) => {
                // Log giá trị sessionId
                return {
                    key: `${session.id}-${detail?.service?.id}`,
                    sessionId: session.id || "N/A", // Gán giá trị mặc định nếu session.id không tồn tại
                    name: detail?.service?.name || "No data",
                    unit: detail?.service?.unit || "Unknown",
                    price: detail?.service?.price || "0",
                    duration: detail?.duration || 0
                };
            });
        });
    }) || [];

    const onCancel = () => {
        if (onComplete) {
            onComplete();
        }
    }


    // Khởi tạo collapseDataSource
    useEffect(() => {
        setCollapseDataSource(initialData);
    }, [data]);


    const [treatmentRequestIds, setTreatmentRequestIds] = useState<RequestId[]>([]);
    const [extractedData, setExtractedData] = useState<SessionData[]>([]);


    // Hàm xử lý post data



    const getColumns = (sessionId: string): ColumnsType<ServiceType> => [
        {
            title: "Service Name",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: ServiceType) => (
                <Select
                    value={text}
                    onChange={(value: string) => handleSelectChange(record.key, value)}
                    style={{ width: "100%" }}
                >
                    {tableData?.map((service: any) => (
                        <Option key={service.id} value={service.name}>
                            {service.name}
                        </Option>
                    ))}
                </Select>
            ),
        },
        {
            title: "Time",
            dataIndex: "unit",
            key: "unit",
            render: (text: string, record: ServiceType) => (
                <Input
                    value={text}
                    onChange={(e) => handleInputChange(record.key, "unit", e.target.value)}
                />
            ),
        },
        { title: "Price", dataIndex: "price", key: "price" },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: ServiceType) => (
                <Button
                    danger
                    onClick={() => handleDeleteRow(sessionId, record.key, record?.id ?? 0)}
                >
                    Xóa
                </Button>
            ),
        },
    ];
    const handleDeleteRow = (sessionId: string, rowKey: string, serviceId: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa dịch vụ này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            async onOk() {
                try {
                    console.log("log ", serviceId)
                    // 1. Gọi mutation để xóa trên server với id=11
                    await deleteSessionService(serviceId).unwrap();
                } catch (error) {
                    console.error('Lỗi khi xóa:', error);

                }
            },
        });
    };


    const columnss3 = (renderProps: RenderPropscolums3): ColumnsType<SummaryDataType> => [
        {
            title: "ID",
            dataIndex: "key",
            key: "key",
        },
        {
            title: "Tên dịch vụ",
            dataIndex: "name",
            key: "name",
            render: (text: string, record: SummaryDataType, _: number) => {
                const { activeRowKey, handleEditChange, currentEdit } = renderProps;

                // Nếu đang chỉnh sửa dòng này
                if (activeRowKey === record.id) {
                    return (
                        <Select
                            value={currentEdit?.name || text} // Giá trị mặc định là name hiện tại
                            style={{ width: "100%" }}
                            onChange={(value) => {
                                // Tìm dịch vụ được chọn trong dataSourcess
                                const selectedService = dataSourcess.find(
                                    (service: any) => service.name === value
                                );
                                if (selectedService) {
                                    // Cập nhật cả name và price
                                    handleEditChange("name", selectedService.name);
                                    handleEditChange("price", selectedService.price);
                                }
                            }}
                            options={dataSourcess.map((service: any) => ({
                                label: service.name || "Không có tên", // Hiển thị tên dịch vụ
                                value: service.name, // Giá trị của option là name
                            }))}
                        />
                    );
                }
                // Nếu không chỉnh sửa, hiển thị text bình thường
                return text;
            },
        },
        {
            title: "Giá (VNĐ)",
            dataIndex: "price",
            key: "price",
            render: (text: number, record: SummaryDataType, _: number) => {
                const { activeRowKey, handleEditChange, currentEdit } = renderProps;
                return activeRowKey === record.id ? (
                    <InputNumber
                        value={currentEdit?.price} // Giá sẽ tự động cập nhật khi chọn dịch vụ
                        onChange={(value) => handleEditChange("price", value)}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
                    />
                ) : (
                    `${text.toLocaleString("vi-VN")} VNĐ`
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            render: (_: any, record: SummaryDataType, __: number) => {
                const { activeRowKey, startEditing, saveEdit } = renderProps;
                return activeRowKey === record.id ? (
                    <CheckOutlined
                        style={{ fontSize: 24, color: "#52c41a", cursor: "pointer" }}
                        onClick={saveEdit}
                    />
                ) : (
                    <SwapOutlined
                        style={{ fontSize: 24, color: "#1890ff", cursor: "pointer" }}
                        onClick={() => startEditing(record)}
                    />
                );
            },
        },
    ];
    // Xử lý thay đổi Radio
    const handleServiceChange = (e: any) => {
        const serviceName = e.target.value;
        setSelectedService(serviceName);

        // 1) Lọc dữ liệu cho tableData (giống code cũ)
        const filteredTableData = data?.treatment_request
            ?.filter((request: any) => request.service_name === serviceName)
            .flatMap((request: any) =>
                request?.service_childs?.map((child: any) => ({
                    key: child?.id?.toString() || "N/A",
                    name: child?.name || "Không có dữ liệu",
                    price: parseFloat(child?.price) || 0,
                    duration: request?.service_details?.[0]?.duration || 0,
                }))
            ) || [];
        setTableData(filteredTableData);

        // 2) Tạo dữ liệu cho Collapse (có đủ buổi, kể cả buổi không có service)
        const allSessions: any[] = [];
        data?.treatment_request
            ?.filter((request: any) => request.service_name === serviceName)
            .forEach((request: any) => {
                request?.treatment_sessions?.forEach((session: any) => {
                    // Nếu không có service_details hoặc mảng trống
                    if (!session?.service_details?.length) {
                        // Tạo 1 "dòng trống" để buổi vẫn hiển thị
                        allSessions.push({
                            key: `session-${session.id}-placeholder`,
                            sessionId: session?.id ?? `session-${Math.random()}`,
                            id: "",
                            name: "",
                            unit: "",
                            price: "",
                        });
                    } else {
                        // Nếu có service_details, tạo row bình thường
                        session?.service_details?.forEach((detail: any) => {
                            allSessions.push({
                                key: `${session.id}-${detail?.service?.id}`,
                                sessionId: session?.id ?? `session-${Math.random()}`,
                                id: detail?.service?.id,
                                name: detail?.service?.name || "No data",
                                unit: detail?.service?.unit || "Unknown",
                                price: detail?.service?.price || "0",
                            });
                        });
                    }
                });
            });

        setCollapseDataSource(allSessions);
    };

    const saveEdit = async () => {
        try {
            // Update local state (if needed)
            setTableData((prev) =>
                prev.map((item) => {
                    if (item.key === activeRowKey && currentEdit) {
                        return {
                            ...item,
                            ...currentEdit,
                            id: Number(currentEdit.id) || item.id,
                        };
                    }
                    return item;
                })
            );


            const updatedData = [
                {
                    id: currentEdit?.id || "",
                    name: currentEdit?.name || "",
                    price: currentEdit?.price || 0,
                    unit: currentEdit?.unit || 0,
                },
            ];

            for (const request of treatmentRequestIds) {
                const postData = {
                    id: request.id || 0,
                    treatment_request: request.id || 0,
                    service_details: [] as SessionData[],
                    is_done: false,
                };

                const sessionData = extractedData[0];
                const sessionId = sessionData?.session || 0;

                const body = {
                    id: postData.id,
                    treatment_request: postData.treatment_request,
                    service_details: updatedData,
                    session: sessionId,
                    service: sessionData?.service || 0,

                };



                // Call mutation
                // const response = await editChildService({
                //     id: dataapi, // ID of the Bill
                //     data: body,
                // });
                //
                // console.log("Bill updated successfully:", response);
            }
        } catch (error) {
            console.error("Error updating bill:", error);
        }
    };
    //
    // useEffect(() => {
    //     console.log("useEffect chạy với Data:", data, "Selected Service:", selectedService);
    //
    //     const treatmentRequestIdsTemp: RequestId[] = [];
    //     const extractedDataTemp: SessionData[] = [];
    //     const allSessions: ServiceType[] = [];
    //
    //     // Duyệt qua treatment_request
    //     data?.treatment_request?.forEach((request: any) => {
    //         // 1. Lưu id của treatment_request
    //         const requestId = { id: request?.id };
    //         treatmentRequestIdsTemp.push(requestId);
    //         console.log("Treatment Request ID:", requestId);
    //
    //         // 2. Xử lý khi service_name khớp với selectedService
    //         if (request?.service_name === selectedService) {
    //             request?.treatment_sessions?.forEach((session: any) => {
    //                 if (session?.service_details?.length > 0) {
    //                     // 3. Lấy dữ liệu từ service_details
    //                     session.service_details.forEach((detail: any) => {
    //                         const sessionData = {
    //                             id: detail?.id,
    //                             session: detail?.session,
    //                             service: detail?.service,
    //                         };
    //                         extractedDataTemp.push(sessionData);
    //                         console.log("Pushed Session Data:", sessionData);
    //
    //                         // 4. Thêm vào allSessions khi có service_details
    //                         allSessions.push({
    //                             key: `${session.id}-${detail?.service}`,
    //                             sessionId: session?.id ?? `session-${Math.random()}`,
    //                             id: detail?.service,
    //                             name: detail?.service_detail?.name || "No data",
    //                             unit: detail?.service_detail?.unit || "Unknown",
    //                             price: detail?.service_detail?.price || "0",
    //                         });
    //                     });
    //                 } else {
    //                     // 5. Thêm placeholder khi không có service_details
    //                     allSessions.push({
    //                         key: `session-${session.id}-placeholder`,
    //                         sessionId: session?.id ?? `session-${Math.random()}`,
    //                         id: 0,
    //                         name: "",
    //                         unit: 0,
    //                         price: 0,
    //                     });
    //                 }
    //             });
    //         }
    //     });
    //
    //
    //
    //     // Cập nhật state (chỉ cập nhật extractedData nếu có dữ liệu)
    //     if (extractedDataTemp.length > 0) {
    //         setExtractedData(extractedDataTemp);
    //     }
    //     setTreatmentRequestIds(treatmentRequestIdsTemp);
    //     setCollapseDataSource(allSessions);
    // }, [data, selectedService]);

    useEffect(() => {
        console.log("useEffect chạy với Data:", data, "Selected Service:", selectedService);

        const treatmentRequestIdsTemp: RequestId[] = [];
        const extractedDataTemp: SessionData[] = [];
        const allSessions: ServiceType[] = [];

        data?.treatment_request?.forEach((request: any) => {
            const requestId = { id: request?.id };
            treatmentRequestIdsTemp.push(requestId);

            if (request?.service_name === selectedService) {
                request?.treatment_sessions?.forEach((session: any) => {
                    if (session?.service_details?.length > 0) {
                        session.service_details.forEach((detail: any) => {
                            const sessionData = {
                                id: detail?.id, // id=11 ở đây
                                session: detail?.session,
                                service: detail?.service,
                                service_detail: detail?.service_detail,
                                duration: detail?.duration,
                            };
                            extractedDataTemp.push(sessionData);

                            allSessions.push({
                                key: `${session.id}-${detail?.service}`,
                                sessionId: session?.id ?? `session-${Math.random()}`,
                                id: detail?.id, // id=11
                                name: detail?.service_detail?.name || "No data",
                                unit: detail?.service_detail?.unit || "Unknown",
                                price: detail?.service_detail?.price || "0",
                            });
                        });
                    } else {
                        allSessions.push({
                            key: `session-${session.id}-placeholder`,
                            sessionId: session?.id ?? `session-${Math.random()}`,
                            id: 0,
                            name: "",
                            unit: 0,
                            price: 0,
                        });
                    }
                });
            }
        });

        if (extractedDataTemp.length > 0) {
            setExtractedData(extractedDataTemp);
        }
        setTreatmentRequestIds(treatmentRequestIdsTemp);
        setCollapseDataSource(allSessions);
    }, [data, selectedService]);

    // useEffect để log state sau khi cập nhật
    useEffect(() => {

    }, [extractedData]);

    // Nhóm dữ liệu theo sessionId
    const groupedData = collapseDataSource.reduce(
        (acc: Record<string, ServiceType[]>, item) => {
            if (!acc[item.sessionId]) {
                acc[item.sessionId] = [];
            }
            acc[item.sessionId].push(item);
            return acc;
        },
        {}
    );
    // Xử lý chỉnh sửa tableData
    const startEditing = (record: SummaryDataType) => {
        setActiveRowKey(record.id);
        setCurrentEdit({ ...record });
        console.log("startEditing:", { activeRowKey: record.id, currentEdit: { ...record } });
    };

    const handleEditChange = (field: keyof SummaryDataType, value: any) => {
        if (currentEdit) {
            setCurrentEdit({ ...currentEdit, [field]: value });
        }
    };
    const dataapi = id;


    // Xử lý collapseDataSource
    const handleSelectChange = (key: string, value: string) => {
        const selectedService = serviceschild?.find((service: any) => service.name === value);
        if (selectedService) {
            setCollapseDataSource((prevData) =>
                prevData.map((item) =>
                    item.key === key ? { ...item, name: selectedService.name, price: selectedService.price } : item
                )
            );
        }
    };

    const handleInputChange = (key: string, field: keyof ServiceType, value: string | number) => {
        setCollapseDataSource((prevData) =>
            prevData.map((item) => (item.key === key ? { ...item, [field]: value } : item))
        );
    };

    const handleAddRow = (sessionId: string) => {
        const newData: ServiceType = {
            key: `${Date.now()}`,
            sessionId: sessionId,  // Phải gắn sessionId vào đây
            name: "",
            unit: 0,
            price: 0,
        };

        setCollapseDataSource((prev: any) => {
            return [...prev, newData];
        });
    };


    // Truyền props cho cột tableData
    const renderProps = {
        activeRowKey,
        handleEditChange,
        currentEdit,
        startEditing,
        saveEdit,
    };
    const renderProps2: RenderPropscolums3 = {
        activeRowKey,
        currentEdit,
        handleEditChange: (field, value) => {
            setCurrentEdit((prev) => (prev ? { ...prev, [field]: value } : prev));
            console.log(`Field: ${field}, Value: ${value}`);
        },
        startEditing: (record) => {
            setActiveRowKey(record.id);
            setCurrentEdit({ ...record });
            console.log("Start editing:", record);
        },
        saveEdit: () => {
            console.log("Save edit", currentEdit);
            setActiveRowKey(null);  // Tắt chế độ chỉnh sửa
            setCurrentEdit(null);
        },
    };
    let sessionIndex = 1; // Bắt đầu từ Buổi 1

    const [isPosting, setIsPosting] = useState(false);

    const handlePostData = async () => {
        if (isPosting) return; // Ngăn gọi API nhiều lần

        setIsPosting(true); // Đánh dấu đang gọi API

        try {
            for (const request of treatmentRequestIds) {
                const postData = {
                    id: request.id || 0,
                    treatment_request: request.id || 0,
                    service_details: [] as ServiceType2[],
                    is_done: false,
                };

                for (const sessionData of extractedData) {
                    const sessionId = sessionData?.session || 0;
                    console.log("Session ID:", sessionId);

                    // Transform groupedData thành service_details
                    const transformed = Object.entries(groupedData).reduce((acc: ServiceType2[], [key, arr]) => {
                        if (arr.length > 0) {
                            const newItems = arr.filter(item => item.name).map(item => ({
                                name: item.name,
                                unit: item.unit,
                                price: item.price,
                            }));
                            return [...acc, ...newItems];
                        }
                        return acc;
                    }, [] as ServiceType2[]);

                    const body = {
                        id: sessionData.id, // Dùng id từ sessionData
                        treatment_request: postData.treatment_request,
                        service_details: transformed,
                        session: sessionId,
                        service: sessionData?.service || 0,
                        is_done: postData.is_done,
                    };

                    // Kiểm tra xem có id, session, và service không
                    const hasIdSessionService = sessionData.id && sessionData.session && sessionData.service;

                    let result;
                    if (hasIdSessionService) {
                        // PATCH nếu có id, session, và service
                        result = await updateSessionService(body).unwrap();
                        console.log("PATCH API Response:", result);
                    } else {
                        // POST nếu thiếu bất kỳ giá trị nào trong id, session, service
                        result = await createSessionService(body).unwrap();
                        console.log("POST API Response:", result);
                    }
                }
            }
            if (onComplete) onComplete();
            notification.success({
                message: "Cập nhật thành công!",
                placement: "bottomRight",
            });
        } catch (error) {
            console.error("Error processing data:", error);
            notification.error({
                message: "Xử lý thất bại!",
                placement: "bottomRight",
            });

        } finally {
            setIsPosting(false); // Đánh dấu hoàn thành
        }
    };
    const transformedData: SummaryDataType[] = tableData.map(item => ({
        id: String(item.id ?? ''),
        name: item.name,
        price: item.price,
        unit: item.unit ?? 0,
    }));
    return (
        <div className={'flex flex-col'}>
            {/* Radio Group */}
            <div style={{ marginBottom: 16 }}>
                <Radio.Group onChange={handleServiceChange} value={selectedService}>
                    {data?.treatment_request?.map((request: any) => (
                        <Radio key={request.id} value={request.service_name}>
                            <span className={'font-[700] size-[15px]'}>{request.service_name}</span>
                        </Radio>
                    ))}
                </Radio.Group>
            </div>

            {/* Bảng tableData */}


            <Row gutter={24} style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <Col span={14}>
                    <div className={'flex flex-col'}>
                        <div className={'flex justify-end'}>
                            <p className={'text-[15px] font-[700]'}>Tổng tiền là : {data?.total_amount_real ?? 0}</p>
                        </div>


                        <Collapse defaultActiveKey={Object.keys(groupedData)}>
                            {Object.keys(groupedData).map((sessionId) => {
                                const currentIndex = sessionIndex; // Lưu lại index hiện tại
                                sessionIndex += 1; // Mỗi lần map, tăng thêm 1 buổi

                                return (
                                    <Panel header={`Buổi ${currentIndex}`} key={sessionId}>
                                        <Table
                                            bordered
                                            columns={getColumns(sessionId)}
                                            dataSource={groupedData[sessionId]}
                                            pagination={false}
                                            footer={() => (
                                                <div className="flex justify-center items-center">
                                                    <PlusOutlined
                                                        onClick={() => handleAddRow(sessionId)}
                                                        style={{ fontSize: '20px', cursor: 'pointer' }}
                                                    />
                                                </div>
                                            )}
                                        />
                                    </Panel>
                                );
                            })}
                        </Collapse>


                    </div>
                </Col>

                <Col span={7}>
                    <div className={'flex flex-col'}>
                        <Table
                            bordered
                            columns={columnss3(renderProps2).map((col: ColumnType<SummaryDataType>) => ({
                                ...col,
                                render: col.render
                                    ? (text: any, record: SummaryDataType, index: number) => col.render!(text, record, index)
                                    : (text: any) => text,
                            }))}
                            dataSource={transformedData}
                        />
                        <p className={'text-[15px] font-[700]'}>Tổng tiền là : {data?.total_amount_real ?? 0}</p>
                    </div>
                </Col>
            </Row>

            <div className="flex justify-end gap-4">
                <Button onClick={() => onCancel()}>Hủy</Button>

                <Button className={'!bg-[#BD8306] !text-[#fff]'} loading={isLoading} onClick={() => handlePostData()}>Hoàn thành</Button>
            </div>
        </div>
    );
};

export default AddRegimen;