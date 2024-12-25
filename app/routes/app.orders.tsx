import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Card, EmptyState, Layout, Page, IndexTable, List } from "@shopify/polaris";
import type { Order } from "@prisma/client";
import { getOrders } from "app/models/order";

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
      </Layout>
    </Page>
  );
}
