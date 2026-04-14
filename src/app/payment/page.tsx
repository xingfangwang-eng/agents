'use client';

import React, { useState } from 'react';
import PayPalButtonsComponent from '@/components/PayPalButtons';

const PaymentPage = () => {
  const [selectedProduct, setSelectedProduct] = useState('featured_listing');
  const [amount, setAmount] = useState('49.00');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [orderId, setOrderId] = useState('');

  const handlePaymentSuccess = (orderId: string) => {
    setOrderId(orderId);
    setPaymentStatus('success');
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    setPaymentStatus('error');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment</h1>

        {paymentStatus === 'success' ? (
          <div className="border border-green-500 bg-green-50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">Payment Successful!</h2>
            <p className="mb-4">Thank you for your payment. Your order has been processed successfully.</p>
            <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
          </div>
        ) : paymentStatus === 'error' ? (
          <div className="border border-red-500 bg-red-50 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">Payment Failed</h2>
            <p className="mb-4">There was an error processing your payment. Please try again.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Select Product</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    name="product"
                    value="featured_listing"
                    checked={selectedProduct === 'featured_listing'}
                    onChange={() => {
                      setSelectedProduct('featured_listing');
                      setAmount('49.00');
                    }}
                    className="h-4 w-4"
                  />
                  <div>
                    <h3 className="font-medium">Featured Listing</h3>
                    <p className="text-sm text-muted-foreground">Get your tool featured on the homepage</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    name="product"
                    value="premium_template"
                    checked={selectedProduct === 'premium_template'}
                    onChange={() => {
                      setSelectedProduct('premium_template');
                      setAmount('29.00');
                    }}
                    className="h-4 w-4"
                  />
                  <div>
                    <h3 className="font-medium">Premium Templates Pack</h3>
                    <p className="text-sm text-muted-foreground">Access to premium prompt templates</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Payment Amount</h2>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-2xl font-bold">${amount}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Pay with PayPal</h2>
              <PayPalButtonsComponent
                amount={amount}
                itemType={selectedProduct}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;