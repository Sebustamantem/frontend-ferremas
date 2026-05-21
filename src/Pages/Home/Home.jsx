import Hero from "./Hero"
import Categories from "../../components/home/Categories"
import PromoBanner from "../../components/home/PromoBanner"
import FeaturedProducts from "../../components/home/FeaturedProducts"
import ProBanner from "../../components/home/ProBanner"
import ProfessionalServices from "../../components/home/ProfessionalServices"

const Home = () => {
  return (
    <div className="bg-gray-50">
      <Hero />
      <PromoBanner />
      <ProBanner />
      <ProfessionalServices />
      <Categories />
      <FeaturedProducts />
    </div>
  )
}

export default Home
