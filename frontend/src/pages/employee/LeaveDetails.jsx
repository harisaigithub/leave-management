import { useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";

export default function LeaveDetails() {
  const { id } = useParams();
  return (
    <AppLayout title={`Leave request #${id}`}>
      <div className="card p-6 text-sm text-muted">Leave detail view — built in Step 6.</div>
    </AppLayout>
  );
}
