import { redirect } from "next/navigation";

export default function TenantForgotPasswordRedirect() {
  redirect("/forgot-password");
}
