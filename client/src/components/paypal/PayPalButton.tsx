// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onCancel?: (data: any) => void;
  cartItems?: any[]; // Add cart items for order creation
}

export default function PayPalButton({
  amount,
  currency,
  intent,
  onSuccess,
  onError,
  onCancel,
  cartItems
}: PayPalButtonProps) {
  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
      cartItems: cartItems || []
    };
    const response = await fetch("/api/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId: string) => {
    try {
      console.log(`Capturing order ${orderId}`);
      
      // Include cart items in capture request to associate with the order
      const payload = {
        cartItems: cartItems || [],
        customerEmail: (window as any).userEmail // This will be populated by Checkout component
      };
      
      const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      // Check for network errors
      if (!response.ok) {
        console.warn(`PayPal capture returned status ${response.status}`);
        
        // Try to get the error details from the response
        const errorData = await response.json();
        console.error('PayPal capture error:', errorData);
        
        // If this is an already captured order, we can consider it a success
        // Our backend should handle this case and return the existing order data
        if (errorData.details && 
            Array.isArray(errorData.details) && 
            errorData.details.some((detail: any) => detail.issue === 'ORDER_ALREADY_CAPTURED')) {
          console.log('Order was already captured, treating as success');
          return errorData;
        }
        
        throw new Error(`Failed to capture order: ${JSON.stringify(errorData)}`);
      }
      
      // Successfully captured
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    try {
      const orderData = await captureOrder(data.orderId);
      console.log("Capture result", orderData);
      
      if (orderData && orderData.status === 'COMPLETED') {
        console.log("Payment successful:", orderData);
      }
      
      if (onSuccess) {
        onSuccess(orderData);
      }
    } catch (err) {
      console.error("Error capturing order:", err);
      if (onError) {
        onError(err);
      }
    }
  };

  const handleCancel = async (data: any) => {
    console.log("onCancel", data);
    if (onCancel) {
      onCancel(data);
    }
  };

  const handleError = async (data: any) => {
    console.log("onError", data);
    if (onError) {
      onError(data);
    }
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
        if (onError) {
          onError(e);
        }
      }
    };

    loadPayPalSDK();
  }, []);
  
  const initPayPal = async () => {
    try {
      const clientToken: string = await fetch("/api/paypal/setup")
        .then((res) => res.json())
        .then((data) => {
          return data.clientToken;
        });
      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
            sdkInstance.createPayPalOneTimePaymentSession({
              onApprove,
              onCancel: handleCancel,
              onError: handleError,
            });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error(e);
          if (onError) {
            onError(e);
          }
        }
      };

      const paypalButton = document.getElementById("paypal-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error(e);
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <div className="w-full py-2">
      <paypal-button 
        id="paypal-button" 
        className="w-full h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md"
      >
        <span className="font-medium">Pay with PayPal</span>
      </paypal-button>
    </div>
  );
}
// <END_EXACT_CODE>