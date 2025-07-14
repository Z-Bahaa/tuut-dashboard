import { Create, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, Switch, Select, InputNumber, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useContext, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList } from "@refinedev/core";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

export const DealCreate = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps } = useForm({
    resource: "deals",
  });
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [currencyDisplay, setCurrencyDisplay] = useState<string>('');

  // Fetch all stores using useList
  const { data: storesData, isLoading: storesLoading } = useList({
    resource: "stores",
    pagination: {
      mode: "off", // Disable pagination to get all stores
    },
  });

  // Fetch all countries using useList
  const { data: countriesData, isLoading: countriesLoading } = useList({
    resource: "countries",
  });

  const { open } = useNotificationProvider();

  const handleSave = async (values: any) => {
    try {
      if (formProps.onFinish) {
        const result = await formProps.onFinish(values);
        
        // If deal creation was successful, increment the store's total_offers
        if (values.store_id) {
          try {
            // Get current store data
            const currentStore = storesData?.data?.find((store: any) => store.id === values.store_id);
            if (currentStore) {
              const currentTotalOffers = currentStore.total_offers || 0;
              const newTotalOffers = currentTotalOffers + 1;
              
              // Update the store's total_offers
              const { error: updateError } = await supabase
                .from('stores')
                .update({ total_offers: newTotalOffers })
                .eq('id', values.store_id);
              
              if (updateError) {
                console.error('Failed to update store total_offers:', updateError);
                open({
                  type: "error",
                  message: "Deal created but failed to update store offer count",
                  description: "The deal was created successfully, but the store's offer count may not be accurate.",
                });
              } else {
                open({
                  type: "success",
                  message: "Store updated successfully",
                  description: "store offer count has been updated successfully.",
                });
              }
            }
          } catch (error) {
            console.error('Error updating store total_offers:', error);
            open({
              type: "error",
              message: "Deal created but failed to update store offer count",
              description: "The deal was created successfully, but the store's offer count may not be accurate.",
            });
          }
        }
      } else {
        message.error("Form submit function not available");
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      open({
        type: "error",
        message: "Failed to create deal",
        description: String(error),
      });
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
      isLoading={storesLoading || countriesLoading}
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
          label="Slug"
          name="slug"
          rules={[
            { required: true, message: "Please enter deal slug" },
            { 
              pattern: /^[a-z0-9-]+$/, 
              message: "Slug can only contain lowercase letters, numbers, and hyphens" 
            }
          ]}
        >
          <Input 
            placeholder="Enter deal slug (e.g., summer-sale-2024)" 
            onChange={(e) => {
              // Remove spaces, convert to lowercase, allow hyphens
              const value = e.target.value.replace(/\s+/g, '').toLowerCase();
              e.target.value = value;
            }}
          />
        </Form.Item>

        <Form.Item
          label="Code"
          name="code"
          rules={[
            { required: true, message: "Please enter deal code" },
            { 
              pattern: /^[A-Z0-9]+$/, 
              message: "Code can only contain uppercase letters and numbers" 
            }
          ]}
        >
          <Input 
            placeholder="Enter deal code (e.g., SUMMER2024)" 
            onChange={(e) => {
              // Remove spaces and hyphens, convert to uppercase
              const value = e.target.value.replace(/[\s-]/g, '').toUpperCase();
              e.target.value = value;
            }}
          />
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
          label="Country"
          name="country_id"
          rules={[{ required: true, message: "Please select a country" }]}
        >
          <Select
            placeholder="Select a country"
            loading={!countriesData}
            showSearch
            optionFilterProp="children"
            onChange={(value) => {
              console.log('Country onChange called with value:', value);
              console.log('Current selectedType:', selectedType);
              setSelectedCountryId(value);
              // Update currency display when country changes
              if (selectedType === 'amountOff' && value) {
                console.log('Processing amountOff with country value:', value);
                const selectedCountry = countriesData?.data?.find((country: any) => country.id === value);
                console.log('Selected Country Data:', selectedCountry);
                console.log('Selected Country Currency:', selectedCountry?.currency);
                if (selectedCountry?.currency) {
                  console.log('Currency Data (already object):', selectedCountry.currency);
                  const currencyData = selectedCountry.currency;
                  setCurrencyDisplay(currencyData.en || currencyData.value || '$');
                } else {
                  console.log('No currency field found');
                  setCurrencyDisplay('$');
                }
              } else {
                console.log('Not processing - selectedType is not amountOff or no value');
              }
            }}
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

        <Form.Item
          label="Type"
          name="type"
          rules={[{ required: true, message: "Please select a deal type" }]}
        >
          <Select
            placeholder="Select a deal type"
            showSearch
            optionFilterProp="children"
            onChange={(value) => {
              console.log('Type onChange called with value:', value);
              setSelectedType(value);
              // Update discount_unit and discount based on type
              if (value === 'discount') {
                console.log('Setting discount type with %');
                formProps.form?.setFieldValue('discount_unit', '%');
                setCurrencyDisplay('%');
              } else if (value === 'amountOff') {
                console.log('Setting amountOff type with $');
                formProps.form?.setFieldValue('discount_unit', '$');
                // Update currency display based on selected country
                if (selectedCountryId) {
                  console.log('Type Change - Processing with selectedCountryId:', selectedCountryId);
                  const selectedCountry = countriesData?.data?.find((country: any) => country.id === selectedCountryId);
                  console.log('Type Change - Selected Country Data:', selectedCountry);
                  console.log('Type Change - Selected Country Currency:', selectedCountry?.currency);
                  if (selectedCountry?.currency) {
                    console.log('Type Change - Currency Data (already object):', selectedCountry.currency);
                    const currencyData = selectedCountry.currency;
                    setCurrencyDisplay(currencyData.en || currencyData.value || '$');
                  } else {
                    console.log('Type Change - No currency field found');
                    setCurrencyDisplay('$');
                  }
                } else {
                  console.log('Type Change - No selected country ID');
                  setCurrencyDisplay('$');
                }
              } else {
                console.log('Setting BOGO/Free Shipping type');
                // For BOGO and Free Shipping, set both to null
                formProps.form?.setFieldValue('discount_unit', null);
                formProps.form?.setFieldValue('discount', null);
                setCurrencyDisplay('');
              }
            }}
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            <Select.Option value="discount">Discount</Select.Option>
            <Select.Option value="amountOff">Amount Off</Select.Option>
            <Select.Option value="bogo">BOGO</Select.Option>
            <Select.Option value="freeShipping">Free Shipping</Select.Option>
          </Select>
        </Form.Item>

        {(selectedType === 'discount' || selectedType === 'amountOff') && (
          <>
            <Form.Item
              label="Amount"
              name="discount"
              rules={[
                { required: true, message: "Please enter amount" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const type = getFieldValue('type');
                    if (type === 'discount') {
                      if (!value || value < 1 || value > 100) {
                        return Promise.reject(new Error('Discount must be between 1 and 100'));
                      }
                    } else if (type === 'amountOff') {
                      if (!value || value <= 0) {
                        return Promise.reject(new Error('Amount must be positive'));
                      }
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
            <InputNumber
              placeholder={selectedType === 'discount' ? "Enter discount percentage (1-100)" : "Enter amount"}
              min={selectedType === 'discount' ? 1 : 0}
              max={selectedType === 'discount' ? 100 : undefined}
              style={{ width: "100%" }}
              addonAfter={currencyDisplay}
            />
          </Form.Item>

          <Form.Item
            name="discount_unit"
            hidden
          >
            <Input />
          </Form.Item>
        </>
        )}

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
          initialValue={true}
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive"
            defaultChecked={true}
            style={{ 
              transform: 'scale(1.25)',
              marginLeft: '5px'
            }}
          />
        </Form.Item>

        <Form.Item
          label="Featured"
          name="is_featured"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch 
            checkedChildren="Featured" 
            unCheckedChildren="Not Featured"
            defaultChecked={false}
            style={{ 
              transform: 'scale(1.25)',
              marginLeft: '5px'
            }}
          />
        </Form.Item>

        <Form.Item
          label="Trending"
          name="is_trending"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch 
            checkedChildren="Trending" 
            unCheckedChildren="Not Trending"
            defaultChecked={false}
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