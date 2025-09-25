import PatientDetailClientPage from './components/PatientDetailClientPage';

export default async function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // `params` is a promise in Next.js 15, so we need to await it.
  const awaitedParams = await params;
  return <PatientDetailClientPage patientId={awaitedParams.id} />;
}
