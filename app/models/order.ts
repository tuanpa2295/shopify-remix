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

export async function getOrder(id: number) {
  const orderRecord = await prisma.order.findFirst({ where: { id } });

  if (!orderRecord) {
    return null;
  }

  return orderRecord;
}

export async function getOrders() {
  const orders = await prisma.order.findMany({
    where: {},
    orderBy: { id: "desc" },
  });

  return orders;
}

export async function deleteOrder(orderId: string) {
  const existOrder = await prisma.order.findFirst({ where: { orderId } });

  if(existOrder) {
    await prisma.order.delete({ where: { id: existOrder.id } });
  } else {
    console.log("Not Found Order Id: ", orderId)
  }
}
