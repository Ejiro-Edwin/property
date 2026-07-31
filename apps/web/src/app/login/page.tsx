import { WorkspaceGate } from "@/components/app/workspace-gate";

export default function LoginGatePage() {
  return (
    <WorkspaceGate
      mode="login"
      title="Sign in to your workspace"
      description="Enter your workspace slug to continue. You'll sign in on the next screen."
      submitLabel="Continue to sign in"
    />
  );
}
