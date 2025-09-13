import ProductDetail from "./ProductDetail";

export default function Page({ params }: { params: { idProduct: string } }) {
  return <ProductDetail idProduct={params.idProduct} />;
}
