'use server'

import { createClient } from '@/lib/supabase/server'
import { scrapeUrl } from '@/lib/firecrawl/client'
import { generateProductDetails as aiGenerateDetails } from '@/lib/openai/client'
import { productFormSchema, type ProductFormData, type ProductDetails } from '@/lib/validations/product'
import { revalidatePath } from 'next/cache'

export interface GenerateProductResult {
  success: boolean
  data?: ProductDetails
  partial?: boolean  // true if some fields could be generated
  error?: string
}

export async function generateProductFromUrl(url: string): Promise<GenerateProductResult> {
  // Step 1: Scrape the URL
  const scrapeResult = await scrapeUrl(url)

  if (!scrapeResult.success || !scrapeResult.content) {
    return {
      success: false,
      partial: true,
      error: scrapeResult.error || 'Could not scrape the URL. Please fill in the details manually.'
    }
  }

  // Step 2: Generate product details with AI
  const generationResult = await aiGenerateDetails(scrapeResult.content)

  if (!generationResult.success || !generationResult.data) {
    return {
      success: false,
      partial: true,
      error: generationResult.error || 'Could not generate product details. Please fill in manually.'
    }
  }

  return {
    success: true,
    data: generationResult.data
  }
}

export interface SaveProductResult {
  success: boolean
  productId?: string
  error?: string
}

export async function saveProduct(formData: ProductFormData & { url: string }): Promise<SaveProductResult> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const validationResult = productFormSchema.safeParse(formData)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || 'Invalid input'
    }
  }

  const data = validationResult.data

  // Insert product
  const { data: product, error: insertError } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description,
      url: formData.url || null,
      keywords: data.keywords,
      subreddits: data.subreddits,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Product save error:', insertError)
    return { success: false, error: 'Failed to save product' }
  }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard')

  return {
    success: true,
    productId: product.id
  }
}

export async function getUserProducts() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function getProduct(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)  // Ensure user owns product
    .single()

  return data
}

export async function updateProduct(
  id: string,
  formData: ProductFormData
): Promise<SaveProductResult> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Validate input
  const validationResult = productFormSchema.safeParse(formData)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0]?.message || 'Invalid input'
    }
  }

  const data = validationResult.data

  // Update product (RLS ensures user owns it)
  const { error: updateError } = await supabase
    .from('products')
    .update({
      name: data.name,
      description: data.description,
      keywords: data.keywords,
      subreddits: data.subreddits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Product update error:', updateError)
    return { success: false, error: 'Failed to update product' }
  }

  revalidatePath('/products')
  revalidatePath(`/products/${id}`)

  return { success: true, productId: id }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Product delete error:', deleteError)
    return { success: false, error: 'Failed to delete product' }
  }

  revalidatePath('/products')
  revalidatePath('/dashboard')

  return { success: true }
}
