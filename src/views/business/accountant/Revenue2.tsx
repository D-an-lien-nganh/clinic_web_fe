"use client";
import React, { useMemo, useState } from "react";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { Table, Button, Form, DatePicker, Input, Alert, Spin } from "antd";
import { BsFiletypePdf, BsFiletypeXls } from "react-icons/bs";
// ✅ dùng endpoint mới tổng hợp theo KH
import { useGetBillCustomersSummaryQuery } from "@/api/app_treatment/apiTreatment";
import CustomerBillsModal from "./CustomerBillsModal";

const { RangePicker } = DatePicker;

type RowType = {
    key: React.Key;
    ma_kh: string | null;
    ho_ten: string | null;
    cac_loai_dich_vu_su_dung: string[]; // ['phác đồ','đơn thuốc','xuất vật tư']
    so_tien_da_thanh_toan: number; // convert từ string Decimal → number
    lan_thanh_toan_gan_nhat: string | null; // ISO
};

const fmtVND = (n: number | string | null | undefined) => {
    const num = typeof n === "string" ? parseFloat(n) : n || 0;
    return Number(num).toLocaleString("vi-VN");
};




export default function RevenueByCustomer() {
    const [form] = Form.useForm();
    // Phần tổng hợp KH thường không cần phân trang server → dùng client pagination
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const startDate = form.getFieldValue("dateRange")?.[0]?.format("YYYY-MM-DD");
    const endDate = form.getFieldValue("dateRange")?.[1]?.format("YYYY-MM-DD");
    const customer = form.getFieldValue("customer");

    // ✅ gọi API mới — có thể truyền thêm paymentStart/paymentEnd nếu muốn lọc theo ngày thanh toán
    const {
        data: summaryData,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useGetBillCustomersSummaryQuery(
        {
            startDate,
            endDate,
            // customer: customer, // truyền nếu backend hỗ trợ lọc theo tên/ID KH
            paymentStart: startDate,
            paymentEnd: endDate,
            customer,
        },
        {
            // bỏ qua call khi chưa chọn khoảng thời gian (nếu muốn)
            // skip: !startDate || !endDate,
        }
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [activeCustomer, setActiveCustomer] = useState<{
        code?: string;
        name?: string;
    }>({});

    const openDetail = (row: RowType) => {
        setActiveCustomer({
            code: row.ma_kh ?? undefined,
            name: row.ho_ten ?? undefined,
        });
        setModalOpen(true);
    };

    // Chuẩn hóa data: backend có thể trả dạng { results: [...], total_revenue: "xxx" } hoặc thuần mảng
    const rawRows: any[] = Array.isArray(summaryData)
        ? summaryData
        : Array.isArray((summaryData as any)?.results)
            ? (summaryData as any).results
            : [];

    const dataSource: RowType[] = rawRows.map((r, idx) => ({
        key: r.ma_kh ?? r.ho_ten ?? idx,
        ma_kh: r.ma_kh ?? null,
        ho_ten: r.ho_ten ?? null,
        cac_loai_dich_vu_su_dung: Array.isArray(r.cac_loai_dich_vu_su_dung)
            ? r.cac_loai_dich_vu_su_dung
            : [],
        so_tien_da_thanh_toan: r.so_tien_da_thanh_toan
            ? parseFloat(String(r.so_tien_da_thanh_toan))
            : 0,
        lan_thanh_toan_gan_nhat: r.lan_thanh_toan_gan_nhat ?? null,
    }));

    // ✅ Tổng doanh thu lấy từ API (nếu có), fallback tính client
    const totalRevenueFromApi =
        (summaryData as any)?.total_revenue ?? (summaryData as any)?.totalRevenue;

    const totalRevenue =
        totalRevenueFromApi !== undefined && totalRevenueFromApi !== null
            ? parseFloat(String(totalRevenueFromApi))
            : dataSource.reduce(
                (s, r) => s + (Number(r.so_tien_da_thanh_toan) || 0),
                0
            );

    const columns: ColumnsType<RowType> = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_t, _r, index) =>
                (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        { title: "Mã KH", dataIndex: "ma_kh", align: "center" },
        {
            title: "Họ và tên",
            dataIndex: "ho_ten",
            align: "center",
            render: (_text, row) =>
                row.ho_ten ? <a onClick={() => openDetail(row)}>{row.ho_ten}</a> : "—",
        },
        {
            title: "Các loại dịch vụ sử dụng",
            dataIndex: "cac_loai_dich_vu_su_dung",
            align: "center",
            render: (arr: string[]) => (arr && arr.length ? arr.join(", ") : "—"),
        },
        {
            title: "Số tiền đã thanh toán",
            dataIndex: "so_tien_da_thanh_toan",
            align: "center",
            render: (v: number) => fmtVND(v),
            sorter: (a, b) =>
                (a.so_tien_da_thanh_toan || 0) - (b.so_tien_da_thanh_toan || 0),
        },
        {
            title: "Lần thanh toán gần nhất",
            dataIndex: "lan_thanh_toan_gan_nhat",
            align: "center",
            render: (iso?: string | null) =>
                iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : "—",
            sorter: (a, b) =>
                dayjs(a.lan_thanh_toan_gan_nhat || 0).valueOf() -
                dayjs(b.lan_thanh_toan_gan_nhat || 0).valueOf(),
        },
    ];

    const handleTableChange = (newPagination: any) =>
        setPagination(newPagination);

    const onFinish = () => {
        setPagination((p) => ({ ...p, current: 1 }));
        refetch();
    };

    if (error) {
        return (
            <div className="px-6">
                <Alert
                    type="error"
                    message={
                        "status" in error
                            ? (error as any).status
                            : (error as any).message || "Có lỗi khi tải dữ liệu"
                    }
                />
            </div>
        );
    }

    // xuất file excel
    const handleExportExcel = () => {
        // chỉ lấy cột hiển thị (columns)
        const headers = columns.map(col => col.title?.toString() || "");

        // lấy dữ liệu từ dataSource (trang hiện tại)
        const currentPageData = dataSource.slice(
            (pagination.current - 1) * pagination.pageSize,
            pagination.current * pagination.pageSize
        );

        const rows = currentPageData.map((row, idx) => [
            (pagination.current - 1) * pagination.pageSize + idx + 1, // STT
            row.ma_kh || "—",
            row.ho_ten || "—",
            row.cac_loai_dich_vu_su_dung?.join(", ") || "—",
            row.so_tien_da_thanh_toan ? fmtVND(row.so_tien_da_thanh_toan) : "0",
            row.lan_thanh_toan_gan_nhat
                ? dayjs(row.lan_thanh_toan_gan_nhat).format("DD/MM/YYYY HH:mm")
                : "—",
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), "data.xlsx");
    };


    return (
        <div className="px-4">
            <div className="md:flex w-full gap-2 flex-1 items-center mb-2 shadow-md">
                <Form
                    className="form-wrapper !flex !flex-1 !w-full"
                    form={form}
                    onFinish={onFinish}
                >
                    <div className="p-2 flex flex-wrap gap-2 w-full">
                        <Form.Item
                            className="form-item w-full sm:w-auto !mb-0"
                            name="dateRange"
                            rules={[{ required: false }]}
                        >
                            <RangePicker
                                placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                                className="!w-full"
                            />
                        </Form.Item>

                        <Form.Item
                            name="customer"
                            className="form-item !mb-0 w-full sm:w-[220px] shrink-0"
                        >
                            <Input
                                placeholder="Tên khách hàng"
                                allowClear
                                className="!w-full"
                            />
                        </Form.Item>

                        <div className="flex items-center px-2 text-sm font-medium">
                            <span>Tổng doanh thu:&nbsp;</span>
                            <span className="text-blue-600">{fmtVND(totalRevenue)}</span>
                        </div>

                        <Button
                            className="w-full sm:w-auto"
                            type="primary"
                            htmlType="submit"
                            loading={isFetching}
                        >
                            Lọc
                        </Button>
                    </div>
                </Form>

                <div className="mt-2 sm:mt-0">
                    {/* <Button
                        type="dashed"
                        className="border-blue-500 text-blue-500 mr-2"
                        icon={<BsFiletypePdf className="text-blue-500" />}
                        onClick={handleExportPDF}
                    >
                        Xuất PDF
                    </Button> */}
                    <Button
                        type="dashed"
                        className="border-blue-500 text-blue-500"
                        icon={<BsFiletypeXls className="text-blue-500" />}
                        onClick={handleExportExcel}
                    >
                        Xuất Excel
                    </Button>

                </div>
            </div>

            <div className="overflow-x-auto">
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    onChange={handleTableChange}
                    bordered
                    loading={isLoading}
                    pagination={{
                        ...pagination,
                        total: dataSource.length,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50", "100", "200"],
                    }}
                />
            </div>

            <CustomerBillsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                customerCode={activeCustomer.code} // ưu tiên dùng ma_kh đã có sẵn từ summary
                // customerId={...}                          // nếu bạn có thêm id ở summary thì truyền vào đây
                startDate={startDate}
                endDate={endDate}
                customerName={activeCustomer.name}
            />
        </div>
    );
}
