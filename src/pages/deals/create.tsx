import { Create, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, Switch, Select, InputNumber, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useContext, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList } from "@refinedev/core";

export const DealCreate = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps } = useForm({
    resource: "deals",
  });

  // Fetch all stores using useList
  const { data: storesData } = useList({
    resource: "stores",
  });

  const { open } = useNotificationProvider();

  const handleSave = async (values: any) => {
    if (formProps.onFinish) {
      await formProps.onFinish(values);
    } else {
      message.error("Form submit function not available");
    }
  };

  return (
    <Create 
      saveButtonProps={{ 
        ...saveButtonProps, 
        onClick: () => formProps.form?.submit(),
        style: {
          color: mode === "dark" ? "#000000" : "#ffffff"
        }
      }}
    >
      <Form {...formProps} layout="vertical" onFinish={handleSave}>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please enter deal title" }]}
        >
          <Input placeholder="Enter deal title" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea 
            placeholder="Enter deal description (optional)" 
            rows={4}
          />
        </Form.Item>

        <Form.Item
          label="Store"
          name="store_id"
          rules={[{ required: true, message: "Please select a store" }]}
        >
          <Select
            placeholder="Select a store"
            loading={!storesData}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            {storesData?.data?.map((store: any) => (
              <Select.Option key={store.id} value={store.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {store.profile_picture_url && (
                    <img 
                      src={store.profile_picture_url} 
                      alt={store.title}
                      style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  )}
                  <span>{store.title}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Discount Percentage"
          name="discount_percentage"
          rules={[
            { required: true, message: "Please enter discount percentage" },
            { type: "number", min: 0, max: 100, message: "Discount must be between 0 and 100" }
          ]}
        >
          <InputNumber
            placeholder="Enter discount percentage (0-100)"
            min={0}
            max={100}
            style={{ width: "100%" }}
            addonAfter="%"
          />
        </Form.Item>

        <Form.Item
          label="Original Price"
          name="original_price"
          rules={[
            { required: true, message: "Please enter original price" },
            { type: "number", min: 0, message: "Price must be positive" }
          ]}
        >
          <InputNumber
            placeholder="Enter original price"
            min={0}
            style={{ width: "100%" }}
            addonBefore="$"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          label="Discounted Price"
          name="discounted_price"
          rules={[
            { required: true, message: "Please enter discounted price" },
            { type: "number", min: 0, message: "Price must be positive" }
          ]}
        >
          <InputNumber
            placeholder="Enter discounted price"
            min={0}
            style={{ width: "100%" }}
            addonBefore="$"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          label="Deal URL"
          name="deal_url"
          rules={[
            { required: true, message: "Please enter deal URL" },
            { type: "url", message: "Please enter a valid URL" }
          ]}
        >
          <Input placeholder="Enter deal URL (e.g., https://example.com/deal)" />
        </Form.Item>

        <Form.Item
          label="Expiry Date"
          name="expiry_date"
          rules={[{ required: true, message: "Please select expiry date" }]}
        >
          <Input type="datetime-local" />
        </Form.Item>

        <Form.Item
          label="Activity"
          name="is_active"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive"
            style={{ 
              transform: 'scale(1.25)',
              marginLeft: '5px'
            }}
          />
        </Form.Item>
        <style>
          {`
            .ant-switch-checked .ant-switch-handle::before {
              background-color: ${mode === "dark" ? "#141414" : "#ffffff"} !important;
            }
            .ant-switch-checked .ant-switch-inner-checked {
              color: ${mode === "dark" ? "#141414" : "#ffffff"} !important;
            }
          `}
        </style>
      </Form>
    </Create>
  );
}; 