import React, { useState } from 'react';
import { Button, Modal,Space, Table, Tag ,Input} from 'antd';
import type { TableProps } from 'antd';

import {useGetSupplierQuery} from "@/api/app_product/apiService"
interface RelatedProduct {
    id: number;
    code: string;
    name: string;
    description: string;
    effect: string;
    origin: string;
    sell_price: string;
    unit: number;
    unit_name: string;
}
const RelaterdProduct = ({id}:{id:number}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerms, setSearchTerms] = useState({
        code: "",

    });

    const {data, error, isLoading} = useGetSupplierQuery(id)
    const datasupplier = data?.related_products ?? []; // Đảm bảo luôn có mảng, tránh lỗi undefined

    if (isLoading) {
        return <p>Đang tải dữ liệu...</p>;
    }

    if (error) {
        return <p>Có lỗi xảy ra khi lấy dữ liệu.</p>;
    }
    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    // Interface cho sản phẩm liên quan (related_products)


// Interface cho nhà cung cấp (Supplier)
    interface Supplier {
        id: number;
        user: number;
        code: string;
        name: string;
        MST: string;
        contact_person: string;
        mobile: string;
        email: string;
        address: string;
        related_products: RelatedProduct[]; // Danh sách sản phẩm liên quan
    }




    const allSearchTermsEmpty = Object.values(searchTerms).every(  (term) => term === "");

    const filteredEmployeeData = allSearchTermsEmpty
        ? datasupplier
        : datasupplier.filter((item: RelatedProduct) =>
            item?.code?.toLowerCase().includes(searchTerms.code.toLowerCase())
        );





    const columns: TableProps<RelatedProduct>['columns'] = [
        {
            title: 'Mã',
            dataIndex: 'code',
            key: 'name',
            align: 'center',
            render: (text) => <a>{text}</a>,
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
        },
        {
            title: 'Miêu tả',
            dataIndex: 'description',
            key: 'description',
            align: 'center',
        },
        {
            title: 'Nguồn gốc',
            dataIndex: 'origin',
            key: 'origin',
            width:159,
            align: 'center',
        }
        ,{
            title: 'Giá bán',
            dataIndex: 'sell_price',
            key: 'sell_price',
            align: 'center',
        },{
            title: 'Đơn vị',
            dataIndex: 'unit',
            key: 'unit', width:159,
            align: 'center',
        },{
            title: 'Tên đơn vị',
            dataIndex: 'unit_name', width:159,
            key: 'unit_name',
            align: 'center',
        }
    ];

    return (
        <>
            <Button  type="dashed" onClick={showModal}>
                Xem chi tiết
            </Button>
            <Modal width={1200} title="Chi tiết" open={isModalOpen}  onCancel={handleCancel}>
                {datasupplier.length > 0 ? (
                    <div>
                        <Input
                            placeholder="Tìm theo mã..."
                            className="!w-[600px]"
                            value={searchTerms.code}
                            onChange={(e) => setSearchTerms((prev) => ({ ...prev, code: e.target.value }))}
                        />

                    <Table<RelatedProduct>
                        columns={columns}
                        dataSource={filteredEmployeeData}
                        rowKey="id"
                        />

                    </div>
                ) : (
                    <p className={'text-center font-[700] text-[15px]'}>Chưa có sản phẩm liên quan</p>
                )}

            </Modal>
        </>
    );
};

export default RelaterdProduct;