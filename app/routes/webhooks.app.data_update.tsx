import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createOrUpdate } from "app/models/order";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { payload, session, topic, shop } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    switch (topic) {
        case "ORDERS_CREATE":
          console.log("ORDERS_CREATE event");
          if (session) {
            const {
              id: orderId,
              order_number: orderNumber,
              total_price: totalPrice,
              payment_gateway_names: paymentGateway,
              tags,
              customer: { email, first_name, last_name, default_address: { address1, city, country } }
            } = payload as any;

            const response = await createOrUpdate({
              orderId: orderId.toString(),
              orderNumber,
              totalPrice,
              paymentGateway: paymentGateway.join(","),
              tags,
              customerAddress: `${address1}, ${city}, ${country}`,
              customerEmail: email,
              customerFullName: `${first_name} ${last_name}`,
            });
            console.log(response);
          }
          break;
        default:
          console.log('Unsubscribed/Invalid topic!')
      }


    return new Response();
};