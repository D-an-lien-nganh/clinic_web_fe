import { notification } from "antd";

export const handleAddAndUpdate = async ({
  title,
  form,
  setOpen,
  addAndUpdateItem,
  isEdit,
}: {
  title: string;
  form?: any;
  setOpen?: (value: boolean) => void;
  addAndUpdateItem: () => Promise<any>;
  isEdit?: boolean;
}) => {
  try {
    await addAndUpdateItem();
    notification.success({
      message: isEdit ? `Cập nhật thông tin` : `Tạo mới thông tin`,
      description: `${isEdit ? "Cập nhật" : "Tạo"} ${title} thành công!`,
      placement: "bottomRight",
    });
    form?.resetFields();
    if (setOpen) setOpen(false);
  } catch (error: any) {
    // Sửa đổi cách truy cập error message
    const errorMessage =
      error?.data?.message || // Backend trả về message trong data
      error?.data?.detail || // Một số API trả về detail
      error?.message || // JavaScript error message
      `Có lỗi xảy ra khi ${isEdit ? "cập nhật" : "tạo mới"}!`; // Fallback message

    notification.error({
      message: isEdit ? `Cập nhật thông tin` : `Tạo mới thông tin`,
      description: errorMessage,
      placement: "bottomRight",
      duration: 3,
    });
  }
};
