import { Modal } from "antd";
import React from "react";

interface modalType {
  success: any[];
  error: any[];
  open: boolean;
  setOpen: (value: boolean) => void;
  object_str: string;
}

const ModalDialog = ({
  success,
  error,
  open,
  setOpen,
  object_str,
}: modalType) => {
  const renderErrorArray = (error: any[]): string[] => {
    const errorArray: string[] = [];
    error?.forEach((item) => {
      if (typeof item === "object") {
        const key = Object.keys(item);
        const errorValue = item[key[0]];
        if (typeof errorValue === "object") {
          const keyErr = Object.keys(errorValue);
          keyErr?.forEach((keyItem) => {
            const newErr = keyItem + ": " + errorValue[keyItem];
            errorArray.push(newErr);
          });
        } else {
          errorArray.push(errorValue.toString());
        }
      } else {
        errorArray.push(item.toString())
      }
    });
    return errorArray;
  };
  return (
    <Modal
      title="Bạn đã tải lên file excel thành công"
      open={open}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={630}
    >
      <div className="flex">
        <h3 className="text-green-500 mr-2">Thành công:</h3>
        <p>{success?.length} kết quả </p>
        {success?.length > 0 && (
          <span>
            ( {object_str}:{" "}
            {typeof success[0] !== "object"
              ? success?.toString()
              : success.map(
                  (item: { id: number }) => "{ id: " + item.id + " }, "
                )}{" "}
            )
          </span>
        )}
      </div>
      <div>
        <div className="flex">
          <h3 className="text-red-500 mr-2">Thất bại:</h3>
          <p>{error?.length} kết quả</p>
        </div>
        {error?.length > 0 && (
          <div>
            {renderErrorArray(error)?.map((item, index) => {
              return (
                <p className="text-xs" key={index}>
                  - {item}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalDialog;
