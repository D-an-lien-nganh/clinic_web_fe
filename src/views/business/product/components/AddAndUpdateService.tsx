"use client";

import React, { useEffect, useMemo, useState } from "react";
import { RiDeleteBin5Line } from "react-icons/ri";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  notification,
  Row,
  Select,
  Space,
  Tooltip,
} from "antd";

import { useGetTreatmentListQuery } from "@/api/app_home/apiConfiguration";
import {
  useCreateServiceMutation,
  useEditServiceMutation,
  useGetAllTechnicalSettingListQuery,
  useGetServiceQuery,
} from "@/api/app_product/apiService";
import { generateRandomCode, normalizeVN } from "@/utils/convert";

const { Option } = Select;

interface ServicePackage {
  key: number;
  treatment_package: number | null;
  duration: string; // phút
  price: string; // nhập dạng text, sẽ parse khi submit
}

type ServiceType = "TLCB" | "TLDS";

interface TechniqueItem {
  id: number;
  name: string;
  // BE có thể dùng 1 trong các trường sau, ưu tiên 'type'
  type?: ServiceType;
  type_code?: ServiceType;
  category?: ServiceType;
}

export default function AddAndUpdateService({
  id,
  title,
  edit,
  refetch,
  readOnly = false,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: {
  id?: number;
  title?: string;
  edit?: boolean;
  refetch?: () => void;
  readOnly?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [form] = Form.useForm();
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalModalOpen;

  // state packages
  const [packages, setPackages] = useState<ServicePackage[]>([
    { key: Date.now(), treatment_package: null, duration: "", price: "" },
  ]);

  // 👉 NEW: lưu loại trị liệu đã chọn để khóa/ mở & lọc kỹ thuật
  const [selectedType, setSelectedType] = useState<ServiceType | undefined>(undefined);

  // queries (chỉ fetch khi modal mở để tối ưu)
  const { data: serviceId } = useGetServiceQuery(id!, { skip: !id || !isModalOpen });
  const { data: treatmentList } = useGetTreatmentListQuery(undefined, { skip: !isModalOpen });
  const { data: techniqueList } = useGetAllTechnicalSettingListQuery(undefined, {
    skip: !isModalOpen,
  });

  const [createService] = useCreateServiceMutation();
  const [editService] = useEditServiceMutation();

  // mở modal (khi dùng nội bộ)
  const showModal = () => setInternalModalOpen(true);

  // đóng modal
  const handleCancel = () => {
    if (externalIsOpen !== undefined && externalOnClose) {
      externalOnClose();
    } else {
      setInternalModalOpen(false);
    }
  };

  // Auto open khi readOnly + có id (màn chi tiết)
  useEffect(() => {
    if (readOnly && id) {
      if (externalIsOpen === undefined) setInternalModalOpen(true);
    }
  }, [readOnly, id, externalIsOpen]);

  // nạp dữ liệu khi edit/readOnly hoặc reset khi tạo mới
  useEffect(() => {
    if (!isModalOpen) return;

    if ((edit || readOnly) && serviceId) {
      form.setFieldsValue({
        name: serviceId.name,
        type: serviceId.type,
        techniques: serviceId.technical_settings_info?.map((t: any) => t.id) || [],
      });
      setSelectedType(serviceId.type as ServiceType);

      if (serviceId.treatment_packages_info?.length > 0) {
        const mappedPackages: ServicePackage[] = serviceId.treatment_packages_info.map(
          (pkg: any) => ({
            key: Date.now() + Math.random(),
            treatment_package: pkg.id,
            duration: String(pkg.duration ?? ""),
            price: String(pkg.price ?? ""),
          })
        );
        setPackages(mappedPackages);
      }
    } else if (!edit && !readOnly) {
      form.resetFields();
      setSelectedType(undefined);
      setPackages([{ key: Date.now(), treatment_package: null, duration: "", price: "" }]);
    }
  }, [isModalOpen, edit, readOnly, serviceId, form]);

  // đổi loại trị liệu -> clear kỹ thuật đã chọn
  const handleTypeChange = (val: ServiceType) => {
    setSelectedType(val);
    form.setFieldsValue({ techniques: [] });
  };

  // Lọc danh sách kỹ thuật theo loại đã chọn
  const filteredTechniques: TechniqueItem[] = useMemo(() => {
    const items: TechniqueItem[] = techniqueList?.results || [];
    if (!selectedType) return [];
    return items.filter((t) => {
      const tType = (t.type ?? t.type_code ?? t.category) as ServiceType | undefined;
      return String(tType) === String(selectedType);
    });
  }, [techniqueList, selectedType]);

  // thao tác gói trị liệu
  const addPackage = () => {
    setPackages((prev) => [
      ...prev,
      { key: Date.now(), treatment_package: null, duration: "", price: "" },
    ]);
  };

  const removePackage = (key: number) => {
    setPackages((prev) => prev.filter((p) => p.key !== key));
  };

  const updatePackage = (
    key: number,
    field: keyof ServicePackage,
    value: ServicePackage[typeof field]
  ) => {
    setPackages((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
  };

  // submit
  const onFinish = async () => {
    try {
      const formValues = await form.validateFields();

      if (!selectedType) {
        return notification.error({ message: "Vui lòng chọn loại trị liệu trước!" });
      }

      if (packages.length === 0) {
        return notification.error({ message: "Vui lòng thêm ít nhất một gói trị liệu!" });
      }

      const isPackagesValid = packages.every(
        (p) =>
          p.treatment_package !== null &&
          String(p.duration).trim() !== "" &&
          String(p.price).trim() !== ""
      );
      if (!isPackagesValid) {
        return notification.error({
          message: "Vui lòng điền đầy đủ thông tin cho mỗi gói trị liệu!",
        });
      }

      const payload = {
        code: generateRandomCode(),
        name: formValues.name,
        status: "active",
        type: selectedType,
        treatment_packages: packages.map((p) => ({
          treatment_package_id: p.treatment_package,
          duration: parseInt(String(p.duration), 10),
          price: parseInt(String(p.price).replace(/,/g, ""), 10),
        })),
        technical_settings: (formValues.techniques || []) as number[],
      };

      if (edit) {
        await editService({ id, ...payload }).unwrap();
        notification.success({ message: "Dịch vụ đã được cập nhật!" });
      } else {
        await createService(payload).unwrap();
        notification.success({ message: "Dịch vụ đã được thêm mới!" });
      }

      handleCancel();
      refetch?.();
    } catch (error) {
      console.error("Error during submission:", error);
      notification.error({ message: "Đã xảy ra lỗi khi xử lý dữ liệu!" });
    }
  };

  return (
    <>
      {!readOnly && (
        <Button
          style={{ backgroundColor: "#BD8306", color: "white", border: "none" }}
          onClick={showModal}
          size={edit ? "small" : "middle"}
        >
          {edit ? "Sửa" : "Thêm dịch vụ"}
        </Button>
      )}

      <Modal
        title={
          title ||
          (readOnly ? "Chi tiết dịch vụ" : edit ? "Sửa dịch vụ" : "Thêm dịch vụ")
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          readOnly
            ? [<Button key="close" onClick={handleCancel}>Đóng</Button>]
            : [
                <Button key="cancel" onClick={handleCancel}>Hủy</Button>,
                <Button key="submit" type="primary" onClick={onFinish}>
                  Xác nhận
                </Button>,
              ]
        }
        destroyOnClose
        width={1289}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={readOnly}
          initialValues={{ techniques: [] }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="Tên dịch vụ"
                rules={[{ required: true, message: "Chưa nhập tên dịch vụ!" }]}
              >
                <Input placeholder="Nhập tên dịch vụ" />
              </Form.Item>

              <Form.Item
                name="type"
                label="Loại trị liệu"
                rules={[{ required: true, message: "Chưa chọn loại trị liệu!" }]}
              >
                <Select
                  placeholder="Chọn trị liệu"
                  onChange={handleTypeChange}
                  disabled={readOnly}
                  allowClear
                >
                  <Option value="TLCB">Trị liệu chữa bệnh</Option>
                  <Option value="TLDS">Trị liệu dưỡng sinh</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={16}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                <Col>
                  <span style={{ fontSize: 14 }}>Gói trị liệu</span>
                </Col>
                {!readOnly && (
                  <Button
                    type="dashed"
                    className="add-package-btn"
                    onClick={addPackage}
                    style={{ borderColor: "#52c41a", color: "#52c41a" }}
                  >
                    + Thêm gói trị liệu
                  </Button>
                )}
              </Row>

              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {packages.map((pkg) => (
                  <Row key={pkg.key} gutter={[16, 16]} align="middle">
                    <Col flex={2}>
                      <Select
                        placeholder="Chọn gói"
                        style={{ width: "100%" }}
                        value={pkg.treatment_package ?? undefined}
                        onChange={(val) => updatePackage(pkg.key, "treatment_package", val)}
                        disabled={readOnly}
                      >
                        {treatmentList?.results?.map((t: any) => (
                          <Option key={t.id} value={t.id}>
                            {t.name}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col flex={1}>
                      <Input
                        placeholder="Thời gian (phút)"
                        value={pkg.duration}
                        onChange={(e) => updatePackage(pkg.key, "duration", e.target.value)}
                        disabled={readOnly}
                      />
                    </Col>
                    <Col flex={1}>
                      <Input
                        placeholder="Giá"
                        value={pkg.price}
                        onChange={(e) => updatePackage(pkg.key, "price", e.target.value)}
                        disabled={readOnly}
                      />
                    </Col>
                    {!readOnly && (
                      <Col>
                        <Tooltip title="Xóa gói trị liệu">
                          <Button
                            shape="circle"
                            type="primary"
                            danger
                            size="small"
                            onClick={() => removePackage(pkg.key)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <RiDeleteBin5Line />
                          </Button>
                        </Tooltip>
                      </Col>
                    )}
                  </Row>
                ))}
              </Space>

              <Form.Item name="techniques" label="Chọn kỹ thuật" style={{ marginTop: 16 }}>
                <Select
                  mode="multiple"
                  placeholder={selectedType ? "Chọn kỹ thuật" : "Chọn loại trị liệu trước"}
                  disabled={readOnly || !selectedType}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    normalizeVN(String(option?.children)).includes(normalizeVN(input))
                  }
                >
                  {filteredTechniques.map((t) => (
                    <Option key={t.id} value={t.id}>
                      {t.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
