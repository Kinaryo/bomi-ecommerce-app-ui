import ProductDetail from "./ProductDetail";

export default function ProductPage({ params }: { params: { idProduct: string } }) {
  return <ProductDetail idProduct={params.idProduct} />;
}
