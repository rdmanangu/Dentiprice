export type Procedure = {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  estimated_duration_mins: number;
  image_url: string | null;
};
