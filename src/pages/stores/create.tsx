import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Button } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";

export const StoreCreate = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps } = useForm({
    resource: "stores",
  });

  return (
    <Create
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
          label="Description"
          name="description"
        >
          <Input.TextArea 
            placeholder="Enter store description (optional)" 
            rows={4}
          />
        </Form.Item>
      </Form>
    </Create>
  );
}; 