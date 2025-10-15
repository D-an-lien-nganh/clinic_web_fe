"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { useGetSourceListQuery } from "@/api/app_home/apiConfiguration";
import { apiMarketing } from "@/api/app_customer/apiMarketing";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Prefill nguồn đang chọn trong form KH (nếu có). */
  initialSourceId?: number;
  /** Nếu true sẽ khoá chọn nguồn (dùng khi mở từ form KH đã chọn nguồn). */
  lockSource?: boolean;
  /** Trả về actor vừa tạo để parent set lại form / refetch danh sách. */
  onCreated?: (created: any) => void;
};

const QuickAddIntroducerModal: React.FC<Props> = ({
  open,
  onClose,
  initialSourceId,
  lockSource = false,
  onCreated,
}) => {
  const [form] = Form.useForm();

  // Lấy danh sách nguồn (giống phần khách hàng)
  const {
    data: sourceData,
    isLoading: loadingSource,
  } = useGetSourceListQuery(undefined);

  // Lấy mutation tạo actor
  const { useCreateLeadSourceActorMutation } = apiMarketing;
  const [createActor, { isLoading }] = useCreateLeadSourceActorMutation();

  // Reset & prefill khi mở modal
  useEffect(() => {
    if (open) {
      form.resetFields();
      if (initialSourceId) {
        form.setFieldsValue({ source: initialSourceId });
      }
    }
  }, [open, initialSourceId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Map field theo API: external_id là “mã định danh”
      const payload = {
        source: values.source as number,
        name: values.name as string,
        note: values.note as string | undefined,
        external_id: values.external_id as string | undefined,
      };
      const created = await createActor(payload).unwrap();
      message.success("Đã thêm người giới thiệu");
      onCreated?.(created);
      onClose();
    } catch {
      /* antd/unwrap sẽ hiển thị lỗi phù hợp */
    }
  };

  const sourceOptions =
    sourceData?.results?.map((s: any) => ({ value: s.id, label: s.name })) ??
    [];

  return (
    <Modal
      open={open}
      title="Thêm người giới thiệu"
      onCancel={onClose}
      destroyOnClose
      width={520}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={isLoading} onClick={handleSubmit}>
            Lưu
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="source"
          label="Nguồn"
          rules={[{ required: true, message: "Vui lòng chọn nguồn" }]}
          initialValue={initialSourceId}
        >
          <Select
            placeholder="Chọn nguồn"
            loading={loadingSource}
            options={sourceOptions}
            disabled={lockSource && !!initialSourceId}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="Tên người giới thiệu"
          rules={[{ required: true, message: "Vui lòng nhập tên" }]}
        >
          <Input placeholder="VD: Nguyễn Văn A" />
        </Form.Item>

        <Form.Item name="external_id" label="Mã định danh (không bắt buộc)">
          <Input placeholder="VD: EXT-123 hoặc số điện thoại" />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={3} placeholder="Ghi chú (tuỳ chọn)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuickAddIntroducerModal;
