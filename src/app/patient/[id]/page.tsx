import PatientDetailClientPage from './components/PatientDetailClientPage';

// 렌더링 오류 방지를 위해 async/await 패턴으로 변경
export default async function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const awaitedParams = await params;
  return <PatientDetailClientPage patientId={awaitedParams.id} />;
}
