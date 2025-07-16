import { Edit, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, Switch, Select, InputNumber, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList, useDelete, useOne } from "@refinedev/core";
import { useNavigate, useLocation } from "react-router-dom";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

export const DealEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Fetch specific store and country data when deal data is loaded
  const [storeData, setStoreData] = useState<any>(null);
  const [countryData, setCountryData] = useState<any>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);

  // Fetch all categories using useList (still needed for category selection)
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

  // Fetch specific store and country data when deal data is loaded
  useEffect(() => {
    const fetchSpecificData = async () => {
      if (query?.data?.data) {
        const deal = query.data.data;
        
        // Fetch specific store data
        if (deal.store_id) {
          setStoreLoading(true);
          try {
            const { data: store, error: storeError } = await supabase
              .from('stores')
              .select('*')
              .eq('id', deal.store_id)
              .single();
            
            if (storeError) {
              console.error('Error fetching store:', storeError);
            } else {
              setStoreData(store);
            }
          } catch (error) {
            console.error('Error fetching store:', error);
          } finally {
            setStoreLoading(false);
          }
        }

        // Fetch specific country data
        if (deal.country_id) {
          setCountryLoading(true);
          try {
            const { data: country, error: countryError } = await supabase
              .from('countries')
              .select('*')
              .eq('id', deal.country_id)
              .single();
            
            if (countryError) {
              console.error('Error fetching country:', countryError);
            } else {
              setCountryData(country);
            }
          } catch (error) {
            console.error('Error fetching country:', error);
          } finally {
            setCountryLoading(false);
          }
        }
      }
    };

    fetchSpecificData();
  }, [query?.data?.data]);

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
      } else if (dealData.type === 'amountOff' && dealData.country_id && countryData) {
        if (countryData?.currency) {
          const currencyData = countryData.currency;
          setCurrencyDisplay(currencyData.en || currencyData.value || '$');
        } else {
          setCurrencyDisplay('$');
        }
      }
    }
  }, [query?.data?.data, countryData, formProps.form]);

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

    // Call the original form submit function
    if (formProps.onFinish) {
      await formProps.onFinish(values);
      
      // After successful edit, recalculate store's top discount fields
      if (values.store_id) {
        try {
          // Get all deals for this store to recalculate the top deal
          const { data: allStoreDeals, error: dealsError } = await supabase
            .from('deals')
            .select('*')
            .eq('store_id', values.store_id);
          
          if (dealsError) {
            console.error('Failed to fetch store deals for recalculation:', dealsError);
            return;
          }
          
          if (!allStoreDeals || allStoreDeals.length === 0) {
            // No deals left, clear all discount fields to null
            const { error: updateError } = await supabase
              .from('stores')
              .update({
                discount: null,
                discount_unit: null,
                discount_type: null,
                discount_id: null
              })
              .eq('id', values.store_id);
            
            if (updateError) {
              console.error('Failed to clear store discount fields:', updateError);
            }
          } else {
            // Find the top deal among all deals
            let topDeal = null;
            let highestDiscount = -1;
            let bogoDeal = null; // Store BOGO/Free Shipping deal as fallback
            
            for (const deal of allStoreDeals) {
              if (deal.type === 'discount' || deal.type === 'amountOff') {
                const dealDiscount = deal.discount || 0;
                if (dealDiscount > highestDiscount) {
                  highestDiscount = dealDiscount;
                  topDeal = deal;
                }
              } else if (deal.type === 'bogo' || deal.type === 'freeShipping') {
                // Store BOGO/Free Shipping deal as fallback, but don't break
                if (!bogoDeal) {
                  bogoDeal = deal;
                }
              }
            }
            
            // If no discount/amountOff deals found, use BOGO/Free Shipping as fallback
            if (!topDeal && bogoDeal) {
              topDeal = bogoDeal;
            }
            
            // Prepare store update data
            const storeUpdateData: any = {};
            
            if (topDeal) {
              if (topDeal.type === 'discount' || topDeal.type === 'amountOff') {
                // Set discount_unit based on deal type
                storeUpdateData.discount = topDeal.discount;
                storeUpdateData.discount_unit = topDeal.type === 'discount' ? '%' : '$';
              } else {
                // For BOGO and Free Shipping deals, set default values
                storeUpdateData.discount = 0;
                storeUpdateData.discount_unit = '';
              }
              storeUpdateData.discount_type = topDeal.type;
              storeUpdateData.discount_id = topDeal.id;
            }
            
            // Update the store with the new top deal information
            const { error: updateError } = await supabase
              .from('stores')
              .update(storeUpdateData)
              .eq('id', values.store_id);
            
            if (updateError) {
              console.error('Failed to update store discount fields:', updateError);
            }
          }
        } catch (error) {
          console.error('Error recalculating store discount fields:', error);
        }
      }
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
          const currentStore = storeData;
          if (currentStore) {
            const currentTotalOffers = currentStore.total_offers || 0;
            const newTotalOffers = Math.max(0, currentTotalOffers - 1); // Ensure it doesn't go below 0
            
            // Prepare store update data
            const storeUpdateData: any = { total_offers: newTotalOffers };
            
            // Always update total_offers for any deal deletion
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
                  const discountUpdateData = {
                    discount: null,
                    discount_unit: null,
                    discount_type: null,
                    discount_id: null
                  };
                  
                  const { error: discountUpdateError } = await supabase
                    .from('stores')
                    .update(discountUpdateData)
                    .eq('id', dealData.store_id);
                  
                  if (discountUpdateError) {
                    console.error('Failed to clear store discount fields:', discountUpdateError);
                  }
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
                    const discountUpdateData: any = {};
                    
                    if (topDeal.type === 'discount' || topDeal.type === 'amountOff') {
                      // Set discount_unit based on deal type
                      discountUpdateData.discount = topDeal.discount;
                      discountUpdateData.discount_unit = topDeal.type === 'discount' ? '%' : '$';
                    } else {
                      // For BOGO and Free Shipping deals, set default values
                      discountUpdateData.discount = 0;
                      discountUpdateData.discount_unit = '';
                    }
                    discountUpdateData.discount_type = topDeal.type;
                    discountUpdateData.discount_id = topDeal.id;
                    
                    const { error: discountUpdateError } = await supabase
                      .from('stores')
                      .update(discountUpdateData)
                      .eq('id', dealData.store_id);
                    
                    if (discountUpdateError) {
                      console.error('Failed to update store discount fields:', discountUpdateError);
                    }
                  }
                }
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
      
      // Navigate back to the previous page or deals list as fallback
      const from = location.state?.from || "/deals";
      navigate(from);
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
      isLoading={formLoading || storeLoading || countryLoading || categoriesLoading}
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
            loading={!storeData}
            disabled={true}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            {storeData && (
              <Select.Option value={storeData.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {storeData.profile_picture_url && (
                    <img 
                      src={storeData.profile_picture_url} 
                      alt={storeData.title}
                      style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  )}
                  <span>{storeData.title}</span>
                </div>
              </Select.Option>
            )}
          </Select>
        </Form.Item>

        <Form.Item
          label="Country"
          name="country_id"
          rules={[{ required: true, message: "Please select a country" }]}
        >
          <Select
            placeholder="Select a country"
            loading={!countryData}
            disabled={true}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            {countryData && (
              <Select.Option value={countryData.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={countryData.image_url} 
                    alt={countryData.value}
                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                  />
                  <span>{countryData.value}</span>
                </div>
              </Select.Option>
            )}
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
                if (selectedCountryId && countryData) {
                  const selectedCountry = countryData;
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