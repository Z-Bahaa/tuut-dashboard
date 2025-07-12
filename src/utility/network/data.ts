
import { supabaseClient as supabase } from '../supabaseClient';

export const fetchCurrencyList= async () => {
  const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'currency' });
  if(error) {
    console.error('Error while fetching currency list');
    return [];
  }
  const codeList = data.map((item: any) => item.enum_value  )
  return codeList
}