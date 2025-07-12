import { Show } from "@refinedev/antd";
import { Typography, Descriptions, Button, Image } from "antd";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";

const { Title, Text } = Typography;

export const StoreShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Show
      headerButtons={[
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/stores")}
        >
          Back to List
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => navigate(`/stores/edit/${id}`)}
        >
          Edit
        </Button>,
      ]}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="ID">
          <Text strong>ID will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Title">
          <Text strong>Store title will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Name">
          <Text strong>Store name will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Address">
          <Text>Store address will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Phone">
          <Text>Phone number will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Email">
          <Text>Email will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Website">
          <Text>Website will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Description">
          <Text>Description will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Profile Picture">
          <Image
            width={100}
            height={100}
            style={{ borderRadius: "8px" }}
            src="https://via.placeholder.com/100x100"
            alt="Profile Picture"
          />
        </Descriptions.Item>
        
        <Descriptions.Item label="Created At">
          <Text>Created date will be displayed here</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Updated At">
          <Text>Updated date will be displayed here</Text>
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
}; 