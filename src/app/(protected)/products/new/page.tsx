import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewProductForm } from './new-product-form'

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">
          Enter your product URL and we&apos;ll automatically generate the details.
        </p>
      </div>
      <NewProductForm />
    </div>
  )
}
