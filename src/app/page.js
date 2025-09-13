import ShowCase from "../components/ShowCase";
import ProductList from "../components/ProductList";
import CommentList from "../components/CommentList";
import CategoryList from "../components/CategoryList";
import AboutMe from "../components/AboutMe";
/**
 * @typedef {Object} LandingData
 * @property {any[]} [showCase]
 * @property {any[]} [dataCategorys]
 * @property {any[]} [dataProducts]
 * @property {any[]} [featuredComments]
 */

export default async function LandingPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  let landingData = null;

  try {
    if (API_BASE_URL) {
      const res = await fetch(API_BASE_URL, { cache: "no-store" }); // no-store agar selalu fresh
      landingData = await res.json();
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }

  if (!landingData) {
    return <p className="p-4">Tidak dapat memuat data</p>;
  }

  return (
    <>
      <ShowCase data={landingData.showCase || []} />
      <CategoryList data={landingData.dataCategorys || []} />
      <ProductList data={landingData.dataProducts || []} />
      <AboutMe />
      <CommentList data={landingData.featuredComments || []} />
    </>
  );
}
