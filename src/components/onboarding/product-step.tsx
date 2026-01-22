'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { productFormSchema, type ProductFormData, parseCommaSeparated, formatAsCommaSeparated } from '@/lib/validations/product'
import { generateProductFromUrl, saveProduct } from '@/actions/products'
import { Sparkles, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ProductStepProps {
  onComplete: () => void
}

export function ProductStep({ onComplete }: ProductStepProps) {
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

  // For keywords and subreddits input as comma-separated strings
  const [keywordsInput, setKeywordsInput] = useState('')
  const [subredditsInput, setSubredditsInput] = useState('')

  async function handleGenerate() {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    // Validate URL format
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
      // Populate form with generated data
      form.setValue('name', result.data.name)
      form.setValue('description', result.data.description)
      form.setValue('keywords', result.data.keywords)
      form.setValue('subreddits', result.data.subreddits)
      setKeywordsInput(formatAsCommaSeparated(result.data.keywords))
      setSubredditsInput(formatAsCommaSeparated(result.data.subreddits))
      toast.success('Product details generated!')
    } else {
      // Show error but allow manual entry
      setGenerationError(result.error || 'Could not generate details')
      toast.error(result.error || 'Generation failed. Please fill in manually.')
    }

    setGenerating(false)
  }

  async function onSubmit(data: ProductFormData) {
    setSaving(true)

    // Parse comma-separated inputs to arrays
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
      onComplete()
    } else {
      toast.error(result.error || 'Failed to save product')
    }

    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Add Your First Product</h3>
        <p className="text-muted-foreground">
          Enter your product URL and we&apos;ll automatically generate the details.
        </p>
      </div>

      {/* URL Input */}
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

      {/* Generation error hint */}
      {generationError && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-yellow-800 dark:text-yellow-200">
            {generationError}. You can fill in the details manually below.
          </span>
        </div>
      )}

      {/* Product Form (shows after URL entered) */}
      {showForm && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    {generating ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Input placeholder="e.g., Acme Analytics" {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    {generating ? (
                      <Skeleton className="h-20 w-full" />
                    ) : (
                      <Textarea
                        placeholder="Brief description of what your product does..."
                        className="resize-none"
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keywords */}
            <div className="space-y-2">
              <FormLabel>Keywords</FormLabel>
              {generating ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <Input
                    placeholder="analytics, metrics, dashboard, reporting (comma-separated)"
                    value={keywordsInput}
                    onChange={(e) => {
                      setKeywordsInput(e.target.value)
                      form.setValue('keywords', parseCommaSeparated(e.target.value))
                    }}
                  />
                  {keywordsInput && (
                    <div className="flex flex-wrap gap-1 mt-2">
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
                </>
              )}
              {form.formState.errors.keywords && (
                <p className="text-sm text-destructive">{form.formState.errors.keywords.message}</p>
              )}
            </div>

            {/* Subreddits */}
            <div className="space-y-2">
              <FormLabel>Subreddits to Monitor</FormLabel>
              {generating ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <Input
                    placeholder="SaaS, startups, Entrepreneur (comma-separated, without r/)"
                    value={subredditsInput}
                    onChange={(e) => {
                      setSubredditsInput(e.target.value)
                      form.setValue('subreddits', parseCommaSeparated(e.target.value))
                    }}
                  />
                  {subredditsInput && (
                    <div className="flex flex-wrap gap-1 mt-2">
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
                </>
              )}
              {form.formState.errors.subreddits && (
                <p className="text-sm text-destructive">{form.formState.errors.subreddits.message}</p>
              )}
            </div>

            <Button type="submit" disabled={saving || generating} className="w-full">
              {saving ? 'Saving...' : 'Save Product & Complete Onboarding'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}
