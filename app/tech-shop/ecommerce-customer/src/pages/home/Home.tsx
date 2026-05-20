import React, { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import "./home.scss"
import {
  useGetHotDealProductQuery,
  useGetTopRatedQuery,
  useGetProductsByPriceRangeQuery,
  useGetRandomSuggestionsQuery,
} from '../../features/product/product.api';
import ProductCard from '../../components/ProductCardData';
import MegaMenu from '../../components/common/MegaMenu';
import { useGetWishlistQuery } from '../../features/wishlist/wishlist.api';
import { Link } from 'react-router';
import { RiFireFill, RiPriceTag3Fill, RiStarFill, RiUserSearchFill } from 'react-icons/ri';

const Home = () => {
  const { data: hotDeals } = useGetHotDealProductQuery(0.05);
  const { data: topRated } = useGetTopRatedQuery();
  const { data: budgetProducts } = useGetProductsByPriceRangeQuery(20000000);
  const { data: suggestions } = useGetRandomSuggestionsQuery();
  const { data: wishlistItems } = useGetWishlistQuery();

  const wishListIds = useMemo(() => {
    return wishlistItems?.map((item) => item.productId) || [];
  }, [wishlistItems]);

  const swiperOptions = {
    modules: [Navigation, Autoplay],
    navigation: true,
    spaceBetween: 15,
    breakpoints: {
      320: { slidesPerView: 2 },
      768: { slidesPerView: 3 },
      1024: { slidesPerView: 5 },
    }
  };

  return (
    <div className='home-container'>
      <div className="container-xl">
        {/* 1. Hero Section */}
        <div className="row hero-section mb-4 mx-0">
          <div className="menu-wrapper">
            <MegaMenu />
          </div>

        </div>

        {/* 2. Flash Sale Section */}
        {hotDeals && hotDeals?.length > 0 && (
          <section className='section-box'>
            <div className='section-header'>
              <h2 className='title red-text text-uppercase d-flex align-items-center gap-2'> <RiFireFill /> GIẢM GIÁ SỐC TẬN NÓC</h2>
              <Link to="/search?minDiscount=0.01&sort=discount_desc" className="btn-app btn-app--link">Xem tất cả</Link>
            </div>
            <Swiper {...swiperOptions}>
              {hotDeals?.map((rl) => {
                const isLiked = wishListIds?.includes(rl.productId) ?? false;

                return (
                  <SwiperSlide key={rl.productId}>
                    <div className="product-card-wrapper">
                      <ProductCard
                        product={{ ...rl, imageUrl: rl.thumbnail.url, id: rl.productId, isWishlisted: isLiked }}
                      />
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </section>
        )}
        {budgetProducts && budgetProducts?.length > 0 && (
          <section className='section-box'>
            <div className='section-header'>
              <h2 className='title text-uppercase d-flex align-items-center gap-2'><RiPriceTag3Fill />sản phẩm theo mức giá</h2>
              <Link to="/search?minPrice=0&maxPrice=20000000&sort=price_desc" className="btn-app btn-app--link">Xem tất cả</Link>

            </div>
            <Swiper {...swiperOptions}>
              {budgetProducts.map((rl) => {
                const isLiked = wishListIds?.includes(rl.productId) ?? false;

                return (
                  <SwiperSlide key={rl.productId}>
                    <div className="product-card-wrapper">
                      <ProductCard
                        product={{ ...rl, imageUrl: rl.thumbnail.url, id: rl.productId, isWishlisted: isLiked }}
                      />
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </section>
        )}
        {/* 3. Top Rated Section */}
        {topRated && topRated?.length > 0 && (
          <section className='section-box'>
            <div className='section-header'>
              <h2 className='title text-uppercase d-flex align-items-center gap-2'><RiStarFill />TOP SẢN PHẨM ĐƯỢC TIN DÙNG</h2>
              <Link to="/search?sort=rating_desc" className="btn-app btn-app--link">Xem tất cả</Link>

            </div>
            <Swiper {...swiperOptions}>
              {topRated.map((rl) => {
                const isLiked = wishListIds?.includes(rl.productId) ?? false;

                return (
                  <SwiperSlide key={rl.productId}>
                    <div className="product-card-wrapper">
                      <ProductCard
                        product={{ ...rl, imageUrl: rl.thumbnail.url, id: rl.productId, isWishlisted: isLiked }}
                      />
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </section>
        )}
        {suggestions && suggestions?.length > 0 && (
          <section className='section-box'>
            <div className='section-header'>
              <h2 className='title text-uppercase d-flex align-items-center gap-2'><RiUserSearchFill /> sản phẩm dành cho bạn</h2>
            </div>
            <Swiper {...swiperOptions}>
              {suggestions.map((rl) => {
                const isLiked = wishListIds?.includes(rl.productId) ?? false;

                return (
                  <SwiperSlide key={rl.productId}>
                    <div className="product-card-wrapper">
                      <ProductCard
                        product={{ ...rl, imageUrl: rl.thumbnail.url, id: rl.productId, isWishlisted: isLiked }}
                      />
                    </div>
                  </SwiperSlide>
                )
              })}
            </Swiper>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;