import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Card, EmptyState, Layout, Page, IndexTable, List } from "@shopify/polaris";
import type { Order } from "@prisma/client";
import { getOrders } from "app/models/order";
import { NonEmptyArray } from "@shopify/polaris/build/ts/src/types";

export async function loader({ request, params }: { request: any, params: any }) {
  const { admin, session } = await authenticate.admin(request);
  const orders = await getOrders();

  const response = await admin.graphql(
    `#graphql
      query OrdersCount {
        ordersCount(limit: 2000) {
          count
          precision
      }
    }`,
  );

  const { data: {
    ordersCount: {
      count
    }
  } }  = await response.json();

  return json({
    orders,
    count,
  });
}

const EmptyQRCodeState = () => (
  <EmptyState image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png">
    <p>No order found!</p>
  </EmptyState>
);

export function formatOrderNumber(orderNumber: string) {
  return `#${orderNumber}`;
}



export function formatPrice(price: number) {
  const locale = "en-US";
  const regionCurrency = "usd";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: regionCurrency,
  }).format(price);
}

const OrderTable = ({ orders }: { orders: Order[] }) => (
  <div style={{padding: '15px', height: '100%'}}>
    <IndexTable
      itemCount={orders.length}
      headings={[
        { title: "Order Id" },
        { title: "Order Number" },
        { title: "Customer Name" },
        { title: "Email" },
        { title: "Address" },
        { title: "Total Price" },
        { title: "Date created" },
        { title: "Tags" },
        { title: "" },
      ]}
      selectable={false}
    >
      {orders.map((order: Order) => (
        <OrderTableRow order={order} key={order.id} />
      ))}
    </IndexTable>

  </div>
);

type HeaderItem = { title: string };

const header: NonEmptyArray<HeaderItem> = [
  { title: "Order Id" },
  { title: "Order Number" },
  { title: "Total Price" },
  { title: "Payment Gateway" },
  { title: "Customer Email" },
  { title: "Customer Full Name" },
  { title: "Customer Address" },
  { title: "Tags" },
  { title: "Created At" },
  { title: "Action" }
] as NonEmptyArray<HeaderItem>;

const exportCSV = (orders: Order[]) => {
  const rows = orders
    .map(
      ({
        orderId,
        orderNumber,
        totalPrice,
        paymentGateway,
        customerEmail,
        customerFullName,
        customerAddress,
        tags,
        createdAt,
      }) =>
        [
          orderId,
          orderNumber,
          totalPrice,
          paymentGateway,
          customerEmail,
          `"${customerFullName}"`,
          `"${customerAddress}"`,
          `"${tags}"`,
          createdAt,
        ].join(","),
    )
    .join("\n");
  const headers = header.slice(0, -1).map((item: HeaderItem) => item.title).join(",")  + "\n";
  const csvContent = headers + rows

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "order-list.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const OrderTableRow = ({ order }: { order: Order }) => {
  const orderUrl = `https://admin.shopify.com/store/tuanpa-application/orders/${order.orderId}`;
  return (
    <IndexTable.Row id={order.id.toString()} position={order.id}>
      <IndexTable.Cell>
        <Link to={`${orderUrl}`} target="_blank">
          {order.orderId}
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>{order.orderNumber}</IndexTable.Cell>
      <IndexTable.Cell>{order.customerFullName}</IndexTable.Cell>
      <IndexTable.Cell>{order.customerEmail}</IndexTable.Cell>
      <IndexTable.Cell>{order.customerAddress}</IndexTable.Cell>
      <IndexTable.Cell>{order.totalPrice}</IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(order.createdAt).toDateString()}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {/* {order.tags} */}
        <List type="bullet">
          {order.tags && order.tags?.split(',').length > 0 ? (
            order.tags.split(',').map((tag, index) => (
              <List.Item key={index}>{tag}</List.Item>
            ))
          ) : (
              <></>
            )}
        </List>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Link to={`/app/order/edit/${order.orderId}`}>Edit</Link>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
};

export default function Index() {
  const { orders }: { orders: any[] } = useLoaderData();
  const { count } : { count: number } = useLoaderData();
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {orders.length === 0 ? (
              <EmptyQRCodeState />
            ) : (
              <>
                <div style={
                  {padding: '15px'}
                }> Showing {orders.length} out of total { count } { count > 1 ? 'orders' : 'order' } created</div>
                <OrderTable orders={orders} />
              </>
            )}
          </Card>
        </Layout.Section>
        <Layout.Section>
          <ui-title-bar title="Orders List">
            <button variant="primary" onClick={() => exportCSV(orders)}>
              Export Order To CSV
            </button>
          </ui-title-bar>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
