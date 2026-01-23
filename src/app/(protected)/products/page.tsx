import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserProducts } from '@/actions/products'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink } from 'lucide-react'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const products = await getUserProducts()

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your products and monitoring settings
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any products yet.
            </p>
            <Button asChild>
              <Link href="/products/new">Add your first product</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      <Link
                        href={`/products/${product.id}`}
                        className="hover:underline"
                      >
                        {product.name}
                      </Link>
                    </CardTitle>
                    {product.url && (
                      <CardDescription className="flex items-center gap-1">
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {new URL(product.url).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </CardDescription>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/products/${product.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {product.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {product.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {product.subreddits.slice(0, 5).map((sub: string) => (
                    <Badge key={sub} variant="secondary" className="text-xs">
                      r/{sub}
                    </Badge>
                  ))}
                  {product.subreddits.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{product.subreddits.length - 5} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
