import { redirect } from 'next/navigation'

export default function InternalRootPage() {
  // Redirect to dashboard as the default internal page
  redirect('/dashboard')
}

