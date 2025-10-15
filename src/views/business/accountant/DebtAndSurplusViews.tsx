"use client"
import React, { useState } from 'react'
import { Tabs } from 'antd';
import CustomerAndSupplierStatistics from './CustomerAndSupplierStatistics';
import CustomerAndSupplierStatisticsDebt from './CustomerAndSupplierStatisticsDebt';
import Supplier from './Supplier';

export default function DebtAndSurplusViews({ type, }: { type: string }) {
    const [activeTabs, setActiveTabs] = useState<string>("customer");

    const items: any = [
        ...(type === "debt") ?
            [
                {
                    key: "customer",
                    label: `Thống kê công nợ khách hàng`,
                    children: (
                        <CustomerAndSupplierStatisticsDebt
                        />
                    ),
                },
            ] : [
                {

                    key: "supplier",
                    children: (
                        <Supplier />
                    )
                }
            ]
    ];

    return (
        <div className="px-2">
            <Tabs
                className="mt-6"
                defaultActiveKey={activeTabs}
                items={items}
                onChange={(key) => setActiveTabs(key)}
            />
        </div>
    );
};
