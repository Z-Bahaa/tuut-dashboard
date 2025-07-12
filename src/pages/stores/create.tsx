import { Create, useForm, useNotificationProvider } from "@refinedev/antd";
import { Form, Input, Button, Switch, Select, Upload, message } from "antd";
import { SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { useContext, useState } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { useList } from "@refinedev/core";
import { supabaseClient as supabase } from "../../utility/supabaseClient";

export const StoreCreate = () => {
  const { mode } = useContext(ColorModeContext);
  const { formProps, saveButtonProps } = useForm({
    resource: "stores",
  });

  // Fetch all countries using useList
  const { data: countriesData } = useList({
    resource: "countries",
  });

  // Profile picture upload states
  const [profileURL, setProfileURL] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [profileUploadLoading, setProfileUploadLoading] = useState(false);

  // Cover picture upload states
  const [coverURL, setCoverURL] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverUploadLoading, setCoverUploadLoading] = useState(false);

  const { open } = useNotificationProvider();

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

    // Upload profile picture
    if (profileFile) {
      setProfileUploadLoading(true);
      const slug = values.slug || 'store';
      const fileExtension = profileFile.name.split('.').pop();
      const fileName = `${slug}_pfp.${fileExtension}`;

      await supabase.storage
        .from('store-assets')
        .remove([`profile-pictures/${fileName}`]);

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
    } else {
      open({
        type: "error",
        description: "Profile picture is required",
        message: "Please upload a profile picture",
      });
      return;
    }

    // Upload cover picture
    if (coverFile) {
      setCoverUploadLoading(true);
      const slug = values.slug || 'store';
      const fileExtension = coverFile.name.split('.').pop();
      const fileName = `${slug}_cover.${fileExtension}`;

      await supabase.storage
        .from('store-assets')
        .remove([`covers/${fileName}`]);

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

    open({
      type: "success",
      message: "Images uploaded successfully",
      description: "Upload Success",
    });

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
    <Create
      saveButtonProps={{ 
        ...saveButtonProps, 
        onClick: () => formProps.form?.submit(),
        style: {
          color: mode === "dark" ? "#000000" : "#ffffff"
        }
      }}
      isLoading={profileUploadLoading || coverUploadLoading}
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
    </Create>
  );
}; 