// src/app/products/[idProduct]/page.tsx
import ProductDetail from "./ProductDetail"

interface ProductPageProps {
  params: {
    idProduct: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return <ProductDetail idProduct={params.idProduct} />
}
