import { WorkspaceGate } from "@/components/app/workspace-gate";

export default function RegisterGatePage() {
  return (
    <WorkspaceGate
      mode="register"
      title="Create a workspace"
      description="Pick a short slug for your workspace URL. You'll set up your landlord account on the next screen."
      submitLabel="Continue to register"
    />
  );
}
