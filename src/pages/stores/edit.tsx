import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

export const StoreEdit = () => {
  const { id } = useParams();
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps } = useForm({
    resource: "stores",
    id,
  });

  return (
    <Edit
      saveButtonProps={{
        ...saveButtonProps,
        icon: <SaveOutlined />,
        style: {
          color: mode === "dark" ? "#000000" : "#ffffff"
        }
      }}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter store title" }]}
        >
          <Input placeholder="Enter store title" />
        </Form.Item>

        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter store name" }]}
        >
          <Input placeholder="Enter store name" />
        </Form.Item>

        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: "Please enter store address" }]}
        >
          <Input.TextArea 
            placeholder="Enter store address" 
            rows={3}
          />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
          rules={[
            { required: true, message: "Please enter phone number" },
            { pattern: /^[\+]?[1-9][\d]{0,15}$/, message: "Please enter a valid phone number" }
          ]}
        >
          <Input placeholder="Enter phone number" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please enter email address" },
            { type: "email", message: "Please enter a valid email address" }
          ]}
        >
          <Input placeholder="Enter email address" />
        </Form.Item>

        <Form.Item
          label="Website"
          name="website"
        >
          <Input placeholder="Enter website URL (optional)" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea 
            placeholder="Enter store description (optional)" 
            rows={4}
          />
        </Form.Item>

        <Form.Item
          label="Profile Picture URL"
          name="profile_picture_url"
        >
          <Input placeholder="Enter profile picture URL (optional)" />
        </Form.Item>
      </Form>
    </Edit>
  );
}; 