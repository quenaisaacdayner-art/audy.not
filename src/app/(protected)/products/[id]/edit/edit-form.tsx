'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { productFormSchema, type ProductFormData, parseCommaSeparated, formatAsCommaSeparated } from '@/lib/validations/product'
import { updateProduct } from '@/actions/products'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/types/database'

interface EditProductFormProps {
  product: Product
}

export function EditProductForm({ product }: EditProductFormProps) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const [keywordsInput, setKeywordsInput] = useState(formatAsCommaSeparated(product.keywords))
  const [subredditsInput, setSubredditsInput] = useState(formatAsCommaSeparated(product.subreddits))

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product.name,
      description: product.description || '',
      keywords: product.keywords,
      subreddits: product.subreddits,
    },
  })

  async function onSubmit(data: ProductFormData) {
    setSaving(true)

    const result = await updateProduct(product.id, {
      ...data,
      keywords: parseCommaSeparated(keywordsInput),
      subreddits: parseCommaSeparated(subredditsInput),
    })

    if (result.success) {
      toast.success('Product updated')
      router.push(`/products/${product.id}`)
    } else {
      toast.error(result.error || 'Failed to update product')
    }

    setSaving(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} className="resize-none" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Keywords</FormLabel>
          <Input
            placeholder="analytics, metrics, dashboard (comma-separated)"
            value={keywordsInput}
            onChange={(e) => {
              setKeywordsInput(e.target.value)
              form.setValue('keywords', parseCommaSeparated(e.target.value))
            }}
          />
          {keywordsInput && (
            <div className="flex flex-wrap gap-1">
              {parseCommaSeparated(keywordsInput).map((kw, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {kw}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = parseCommaSeparated(keywordsInput).filter((_, j) => j !== i)
                      setKeywordsInput(formatAsCommaSeparated(updated))
                      form.setValue('keywords', updated)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <FormLabel>Subreddits</FormLabel>
          <Input
            placeholder="SaaS, startups (comma-separated, without r/)"
            value={subredditsInput}
            onChange={(e) => {
              setSubredditsInput(e.target.value)
              form.setValue('subreddits', parseCommaSeparated(e.target.value))
            }}
          />
          {subredditsInput && (
            <div className="flex flex-wrap gap-1">
              {parseCommaSeparated(subredditsInput).map((sub, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  r/{sub}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = parseCommaSeparated(subredditsInput).filter((_, j) => j !== i)
                      setSubredditsInput(formatAsCommaSeparated(updated))
                      form.setValue('subreddits', updated)
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
