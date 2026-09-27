import Link from "next/link";
import { Button } from "@/components/ui/button";
import { readStoreStatus } from "@/lib/store/read-store-status";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site/site-info";
import { getFeaturedProducts } from "@/lib/actions/menu";
import { getActivePromotions } from "@/lib/actions/promotions";
import Image from "next/image";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { MobileMenuHeader } from "@/components/menu/mobile-menu-header";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

export default async function HomePage() {
  const profilePromise = readCustomerProfile();
  const [storeStatus, featuredProductsResult, activePromotions] = await Promise.all([
    readStoreStatus(),
    getFeaturedProducts(),
    getActivePromotions(),
  ]);

  const featuredProducts = featuredProductsResult.data || [];

  return (
    <div className="flex flex-col pb-16">
      <SiteNavBar profilePromise={profilePromise} currentSection="menu" />
      <MobileMenuHeader profilePromise={profilePromise} />
      {/* Hero Section with Background Image */}
      <section className="relative w-full h-[600px] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=2000&auto=format&fit=crop"
            alt="Delicious Fried Rice"
            fill
            className="object-cover brightness-[0.4]"
            priority
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto px-4 mt-8">
          <h1 className="text-5xl font-anton tracking-wide sm:text-6xl text-white leading-tight drop-shadow-md">
            {SITE_NAME}
          </h1>
          <p className="text-lg max-w-2xl text-white/90 drop-shadow-sm font-medium">
            {SITE_DESCRIPTION}
          </p>
          <div className="flex flex-col items-center gap-6 mt-8">
            <div className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide uppercase shadow-lg ${storeStatus.isOpen && !storeStatus.isPaused ? 'bg-success text-white' : 'bg-destructive text-white'}`}>
              {storeStatus.isOpen && !storeStatus.isPaused ? "We are open" : "Currently closed"}
            </div>
            <Link href="/menu" className="inline-block w-full sm:w-auto">
              <Button className="w-full sm:w-auto text-lg px-12 py-8 rounded-full font-bold shadow-xl shadow-primary/40 hover:scale-105 hover:shadow-primary/50 transition-all duration-300">
                Order Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      {activePromotions.length > 0 && (
        <section className="px-4 max-w-5xl mx-auto w-full mt-24">
          <h2 className="text-3xl font-anton tracking-wide mb-10 text-center">Special Offers</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {activePromotions.map((promo) => (
              <div key={promo.id} className="relative overflow-hidden rounded-lg border shadow-md group bg-card transition-all hover:shadow-xl">
                <div className="aspect-[16/9] relative w-full overflow-hidden bg-muted">
                  <Image src={promo.image_url} alt={promo.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
                <div className="p-8">
                  <h3 className="font-bold text-3xl">{promo.title}</h3>
                  {promo.description && <p className="text-muted-foreground mt-3 line-clamp-2 text-lg">{promo.description}</p>}
                  {(promo.product_id || promo.category_id) && (
                     <Link href="/menu" className="text-primary font-bold text-base mt-6 inline-block hover:underline">
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
        <section className="px-4 max-w-5xl mx-auto w-full overflow-hidden mt-24">
          <h2 className="text-3xl font-anton tracking-wide mb-10 text-center">Featured Menu</h2>
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {featuredProducts.map((product) => (
              <Link href={`/menu`} key={product.product_id} className="min-w-[320px] w-[320px] snap-center flex flex-col gap-4 group border rounded-lg p-5 bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-xl">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.product_name} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-medium text-sm bg-secondary/50">No photo available</div>
                  )}
                </div>
                <div className="px-2 pb-2">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.product_name}</h3>
                  <p className="font-semibold text-muted-foreground mt-2 text-lg">₱{product.product_price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About Us Section */}
      <section className="px-4 max-w-6xl mx-auto w-full mt-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2000&auto=format&fit=crop"
              alt="Restaurant Interior"
              fill
              className="object-cover hover:scale-105 transition-transform duration-1000"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-anton tracking-wide text-primary">About {SITE_NAME}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We started with a simple vision: to bring the authentic, comforting flavors of classic Asian street food straight to your table. Our chefs use only the freshest ingredients, wok-tossing every dish to perfection to deliver that irreplaceable &quot;wok hei&quot; smoky flavor.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you are craving a quick, satisfying bite or a hearty meal to share with loved ones, our kitchen is always ready to serve you up something unforgettable. Come experience the taste that brings everyone together!
            </p>
            <Link href="/menu" className="inline-block mt-4">
              <Button variant="outline" className="text-lg px-8 py-6 rounded-full font-bold hover:bg-primary hover:text-white transition-all">
                Explore Our Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
