import { z } from 'zod'

export const TONE_PRESETS = [
  'Professional',
  'Casual',
  'Friendly',
  'Technical',
  'Witty',
  'Custom',
] as const

export type TonePreset = typeof TONE_PRESETS[number]

export const personaFormSchema = z.object({
  expertise: z.string()
    .min(5, 'Please describe your expertise (at least 5 characters)')
    .max(500, 'Expertise description is too long'),
  tone: z.string()
    .min(1, 'Please select or enter a tone'),
  customTone: z.string()
    .max(100, 'Custom tone is too long')
    .optional(),
  phrasesToAvoid: z.string()
    .max(500, 'Phrases list is too long'),
  targetAudience: z.string()
    .min(5, 'Please describe your target audience (at least 5 characters)')
    .max(500, 'Target audience description is too long'),
}).refine(
  (data) => {
    // If tone is 'Custom', customTone must be provided
    if (data.tone === 'Custom') {
      return data.customTone && data.customTone.trim().length > 0
    }
    return true
  },
  {
    message: 'Please enter your custom tone',
    path: ['customTone'],
  }
)

export type PersonaFormData = z.infer<typeof personaFormSchema>
