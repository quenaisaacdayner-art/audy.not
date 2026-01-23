'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  personaFormSchema,
  TONE_PRESETS,
  type PersonaFormData,
} from '@/lib/validations/persona'
import { savePersona } from '@/actions/persona'

interface PersonaStepProps {
  onComplete: () => void
  initialData?: Partial<PersonaFormData>
}

export function PersonaStep({ onComplete, initialData }: PersonaStepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PersonaFormData>({
    resolver: zodResolver(personaFormSchema),
    defaultValues: {
      expertise: initialData?.expertise || '',
      tone: initialData?.tone || 'Professional',
      customTone: initialData?.customTone || '',
      phrasesToAvoid: initialData?.phrasesToAvoid || '',
      targetAudience: initialData?.targetAudience || '',
    },
  })

  const selectedTone = form.watch('tone')

  async function onSubmit(data: PersonaFormData) {
    setLoading(true)
    setError(null)

    const result = await savePersona(data)

    if (result.success) {
      onComplete()
    } else {
      setError(result.error || 'Something went wrong')
    }

    setLoading(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Expertise</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., I'm a developer who builds productivity tools for remote teams"
                  className="min-h-24 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Communication Tone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TONE_PRESETS.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedTone === 'Custom' && (
          <FormField
            control={form.control}
            name="customTone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Tone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Thoughtful and encouraging"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="phrasesToAvoid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phrases to Avoid</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., honestly, to be honest, game-changer, synergy"
                  className="min-h-20 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Startup founders and indie hackers looking to grow their SaaS"
                  className="min-h-24 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Complete Setup'}
        </Button>
      </form>
    </Form>
  )
}
