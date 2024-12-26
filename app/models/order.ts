import type { Prisma } from '@prisma/client';

export const createOrUpdate = async (orderData: Prisma.OrderWhereInput) => {
  const { orderId, ...data } = orderData;
  try {
    const existingOrder = await prisma.order.findFirst({
      where: { orderId },
    })

    if (existingOrder) {
      return await prisma.order.update({ where: { orderId: orderId as string }, data: data as Prisma.OrderUpdateInput })
    } else {
      return await prisma.order.create({ data: orderData as Prisma.OrderCreateInput })
    }
  } catch (error) {
    console.error(error)
  }
}

export async function deleteOrder(orderId: string) {
  const existOrder = await prisma.order.findFirst({ where: { orderId } });

  if(existOrder) {
    await prisma.order.delete({ where: { orderId: existOrder.orderId } });
  } else {
    console.log(`Order Id: ${orderId} Not Found!`)
  }
}

export async function getOrder(orderId: string) {
  const orderRecord = await prisma.order.findFirst({ where: { orderId: String(orderId) } });
  if (!orderRecord) {
    return null;
  }

  return orderRecord;
}

export async function getOrders() {
  const orders = await prisma.order.findMany({
    where: {},
    orderBy: { orderId: "desc" },
  });

  return orders;
}


