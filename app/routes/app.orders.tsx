import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Card, EmptyState, Layout, Page, IndexTable } from "@shopify/polaris";
import { Order } from "@prisma/client";
import { getOrders } from "app/models/order";

export async function loader({ request, params }: { request: any, params: any }) {
  const { admin, session } = await authenticate.admin(request);
  const orders = await getOrders();

  return json({
    orders,
  });
}

const EmptyQRCodeState = () => (
  <EmptyState image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png">
    <p>Allow customers to scan codes and buy products using their phones.</p>
  </EmptyState>
);

const OrderTable = ({ orders }: { orders: Order[] }) => (
  <IndexTable
    itemCount={orders.length}
    headings={[
      { title: "Order Id" },
      { title: "Order Number" },
      { title: "Customer Name" },
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
);

const OrderTableRow = ({ order }: { order: Order }) => {
  const orderUrl = `https://admin.shopify.com/store/tuanna2704-store1/orders/${order.orderId}`;

  return (
    <IndexTable.Row id={order.id.toString()} position={order.id}>
      <IndexTable.Cell>
        <Link to={`${orderUrl}`} target="_blank">
          {order.orderId}
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>{order.orderNumber}</IndexTable.Cell>
      <IndexTable.Cell>{order.customerFullName}</IndexTable.Cell>
      <IndexTable.Cell>{order.totalPrice}</IndexTable.Cell>
      <IndexTable.Cell>
        {new Date(order.createdAt).toDateString()}
      </IndexTable.Cell>
      <IndexTable.Cell>{order.tags}</IndexTable.Cell>
      <IndexTable.Cell>
        <Link to={`/app/orderEdit/${order.orderId}`}>Edit Tag</Link>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
};

const exportCSV = (orders: Order[]) => {
  // Create a Blob object with the CSV data
  const csvContent = orders
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
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a temporary anchor element and trigger a download
  const link = document.createElement("a");
  if (link.download !== undefined) {
    // feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "orders.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
export default function Index() {
  const { orders }: { orders: any[] } = useLoaderData();
  return (
    <Page>
      <ui-title-bar title="Order Table">
        <button variant="primary" onClick={() => exportCSV(orders)}>
          Export To CSV
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {orders.length === 0 ? (
              <EmptyQRCodeState />
            ) : (
              <OrderTable orders={orders} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
