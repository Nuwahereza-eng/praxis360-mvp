import { requireRole } from "@/lib/auth";
import { RaiseIssueForm } from "./RaiseIssueForm";

export default async function RaiseIssuePage() {
  await requireRole("STUDENT");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raise an Issue</h1>
        <p className="text-on-surface-variant text-sm">
          Every voice should lead somewhere. Your issue will be classified by AI and routed to the right department. You can correct the classification before submitting.
        </p>
      </div>
      <RaiseIssueForm />
    </div>
  );
}
