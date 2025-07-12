export const extractFileNameFromUrl = (url: string) => {
  const parsedUrl = new URL(url);
  
  const pathname = parsedUrl.pathname;
  
  const fileName = pathname.substring(pathname.lastIndexOf('/') + 1);
  
  return fileName; 
};

export const formatTimestamp = (timestamp: any) => {
  const date = new Date(timestamp); 
  
  const month = date.toLocaleString('default', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
};