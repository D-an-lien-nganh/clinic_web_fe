
import React from "react"
import { Button, notification, Popconfirm } from "antd"

interface PropsType {
    id: number;
    title: string;
    useDeleteMutation: () => any;
    onDeleted?: () => void;
}

export default function DeleteConfirm({
    id,
    title,
    useDeleteMutation,
    onDeleted
}: PropsType) {
    const [deleteItem, { isLoading }] = useDeleteMutation();

    const onDelete = async (id: number) => {
        try {
            await deleteItem(id).unwrap();
            onDeleted?.();
            notification.success({
                message: `Xóa ${title.toLowerCase()} thành công`,
                placement: "bottomRight",
                className: "h-16",
            });
        } catch (error) {
            notification.error({
                message: `Xóa ${title.toLowerCase()} thất bại`,
                placement: "bottomRight",
                className: "h-16",
            });
        }
    }

    return (
        <Popconfirm
            title={`Xóa ${title}?`}
            description={`Bạn có chắc chắn muốn xóa ${title} này?`}
            onConfirm={() => onDelete(id)}
            okText="Xác nhận"
            cancelText="Hủy"
            onCancel={() => { }}
            placement="left"
            okButtonProps={{ loading: isLoading }}
        >
            <Button danger className="max-sm:hidden" size='small'>
                Xóa
            </Button>
            <div className="sm:hidden text-center">Xóa</div>
        </Popconfirm>
    )
}