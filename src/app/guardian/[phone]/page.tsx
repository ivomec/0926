
import GuardianDetailPage from './components/GuardianDetailPage';

export default async function GuardianPage({
  params,
}: {
  params: { phone: string };
}) {
  // `params` is a promise in Next.js 15, so we need to await it.
  const awaitedParams = await params;
  const decodedPhone = decodeURIComponent(awaitedParams.phone);
  return <GuardianDetailPage phone={decodedPhone} />;
}
