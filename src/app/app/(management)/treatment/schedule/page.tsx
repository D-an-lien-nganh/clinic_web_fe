import React from 'react'
import Schedule from '@/views/business/treatment/schedule/Schedule'
import BreadcrumbFunction from '@/components/Breadcrumb/BreadcrumbFunction'

export default function page() {
    return (
        <>
            <BreadcrumbFunction functionName="Quản lý điều trị" title="Lịch hẹn" />
            <Schedule />
        </>
    )
}
