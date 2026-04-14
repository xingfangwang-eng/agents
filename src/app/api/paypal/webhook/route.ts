import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PayPal webhook verification function
async function verifyWebhookSignature(req: NextRequest) {
  // In a production environment, you would verify the webhook signature
  // using the PayPal SDK and your webhook ID and secret
  // For now, we'll skip verification for development
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const isVerified = await verifyWebhookSignature(request);
    if (!isVerified) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const body = await request.json();
    const eventType = body.event_type;
    const resource = body.resource;

    // Handle payment capture completed event
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = resource.id;
      const amount = resource.amount.value;
      const customId = resource.purchase_units[0].custom_id;
      const description = resource.purchase_units[0].description;

      // Determine item type
      const itemType = description.includes('Featured Listing') ? 'featured_listing' : 'premium_template';

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          paypal_order_id: orderId,
          status: 'completed',
          item_type: itemType,
          tool_id: customId || null,
          amount: parseFloat(amount),
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
      }

      // Update tool status if it's a featured listing
      if (itemType === 'featured_listing' && customId) {
        const { error: updateError } = await supabase
          .from('tools')
          .update({ is_featured: true })
          .eq('id', customId);

        if (updateError) {
          console.error('Error updating tool status:', updateError);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PayPal webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}