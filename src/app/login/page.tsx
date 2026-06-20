import { redirect } from "next/navigation";

/** E-posta girişi — ana giriş welcome ekranında */
export default function LoginPage() {
  redirect("/welcome");
}
