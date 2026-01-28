'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { productFormSchema, type ProductFormData, parseCommaSeparated, formatAsCommaSeparated } from '@/lib/validations/product'
import { generateProductFromUrl, saveProduct } from '@/actions/products'
import { Sparkles, X, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export function NewProductForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      keywords: [],
      subreddits: [],
    },
  })

  const [keywordsInput, setKeywordsInput] = useState('')
  const [subredditsInput, setSubredditsInput] = useState('')

  async function handleGenerate() {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    try {
      new URL(url)
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    setGenerating(true)
    setShowForm(true)
    setGenerationError(null)

    const result = await generateProductFromUrl(url)

    if (result.success && result.data) {
      form.setValue('name', result.data.name)
      form.setValue('description', result.data.description)
      form.setValue('keywords', result.data.keywords)
      form.setValue('subreddits', result.data.subreddits)
      setKeywordsInput(formatAsCommaSeparated(result.data.keywords))
      setSubredditsInput(formatAsCommaSeparated(result.data.subreddits))
      toast.success('Product details generated!')
    } else {
      setGenerationError(result.error || 'Could not generate details')
      toast.error(result.error || 'Generation failed. Please fill in manually.')
    }

    setGenerating(false)
  }

  async function onSubmit(data: ProductFormData) {
    setSaving(true)

    const keywords = parseCommaSeparated(keywordsInput)
    const subreddits = parseCommaSeparated(subredditsInput)

    const result = await saveProduct({
      ...data,
      keywords,
      subreddits,
      url,
    })

    if (result.success) {
      toast.success('Product saved!')
      router.push('/products')
    } else {
      toast.error(result.error || 'Failed to save product')
    }

    setSaving(false)
  }

  function handleSkipGeneration() {
    setShowForm(true)
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>

        {/* URL Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="https://yourproduct.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={generating}
              className="flex-1"
            />
            <Button onClick={handleGenerate} disabled={generating || !url.trim()}>
              {generating ? (
                'Generating...'
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={handleSkipGeneration}
              className="text-sm text-muted-foreground hover:underline"
            >
              Or fill in manually without URL
            </button>
          )}
        </div>

        {/* Generation error hint */}
        {generationError && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-yellow-800 dark:text-yellow-200">
              {generationError}. You can fill in the details manually below.
            </span>
          </div>
        )}

        {/* Product Form */}
        {showForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="e.g., Acme Analytics"
                          {...field}
                          disabled={generating}
                          className={generating ? 'opacity-0' : ''}
                        />
                        {generating && (
                          <Skeleton className="h-10 w-full absolute inset-0" />
                        )}
                      </div>
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
                      <div className="relative">
                        <Textarea
                          placeholder="Brief description of what your product does..."
                          className={`resize-none ${generating ? 'opacity-0' : ''}`}
                          {...field}
                          disabled={generating}
                        />
                        {generating && (
                          <Skeleton className="h-20 w-full absolute inset-0" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Keywords</FormLabel>
                <div className="relative">
                  <Input
                    placeholder="analytics, metrics, dashboard (comma-separated)"
                    value={keywordsInput}
                    onChange={(e) => {
                      setKeywordsInput(e.target.value)
                      form.setValue('keywords', parseCommaSeparated(e.target.value))
                    }}
                    disabled={generating}
                    className={generating ? 'opacity-0' : ''}
                  />
                  {generating && (
                    <Skeleton className="h-10 w-full absolute inset-0" />
                  )}
                </div>
                {!generating && keywordsInput && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parseCommaSeparated(keywordsInput).map((kw, i) => (
                      <Badge key={`kw-${i}`} variant="secondary" className="text-xs">
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
                <FormLabel>Subreddits to Monitor</FormLabel>
                <div className="relative">
                  <Input
                    placeholder="SaaS, startups, Entrepreneur (comma-separated)"
                    value={subredditsInput}
                    onChange={(e) => {
                      setSubredditsInput(e.target.value)
                      form.setValue('subreddits', parseCommaSeparated(e.target.value))
                    }}
                    disabled={generating}
                    className={generating ? 'opacity-0' : ''}
                  />
                  {generating && (
                    <Skeleton className="h-10 w-full absolute inset-0" />
                  )}
                </div>
                {!generating && subredditsInput && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parseCommaSeparated(subredditsInput).map((sub, i) => (
                      <Badge key={`sub-${i}`} variant="outline" className="text-xs">
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

              <Button type="submit" disabled={saving || generating} className="w-full">
                {saving ? 'Saving...' : 'Save Product'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
