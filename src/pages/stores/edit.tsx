import { Edit, useForm, useNotificationProvider, useSelect } from "@refinedev/antd";
import { Form, Input, Button, Switch, Select, Upload, message } from "antd";
import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { useContext, useState, useEffect } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList } from "@refinedev/core";
import { supabaseClient as supabase } from "../../utility/supabaseClient";
import { extractFileNameFromUrl } from "../../utility/functions";

export const StoreEdit = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps, formLoading, query, form } = useForm();

  // Fetch only the store's country using useOne
  const [storeCountry, setStoreCountry] = useState<any>(null);
  const [countryLoading, setCountryLoading] = useState(true);

  // Fetch all categories using useList
  const { data: categoriesData } = useList({
    resource: "categories",
  });

  // Category selection states
  const [initialSelectedCategoryIds, setInitialSelectedCategoryIds] = useState<number[]>([]);
  const [currentSelectedCategoryIds, setCurrentSelectedCategoryIds] = useState<number[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Profile picture upload states
  const [profileURL, setProfileURL] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [profileUploadLoading, setProfileUploadLoading] = useState(false);
  const [originalProfileURL, setOriginalProfileURL] = useState('');

  // Cover picture upload states
  const [coverURL, setCoverURL] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverUploadLoading, setCoverUploadLoading] = useState(false);
  const [originalCoverURL, setOriginalCoverURL] = useState('');

  const { open } = useNotificationProvider();

  // Update document title when store data is loaded
  useEffect(() => {
    if (query?.data?.data?.title) {
      document.title = `Edit ${query.data.data.title} - Store`;
    }
  }, [query?.data?.data?.title]);

  // Fetch store's country and existing category relationships when store data is loaded
  useEffect(() => {
    const fetchStoreData = async () => {
      if (query?.data?.data?.id) {
        const storeId = query.data.data.id;
        const countryId = query.data.data.country_id;
        
        // Fetch store's country
        if (countryId) {
          try {
            const { data: country, error: countryError } = await supabase
              .from('countries')
              .select('*')
              .eq('id', countryId)
              .single();

            if (countryError) {
              console.error('Error fetching store country:', countryError);
            } else {
              setStoreCountry(country);
            }
          } catch (error) {
            console.error('Error fetching store country:', error);
          }
        }
        setCountryLoading(false);
        
        // Fetch store categories
        try {
          const { data: storeCategories, error } = await supabase
            .from('store_categories')
            .select('category_id')
            .eq('store_id', storeId);

          if (error) {
            console.error('Error fetching store categories:', error);
            return;
          }

          const categoryIds = storeCategories?.map((sc: any) => sc.category_id) || [];
          setInitialSelectedCategoryIds(categoryIds);
          setCurrentSelectedCategoryIds(categoryIds);
          setCategoriesLoaded(true);
        } catch (error) {
          console.error('Error fetching store categories:', error);
          setCategoriesLoaded(true);
        }
      }
    };

    fetchStoreData();
  }, [query?.data?.data?.id]);





  // Set initial values when data is loaded
  useEffect(() => {
    if (query?.data?.data) {
      const storeData = query.data.data;
      console.log('Store data loaded:', storeData);
      
      // Set original URLs for deletion purposes
      setOriginalProfileURL(storeData.profile_picture_url || '');
      setOriginalCoverURL(storeData.cover_picture_url || '');
      
      // Set current URLs for display
      setProfileURL(storeData.profile_picture_url || '');
      setCoverURL(storeData.cover_picture_url || '');
      
      // Set previews if URLs exist
      if (storeData.profile_picture_url) {
        setProfilePreview(storeData.profile_picture_url);
      }
      if (storeData.cover_picture_url) {
        setCoverPreview(storeData.cover_picture_url);
        console.log('Cover picture URL found and set:', storeData.cover_picture_url);
      } else {
        console.log('No cover picture URL in store data');
      }
    }
  }, [query?.data]);



  const handleProfileFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      const selectedFile = info.fileList[0].originFileObj;
      setProfileFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setProfilePreview(previewUrl);
    }
  };

  const handleProfileDelete = () => {
    setProfileURL('');
    setProfilePreview('');
    setProfileFile(null);
  };

  const handleCoverFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      const selectedFile = info.fileList[0].originFileObj;
      setCoverFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setCoverPreview(previewUrl);
    }
  };

  const handleCoverDelete = () => {
    setCoverURL('');
    setCoverPreview('');
    setCoverFile(null);
  };

  const handleSave = async (values: any) => {
    let finalProfileURL = profileURL;
    let finalCoverURL = coverURL;

    // Upload profile picture if new file is selected
    if (profileFile) {
      setProfileUploadLoading(true);
      const slug = values.slug || 'store';
      const fileExtension = profileFile.name.split('.').pop();
      const fileName = `${slug}_pfp.${fileExtension}`;

      // Delete old profile picture if it exists
      if (originalProfileURL) {
        const oldFileName = extractFileNameFromUrl(originalProfileURL);
        
        await supabase.storage
          .from('store-assets')
          .remove([`profile-pictures/${oldFileName}`]);
      }

      const { data: uploadData, error } = await supabase.storage
        .from('store-assets')
        .upload(`profile-pictures/${fileName}`, profileFile);

      if (error) {
        message.error(`Failed to upload profile picture: ${error.message}`);
        setProfileUploadLoading(false);
        return;
      }

      const { data: signedURLData, error: signedURLError } = await supabase.storage
        .from('store-assets')
        .createSignedUrl(`profile-pictures/${fileName}`, 3153600000); // 1-year expiration

      if (signedURLError) {
        message.error('Failed to generate signed URL for profile picture');
        setProfileUploadLoading(false);
        return;
      }

      finalProfileURL = signedURLData.signedUrl;
      setProfileUploadLoading(false);
    }

    // Upload cover picture if new file is selected
    if (coverFile) {
      setCoverUploadLoading(true);
      const slug = values.slug || 'store';
      const fileExtension = coverFile.name.split('.').pop();
      const fileName = `${slug}_cover.${fileExtension}`;

      // Delete old cover picture if it exists
      if (originalCoverURL) {
        const oldFileName = extractFileNameFromUrl(originalCoverURL);
        
        await supabase.storage
          .from('store-assets')
          .remove([`covers/${oldFileName}`]);
      }

      const { data: uploadData, error } = await supabase.storage
        .from('store-assets')
        .upload(`covers/${fileName}`, coverFile);

      if (error) {
        message.error(`Failed to upload cover picture: ${error.message}`);
        setCoverUploadLoading(false);
        return;
      }

      const { data: signedURLData, error: signedURLError } = await supabase.storage
        .from('store-assets')
        .createSignedUrl(`covers/${fileName}`, 3153600000); // 1-year expiration

      if (signedURLError) {
        message.error('Failed to generate signed URL for cover picture');
        setCoverUploadLoading(false);
        return;
      }

      finalCoverURL = signedURLData.signedUrl;
      setCoverUploadLoading(false);
    }

    if (profileFile) {
      open({
        type: "success",
        message: "New profile picture uploaded successfully",
        description: "Upload Success",
      });
      setProfileUploadLoading(false);
    }

    if (coverFile) {
      open({
        type: "success",
        message: "New cover image uploaded successfully",
        description: "Upload Success",
      });
      setCoverUploadLoading(false);
    }

    // Handle category relationships
    const storeId = query?.data?.data?.id;
    if (storeId) {
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
            .from('store_categories')
            .delete()
            .eq('store_id', storeId)
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
            .from('store_categories')
            .insert(
              addedCategoryIds.map((categoryId: number) => ({
                store_id: storeId,
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
      await formProps.onFinish({ 
        ...values, 
        profile_picture_url: finalProfileURL,
        cover_picture_url: finalCoverURL 
      });
    } else {
      message.error("Form submit function not available");
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
      isLoading={formLoading || profileUploadLoading || coverUploadLoading}
    >
      <Form {...formProps} layout="vertical" onFinish={handleSave}>
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

        <Form.Item
          label="Country"
          name="country_id"
          rules={[{ required: true, message: "Please select a country" }]}
        >
          <Select
            placeholder="Select a country"
            loading={countryLoading}
            disabled={true}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              const label = option?.label || option?.children;
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            {storeCountry && (
              <Select.Option key={storeCountry.id} value={storeCountry.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={storeCountry.image_url} 
                    alt={storeCountry.value}
                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                  />
                  <span>{storeCountry.value}</span>
                </div>
              </Select.Option>
            )}
          </Select>
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

        {!profilePreview ? (
          <Form.Item
            label="Profile Picture"
            rules={[
              {
                required: true,
                message: "Profile picture is required"
              },
            ]}
          >
            <Upload
              beforeUpload={() => false} // Prevent automatic upload
              onChange={handleProfileFileChange}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Choose Image</Button>
            </Upload>
          </Form.Item>
        ) : (
          <>
            <Form.Item label="Profile Picture Preview">
              <img 
                src={profilePreview} 
                alt="Preview" 
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: "8px",
                  objectFit: 'cover'
                }} 
              />
            </Form.Item>

            <Form.Item>
              <Upload
                beforeUpload={() => false} // Prevent automatic upload
                onChange={handleProfileFileChange}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Change Image</Button>
              </Upload>
              <Button 
                onClick={handleProfileDelete}
                style={{ marginLeft: '8px' }}
              >
                Delete Image
              </Button>
            </Form.Item>
          </>
        )}

        {!coverPreview ? (
          <Form.Item
            label="Cover Picture"
            rules={[
              {
                required: false,
                message: "Cover picture is optional"
              },
            ]}
          >
            <Upload
              beforeUpload={() => false} // Prevent automatic upload
              onChange={handleCoverFileChange}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Choose Cover Image</Button>
            </Upload>
          </Form.Item>
        ) : (
          <>
            <Form.Item label="Cover Picture Preview">
              <img 
                src={coverPreview} 
                alt="Cover Preview" 
                style={{ 
                  width: '200px', 
                  height: '100px', 
                  borderRadius: "8px",
                  objectFit: 'cover'
                }} 
              />
            </Form.Item>

            <Form.Item>
              <Upload
                beforeUpload={() => false} // Prevent automatic upload
                onChange={handleCoverFileChange}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Change Cover Image</Button>
              </Upload>
              <Button 
                onClick={handleCoverDelete}
                style={{ marginLeft: '8px' }}
              >
                Delete Cover Image
              </Button>
            </Form.Item>
          </>
        )}
      </Form>
    </Edit>
  );
}; 