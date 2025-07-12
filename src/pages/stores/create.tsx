import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Button, Switch, Select } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useContext } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList } from "@refinedev/core";

export const StoreCreate = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps } = useForm({
    resource: "stores",
  });

  // Fetch all countries using useList
  const { data: countriesData } = useList({
    resource: "countries",
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
          label="Slug"
          name="slug"
          rules={[
            { required: true, message: "Please enter store slug" },
            { 
              pattern: /^[a-z0-9-]+$/, 
              message: "Slug can only contain lowercase letters, numbers, and hyphens" 
            }
          ]}
        >
          <Input placeholder="Enter store slug (e.g., my-store)" />
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
          label="Redirect URL"
          name="redirect_url"
          rules={[
            { required: true, message: "Please enter redirect URL" },
            { type: "url", message: "Please enter a valid URL" }
          ]}
        >
          <Input placeholder="Enter redirect URL (e.g., https://example.com)" />
        </Form.Item>

        <Form.Item
          label="Activity"
          name="is_active"
          valuePropName="checked"
          initialValue={true}
        >
          <>
            <Switch 
              checkedChildren="Active" 
              unCheckedChildren="Inactive"
              style={{ 
                transform: 'scale(1.25)',
                marginLeft: '5px'
              }}
            />
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
          </>
        </Form.Item>

        <Form.Item
          label="Country"
          name="country_id"
          rules={[{ required: true, message: "Please select a country" }]}
        >
          <Select
            placeholder="Select a country"
            loading={!countriesData}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            {countriesData?.data?.map((country: any) => (
              <Select.Option key={country.id} value={country.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={country.image_url} 
                    alt={country.value}
                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                  />
                  <span>{country.value}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Create>
  );
}; 