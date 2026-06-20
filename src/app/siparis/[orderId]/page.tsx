import { OrderTracker } from "@/components/marketplace/OrderTracker";

type Props = { params: Promise<{ orderId: string }> };

export default async function SiparisDetailPage({ params }: Props) {
  const { orderId } = await params;
  return <OrderTracker orderId={orderId} />;
}
