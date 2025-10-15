import { Button, Modal, Select } from "antd";

const { Option } = Select;

const ModalDelEdit = ({
  title,
  data,
  open,
  setOpen,
  dataEdit,
  setDataEdit,
  action,
}: {
  title: string;
  data: any;
  open: boolean;
  dataEdit: any;
  setDataEdit: any;
  setOpen: (value: boolean) => void;
  action: any;
}) => {
  const handleOk = () => {
    setOpen(false);
  };
  const handleCancel = () => {
    setOpen(false);
  };
  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={[
        <Button key="link" type="primary" onClick={() => action()}>
          Cập nhật
        </Button>,
      ]}
    >
      <div className="grid grid-cols-3 gap-2 jutify-between w-full">
        {data?.map((item: any, index: number) => (
          <Select
            value={dataEdit[item.key]}
            onSelect={(value) =>
              setDataEdit({ ...dataEdit, [item.key]: Number(value) })
            }
            key={index}
            placeholder={item?.placeholder}
            className="w-full"
          >
            {item?.data?.map((el: any) => (
              <Option key={el?.id} value={el?.id}>
                {el[item.displayProps]}
              </Option>
            ))}
          </Select>
        ))}
      </div>
    </Modal>
  );
};

export default ModalDelEdit;
