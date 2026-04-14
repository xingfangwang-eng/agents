import React, { useMemo } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

interface PayPalButtonsProps {
  amount: string;
  itemType: string;
  toolId?: string;
  onSuccess: (orderId: string) => void;
  onError: (error: any) => void;
}

const PayPalButtonsComponent: React.FC<PayPalButtonsProps> = ({
  amount,
  itemType,
  toolId,
  onSuccess,
  onError,
}) => {
  const initialOptions = useMemo(() => ({
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: 'USD',
    intent: 'capture' as const,
  }), []);

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: amount,
          },
          description: itemType === 'featured_listing' ? 'Featured Listing' : 'Premium Templates Pack',
          custom_id: toolId || '',
        },
      ],
    });
  };

  const onApprove = (data: any, actions: any) => {
    return actions.order.capture().then((details: any) => {
      onSuccess(data.orderID);
    });
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
        }}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButtonsComponent;