import Link from "next/link";
import { Button } from "@/components/ui/button";
import { readStoreStatus } from "@/lib/store/read-store-status";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site/site-info";
import { getFeaturedProducts } from "@/lib/actions/menu";
import { getActivePromotions } from "@/lib/actions/promotions";
import Image from "next/image";

export default async function HomePage() {
  const [storeStatus, featuredProductsResult, activePromotions] = await Promise.all([
    readStoreStatus(),
    getFeaturedProducts(),
    getActivePromotions(),
  ]);

  const featuredProducts = featuredProductsResult.data || [];

  return (
    <div className="flex flex-col gap-16 pb-16 pt-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 pt-12 max-w-3xl mx-auto px-4">
        <h1 className="text-5xl font-anton tracking-wide sm:text-6xl text-primary leading-tight">
          {SITE_NAME}
        </h1>
        <p className="text-lg max-w-2xl text-muted-foreground">
          {SITE_DESCRIPTION}
        </p>
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide uppercase ${storeStatus.isOpen && !storeStatus.isPaused ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {storeStatus.isOpen && !storeStatus.isPaused ? "We are open" : "Currently closed"}
          </div>
          <Link href="/menu" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-lg px-12 py-8 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-primary/30 transition-all duration-300">
              Order Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Promotions Section */}
      {activePromotions.length > 0 && (
        <section className="px-4 max-w-5xl mx-auto w-full">
          <h2 className="text-3xl font-anton tracking-wide mb-8">Special Offers</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {activePromotions.map((promo) => (
              <div key={promo.id} className="relative overflow-hidden rounded-lg border shadow-sm group bg-card transition-all hover:shadow-md">
                <div className="aspect-[16/9] relative w-full overflow-hidden bg-muted">
                  <Image src={promo.image_url} alt={promo.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-2xl">{promo.title}</h3>
                  {promo.description && <p className="text-muted-foreground mt-2 line-clamp-2">{promo.description}</p>}
                  {(promo.product_id || promo.category_id) && (
                     <Link href="/menu" className="text-primary font-semibold text-sm mt-4 inline-block hover:underline">
                        View on Menu &rarr;
                     </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Food Carousel */}
      {featuredProducts.length > 0 && (
        <section className="px-4 max-w-5xl mx-auto w-full overflow-hidden">
          <h2 className="text-3xl font-anton tracking-wide mb-8">Featured Menu</h2>
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredProducts.map((product) => (
              <Link href={`/menu`} key={product.product_id} className="min-w-[300px] w-[300px] snap-center flex flex-col gap-4 group border rounded-lg p-4 bg-card hover:border-primary/40 transition-colors shadow-sm hover:shadow-md">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.product_name} fill className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-medium text-sm bg-secondary/50">No photo available</div>
                  )}
                </div>
                <div className="px-2 pb-2">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.product_name}</h3>
                  <p className="font-semibold text-muted-foreground mt-1 text-base">₱{product.product_price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
