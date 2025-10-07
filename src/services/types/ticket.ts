export type SupabaseTicket = {
  id: number;
  event_id: number;
  event_title: string;
  event_date: string;
  event_time: string;
  event_location: string;
  quantity: number;
  total_price: number;
  purchase_date: string;
  qr_code: string;
};