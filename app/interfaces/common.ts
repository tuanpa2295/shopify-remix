export interface PayloadProps {
  orderId: string;
  orderNumber: string;
  totalPrice: string;
  paymentGateway: string
  customerEmail: string;
  customerFullName: string;
  customerAddress: string
  tags: string;
}
