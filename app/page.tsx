import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to gallery as the main page
  redirect("/gallery")
}
