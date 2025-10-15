import React, { useState } from "react";
import { Modal, Button, Space } from "antd";
import { FaEye, FaDownload } from "react-icons/fa"; // Import icons from react-icons
import { saveAs } from "file-saver";

const base64ToBlob = (base64: any, contentType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
};

type FileActionType = {
  data: {
    id: number;
    user: string | null;
    user_profile: number;
    contract: string;
    contract_start: string;
    contract_end: string;
    contract_status: string;
    contract_type: string;
    start_date: string;
    level: string;
    calculate_seniority: string;
    contract_base64: string | null;
  };
};

const FileAction = (props: FileActionType) => {
  //   console.log("check data", props.data);
  const { contract, contract_base64 } = props.data;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const handleShowFile = () => {
    if (contract_base64) {
      // Mặc định coi file là PDF
      const pdfBlob = base64ToBlob(contract_base64, "application/pdf");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setFileUrl(pdfUrl);
      setIsModalVisible(true);
    } else {
      console.error("Không có file base64 để xem.");
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setFileUrl("");
  };

  const handleDownloadFile = () => {
    if (contract) {
      const link = document.createElement("a");
      link.href = contract;
      link.download = "download";
      link.click();
    } else {
      console.error("Không có file để tải xuống.");
    }
  };

  return (
    <>
      <div>
        <Button
          type="link"
          icon={<FaEye />}
          onClick={handleShowFile}
          disabled={!contract_base64}
        />

        <Button
          type="link"
          icon={<FaDownload />}
          onClick={handleDownloadFile}
          disabled={!contract}
        />
      </div>

      <Modal
        title="Xem File"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width="65vw"
        bodyStyle={{ height: "80vh" }}
      >
        <object
          data={fileUrl}
          type="application/pdf"
          width="100%"
          height="100%"
        >
          <p>
            Trình duyệt của bạn không hỗ trợ xem file. Vui lòng tải xuống file
            để xem.
          </p>
        </object>
      </Modal>
    </>
  );
};

export default FileAction;
