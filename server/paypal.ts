// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";

/* PayPal Controllers Setup */

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;

if (!PAYPAL_CLIENT_ID) {
  throw new Error("Missing PAYPAL_CLIENT_ID");
}
if (!PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PAYPAL_CLIENT_SECRET");
}
const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  timeout: 0,
  environment:
                process.env.NODE_ENV === "production"
                  ? Environment.Production
                  : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});
const ordersController = new OrdersController(client);
const oAuthAuthorizationController = new OAuthAuthorizationController(client);

/* Token generation helpers */

export async function getClientToken() {
  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const { result } = await oAuthAuthorizationController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/*  Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent, cartItems, customerEmail } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    // Get user email from the authenticated user if available and not provided
    let email = customerEmail;
    if (!email && req.user && (req.user as any).email) {
      email = (req.user as any).email;
    }

    // Basic PayPal order creation payload
    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
            // Add customer details if we have an email
            ...(email && {
              payee: {
                email_address: email
              }
            })
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

// Helper function to check if an order is already captured
async function checkOrderStatus(orderId: string) {
  try {
    // We'll use the same approach as in routes.ts getPaypalOrderStatus function
    // Get auth token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
    ).toString("base64");

    // Get a PayPal access token for API request
    const response = await fetch(
      `https://${process.env.NODE_ENV === 'production' ? 'api' : 'api.sandbox'}.paypal.com/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get auth token: ${await response.text()}`);
    }
    
    const tokenData = await response.json() as { access_token: string };
    const accessToken = tokenData.access_token;
    
    // Now use the token to get order status
    const orderResponse = await fetch(
      `https://${process.env.NODE_ENV === 'production' ? 'api' : 'api.sandbox'}.paypal.com/v2/checkout/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!orderResponse.ok) {
      throw new Error(`Failed to get order status: ${await orderResponse.text()}`);
    }
    
    const orderDetails = await orderResponse.json();
    console.log(`Checking status for PayPal order ${orderId}: ${orderDetails.status}`);

    // Check if the order has captures in the purchase units
    const hasCaptured = orderDetails.purchase_units?.some((unit: any) => 
      unit.payments?.captures?.length > 0
    );

    if (hasCaptured) {
      console.log(`Order ${orderId} has already been captured`);
      return { 
        alreadyCaptured: true, 
        orderDetails 
      };
    }

    return { 
      alreadyCaptured: false, 
      orderDetails 
    };
  } catch (error) {
    console.error(`Error checking order status for ${orderId}:`, error);
    throw error;
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    console.log(`Attempting to capture PayPal order: ${orderID}`);

    // First check if the order is already captured
    try {
      const { alreadyCaptured, orderDetails } = await checkOrderStatus(orderID);
      
      if (alreadyCaptured) {
        console.log(`Order ${orderID} is already captured, returning existing details`);
        return res.status(200).json(orderDetails);
      }
    } catch (statusError) {
      // If we can't check the status, we'll try to capture anyway
      console.warn(`Could not check order status (continuing with capture): ${statusError}`);
    }

    // If not already captured, proceed with capture
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    console.log(`PayPal order ${orderID} captured successfully with status ${httpStatusCode}`);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error: any) {
    console.error("Failed to capture order:", error);
    
    // Check if this is an ORDER_ALREADY_CAPTURED error
    if (error.toString && error.toString().includes('ORDER_ALREADY_CAPTURED')) {
      console.log(`Order ${req.params.orderID} was already captured. Retrieving order details.`);
      
      try {
        // If it's already captured, use our checkOrderStatus function to get details
        const { orderDetails } = await checkOrderStatus(req.params.orderID);
        return res.status(200).json(orderDetails);
      } catch (detailsError) {
        console.error("Failed to get details for already captured order:", detailsError);
      }
    }
    
    res.status(500).json({ error: "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  const clientToken = await getClientToken();
  res.json({
    clientToken,
  });
}
// <END_EXACT_CODE>