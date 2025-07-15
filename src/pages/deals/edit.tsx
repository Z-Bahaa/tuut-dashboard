import { Edit, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, Switch, Select, InputNumber, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList, useDelete } from "@refinedev/core";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

export const DealEdit = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps, formLoading, query } = useForm();
  
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [currencyDisplay, setCurrencyDisplay] = useState<string>('');
  const [dealData, setDealData] = useState<any>(null);

  // Category selection states
  const [initialSelectedCategoryIds, setInitialSelectedCategoryIds] = useState<number[]>([]);
  const [currentSelectedCategoryIds, setCurrentSelectedCategoryIds] = useState<number[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

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

  // Fetch all categories using useList
  const { data: categoriesData, isLoading: categoriesLoading } = useList({
    resource: "categories",
  });

  const { open } = useNotificationProvider();
  const { mutate: deleteDeal } = useDelete();

  // Update document title when deal data is loaded
  useEffect(() => {
    if (query?.data?.data?.title) {
      document.title = `Edit ${query.data.data.title} - Deal`;
    }
  }, [query?.data?.data?.title]);

  // Fetch existing category relationships when deal data is loaded
  useEffect(() => {
    const fetchDealCategories = async () => {
      if (query?.data?.data?.id) {
        const dealId = query.data.data.id;
        
        try {
          const { data: dealCategories, error } = await supabase
            .from('deal_categories')
            .select('category_id')
            .eq('deal_id', dealId);

          if (error) {
            console.error('Error fetching deal categories:', error);
            return;
          }

          const categoryIds = dealCategories?.map((dc: any) => dc.category_id) || [];
          setInitialSelectedCategoryIds(categoryIds);
          setCurrentSelectedCategoryIds(categoryIds);
          setCategoriesLoaded(true);
        } catch (error) {
          console.error('Error fetching deal categories:', error);
          setCategoriesLoaded(true);
        }
      }
    };

    fetchDealCategories();
  }, [query?.data?.data?.id]);

  // Set initial values when form data is loaded
  useEffect(() => {
    if (query?.data?.data) {
      const dealData = query.data.data;
      setDealData(dealData); // Store deal data for delete functionality
      setSelectedType(dealData.type || '');
      setSelectedCountryId(dealData.country_id || null);
      
      // Format expiry date for datetime-local input
      if (dealData.expiry_date) {
        const expiryDate = new Date(dealData.expiry_date);
        const formattedDate = expiryDate.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:MM
        formProps.form?.setFieldValue('expiry_date', formattedDate);
      }
      
      // Set currency display based on type and country
      if (dealData.type === 'discount') {
        setCurrencyDisplay('%');
      } else if (dealData.type === 'amountOff' && dealData.country_id) {
        const selectedCountry = countriesData?.data?.find((country: any) => country.id === dealData.country_id);
        if (selectedCountry?.currency) {
          const currencyData = selectedCountry.currency;
          setCurrencyDisplay(currencyData.en || currencyData.value || '$');
        } else {
          setCurrencyDisplay('$');
        }
      }
    }
  }, [query?.data?.data, countriesData?.data, formProps.form]);

  const handleSave = async (values: any) => {
    // Handle category relationships
    const dealId = query?.data?.data?.id;
    if (dealId) {
      // Compare initial and current category selections
      const removedCategoryIds = initialSelectedCategoryIds.filter(
        (id: number) => !currentSelectedCategoryIds.includes(id)
      );
      const addedCategoryIds = currentSelectedCategoryIds.filter(
        (id: number) => !initialSelectedCategoryIds.includes(id)
      );

      try {
        // Delete removed category relationships
        if (removedCategoryIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('deal_categories')
            .delete()
            .eq('deal_id', dealId)
            .in('category_id', removedCategoryIds);

          if (deleteError) {
            open({
              type: "error",
              message: "Failed to remove category relations",
              description: deleteError.message,
            });
          }
        }

        // Add new category relationships
        if (addedCategoryIds.length > 0) {
          const { error: insertError } = await supabase
            .from('deal_categories')
            .insert(
              addedCategoryIds.map((categoryId: number) => ({
                deal_id: dealId,
                category_id: categoryId
              }))
            );

          if (insertError) {
            open({
              type: "error",
              message: "Failed to create category relations",
              description: insertError.message,
            });
          }
        }

        // Show success notification if changes were made
        if (removedCategoryIds.length > 0 || addedCategoryIds.length > 0) {
          open({
            type: "success",
            message: "Category relations updated successfully",
            description: "Relations Updated",
          });
        }
      } catch (error) {
        open({
          type: "error",
          message: "Failed to update category relations",
          description: String(error),
        });
      }
    }

    if (formProps.onFinish) {
      await formProps.onFinish(values);
    } else {
      message.error("Form submit function not available");
    }
  };

  // Handle deal deletion with store total_offers decrement
  const handleDeleteDeal = async () => {
    if (!dealData) return;

    try {
      // If deal deletion was successful, update store data
      if (dealData.store_id) {
        try {
          // Get current store data
          const currentStore = storesData?.data?.find((store: any) => store.id === dealData.store_id);
          if (currentStore) {
            const currentTotalOffers = currentStore.total_offers || 0;
            const newTotalOffers = Math.max(0, currentTotalOffers - 1); // Ensure it doesn't go below 0
            
            // Prepare store update data
            const storeUpdateData: any = { total_offers: newTotalOffers };
            
            // Check if the deleted deal was the store's top deal
            if (currentStore.discount_id === dealData.id) {
              // Need to recalculate the top deal
              // Get all deals for this store except the deleted one
              const { data: remainingDeals, error: dealsError } = await supabase
                .from('deals')
                .select('*')
                .eq('store_id', dealData.store_id)
                .neq('id', dealData.id);
              
              if (dealsError) {
                console.error('Failed to fetch remaining deals:', dealsError);
              } else {
                if (!remainingDeals || remainingDeals.length === 0) {
                  // No deals left, clear all discount fields to null
                  storeUpdateData.discount = null;
                  storeUpdateData.discount_unit = null;
                  storeUpdateData.discount_type = null;
                  storeUpdateData.discount_id = null;
                } else {
                  // Find the new top deal
                  let topDeal = null;
                  let highestDiscount = -1;
                  let bogoDeal = null; // Store BOGO/Free Shipping deal as fallback
                  
                  for (const remainingDeal of remainingDeals) {
                    if (remainingDeal.type === 'discount' || remainingDeal.type === 'amountOff') {
                      const dealDiscount = remainingDeal.discount || 0;
                      if (dealDiscount > highestDiscount) {
                        highestDiscount = dealDiscount;
                        topDeal = remainingDeal;
                      }
                    } else if (remainingDeal.type === 'bogo' || remainingDeal.type === 'freeShipping') {
                      // Store BOGO/Free Shipping deal as fallback, but don't break
                      if (!bogoDeal) {
                        bogoDeal = remainingDeal;
                      }
                    }
                  }
                  
                  // If no discount/amountOff deals found, use BOGO/Free Shipping as fallback
                  if (!topDeal && bogoDeal) {
                    topDeal = bogoDeal;
                  }
                  
                  if (topDeal) {
                    if (topDeal.type === 'discount' || topDeal.type === 'amountOff') {
                      // Handle discount_unit - replace "$" with currency code from country
                      let discountUnit = topDeal.discount_unit;
                      if (discountUnit === '$' && topDeal.country_id) {
                        const country = countriesData?.data?.find((country: any) => country.id === topDeal.country_id);
                        if (country?.currency_code?.en) {
                          discountUnit = country.currency_code.en;
                        }
                      }
                      
                      storeUpdateData.discount = topDeal.discount;
                      storeUpdateData.discount_unit = discountUnit;
                    } else {
                      // For BOGO and Free Shipping deals, set default values
                      storeUpdateData.discount = 0;
                      storeUpdateData.discount_unit = '';
                    }
                    storeUpdateData.discount_type = topDeal.type;
                    storeUpdateData.discount_id = topDeal.id;
                  }
                }
              }
              
              // Update the store BEFORE deleting the deal to avoid foreign key constraint
              const { error: updateError } = await supabase
                .from('stores')
                .update(storeUpdateData)
                .eq('id', dealData.store_id);
              
              if (updateError) {
                console.error('Failed to update store:', updateError);
                open({
                  type: "error",
                  message: "Failed to update store data",
                  description: "The store data could not be updated.",
                });
                return; // Don't delete the deal if store update fails
              }
            }
          }
        } catch (error) {
          console.error('Error updating store:', error);
          open({
            type: "error",
            message: "Failed to update store data",
            description: "The store data could not be updated.",
          });
          return; // Don't delete the deal if store update fails
        }
      }
      
      // Now delete the deal record
      await deleteDeal({ resource: "deals", id: dealData.id });
      
      open({
        type: "success",
        message: "Deal deleted successfully",
        description: "Deal has been removed and store data updated.",
      });
    } catch (error) {
      open({
        type: "error",
        message: "Failed to delete deal",
        description: String(error),
      });
    }
  };

  return (
    <Edit 
      saveButtonProps={{ 
        ...saveButtonProps, 
        onClick: () => formProps.form?.submit(),
        style: {
          color: mode === "dark" ? "#000000" : "#ffffff"
        }
      }}
      deleteButtonProps={{
        onSuccess: handleDeleteDeal,
      }}
      isLoading={formLoading || storesLoading || countriesLoading || categoriesLoading}
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
          label="Categories"
          rules={[{ required: false, message: "Please select at least one category" }]}
        >
          <Select
            mode="multiple"
            placeholder="Select categories"
            loading={!categoriesData || !categoriesLoaded}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
            value={currentSelectedCategoryIds}
            onChange={(values: number[]) => setCurrentSelectedCategoryIds(values)}
            disabled={!categoriesLoaded}
          >
            {categoriesData?.data?.map((category: any) => (
              <Select.Option key={category.id} value={category.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={category.image_url} 
                    alt={category.title}
                    style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <span>{category.title}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
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
              setSelectedCountryId(value);
              // Update currency display when country changes
              if (selectedType === 'amountOff' && value) {
                const selectedCountry = countriesData?.data?.find((country: any) => country.id === value);
                if (selectedCountry?.currency) {
                  const currencyData = selectedCountry.currency;
                  setCurrencyDisplay(currencyData.en || currencyData.value || '$');
                } else {
                  setCurrencyDisplay('$');
                }
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
              setSelectedType(value);
              // Update discount_unit and discount based on type
              if (value === 'discount') {
                formProps.form?.setFieldValue('discount_unit', '%');
                setCurrencyDisplay('%');
              } else if (value === 'amountOff') {
                formProps.form?.setFieldValue('discount_unit', '$');
                // Update currency display based on selected country
                if (selectedCountryId) {
                  const selectedCountry = countriesData?.data?.find((country: any) => country.id === selectedCountryId);
                  if (selectedCountry?.currency) {
                    const currencyData = selectedCountry.currency;
                    setCurrencyDisplay(currencyData.en || currencyData.value || '$');
                  } else {
                    setCurrencyDisplay('$');
                  }
                } else {
                  setCurrencyDisplay('$');
                }
              } else {
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
          <Input 
            type="datetime-local" 
            style={{
              colorScheme: mode === "dark" ? "dark" : "light"
            }}
          />
        </Form.Item>
        <style>
          {`
            #expiry_date::-webkit-calendar-picker-indicator {
              filter: ${mode === "light" ? "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(246deg) brightness(104%) contrast(97%)" : "brightness(0) saturate(100%) invert(83%) sepia(31%) saturate(638%) hue-rotate(359deg) brightness(103%) contrast(107%)"};
              cursor: pointer;
            }
            
          `}
        </style>

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

        <Form.Item
          label="Featured"
          name="is_featured"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Featured" 
            unCheckedChildren="Not Featured"
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
        >
          <Switch 
            checkedChildren="Trending" 
            unCheckedChildren="Not Trending"
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
    </Edit>
  );
}; 