import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useGetProductQuery, useGetRelatedProductQuery } from '../../features/product/product.api'
import type { SkuItem, Slider } from '../../types/product.type';
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import { IoIosStar } from 'react-icons/io';
import { toSelectionMap } from '../../helpers/product.helper';
import { RxDividerHorizontal } from 'react-icons/rx';
import { IoAdd } from 'react-icons/io5';
import { RiShieldFlashLine, RiShoppingCart2Line, RiSupabaseFill } from 'react-icons/ri';
import { CiDeliveryTruck } from 'react-icons/ci';
import { TfiReload } from 'react-icons/tfi';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import DOMPurify from "dompurify";
import "./product-detail.scss"
import ProductCard from '../../components/ProductCardData';
import { useAddToCartMutation } from '../../features/cart/cart.api';
import ProductReviewSection from './ProductReviewSection';
import { useGetWishlistQuery } from '../../features/wishlist/wishlist.api';
type SelectionMap = Record<string, string>;
const ProductDetailPage = () => {
    const PDP_RE = /^(.*)\.i-([A-Za-z0-9]+)$/;
    const parsePdpSlug = (raw: string) => {
        const m = raw.match(PDP_RE);
        if (!m) return null;
        return { productSlug: m[1], productId: m[2] };
    }
    const { slug: rawSlug = "" } = useParams();
    const [sp] = useSearchParams();
    const navigate = useNavigate();
    const skuFromQuery = sp.get("sku") ?? undefined;
    const parsed = useMemo(() => parsePdpSlug(rawSlug), [rawSlug]);
    const {
        data,
        isLoading,
        isError,
        error,
    } = useGetProductQuery(parsed?.productId ?? "", {
        skip: !parsed,
    });
    const productId = data?.id;
    const {
        data: related,
    } = useGetRelatedProductQuery(
        { productId: productId ?? "", limit: 8 },
        { skip: !productId }
    );
    const { data: wishlistItems } = useGetWishlistQuery();
    const wishListIds = useMemo(() => {
        // Dấu ?. và || [] để xử lý trường hợp data chưa tải xong (undefined)
        return wishlistItems?.map((item) => item.productId) || [];
    }, [wishlistItems]);
    console.log(data);
    const [addCart] = useAddToCartMutation();
    useEffect(() => {
        if (!parsed) return;
        if (!data) return;

        const canonical = `/p/${data.slug}.i-${data.id}`;
        const current = `/p/${rawSlug}`;

        const skuOk = skuFromQuery ? data.skus.some(s => s.id === skuFromQuery) : true;

        // 1) slug sai -> replace về slug chuẩn (giữ sku nếu hợp lệ)
        if (canonical !== current) {
            const q = skuFromQuery && skuOk ? `?sku=${encodeURIComponent(skuFromQuery)}` : "";
            navigate(`${canonical}${q}`, { replace: true });
            return;
        }

        // 2) sku rác -> remove query cho sạch
        if (skuFromQuery && !skuOk) {
            navigate(canonical, { replace: true });
        }
    }, [parsed, data, rawSlug, skuFromQuery, navigate]);
    const selectedSku = useMemo(() => {
        if (!data) return null;

        // 1) ưu tiên sku từ query
        if (skuFromQuery) {
            const sk = data.skus.find(s => s.id === skuFromQuery);
            if (sk) return sk;
        }

        // 2) fallback defaultSkuId
        return data.skus.find(s => s.id === data.defaultSkuId) ?? null;
    }, [data, skuFromQuery]);
    const discountPercent = useMemo(() => {
        if (!selectedSku?.originalPrice || !selectedSku?.price) return null;
        if (selectedSku.originalPrice <= selectedSku.price) return null;

        return Math.round(
            ((selectedSku.originalPrice - selectedSku.price) / selectedSku.originalPrice) * 100
        );
    }, [selectedSku]);
    const skus = data?.skus;                 // ✅ biến trung gian
    const variantGroups = data?.variantGroups;
    const groupOrder = useMemo(
        () => variantGroups?.map(g => g.id) ?? [],
        [variantGroups]
    );

    const makeKey = (sel: SelectionMap) =>
        groupOrder.map(gid => `${gid}:${sel[gid] ?? ""}`).join("|");

    const skuIndex = useMemo(() => {
        if (!skus) return new Map<string, SkuItem>();

        const makeKey = (sel: Record<string, string>) =>
            groupOrder.map(gid => `${gid}:${sel[gid] ?? ""}`).join("|");

        const map = new Map<string, SkuItem>();
        for (const sku of skus) {
            map.set(makeKey(toSelectionMap(sku.selections)), sku);
        }
        return map;
    }, [skus, groupOrder]);

    const selectedValues = selectedSku ? toSelectionMap(selectedSku.selections) : {};
    const isOptionDisabled = (groupId: string, valueId: string) => {
        const next: SelectionMap = { ...selectedValues, [groupId]: valueId };
        return !skuIndex.has(makeKey(next));
    };

    const onPickValue = (groupId: string, valueId: string) => {
        if (!data || !selectedSku) return;

        const next: SelectionMap = { ...selectedValues, [groupId]: valueId };
        const nextSku = skuIndex.get(makeKey(next));

        if (!nextSku) return;

        navigate(`/p/${data.slug}.i-${data.id}?sku=${encodeURIComponent(nextSku.id)}`, {
            replace: true,
        });
    };

    const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

    const sliderImages: Slider[] = useMemo(() => {
        if (!data) return [];

        const sliders: Slider[] = [
            { id: data.id, imageUrl: data.thumbnail.imageUrl, type: "product" },
            ...data.skus.map(
                (sk): Slider => ({
                    id: sk.id,
                    imageUrl: sk.thumbnail.imageUrl,
                    type: "sku",
                })
            ),
        ];

        // dedupe theo imageUrl
        return Array.from(new Map(sliders.map((s) => [s.imageUrl, s])).values());
    }, [data]);
    const safeHtml = useMemo(
        () => DOMPurify.sanitize(data?.description ?? ""),
        [data?.description]
    );

    const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
    const [quantityCart, setQuantityCart] = useState<number>(1)
    const handleAddToCart = async () => {
        if (selectedSku == null || quantityCart < 1) {
            return;
        }
        await addCart({ skuId: selectedSku.id, quantity: quantityCart })

    }
    useEffect(() => {
        if (!data || !skuFromQuery || !mainSwiper) return;

        const idx = sliderImages.findIndex((x) => x.type === "sku" && x.id === skuFromQuery);
        if (idx >= 0) mainSwiper.slideTo(idx);
    }, [data?.id, skuFromQuery, mainSwiper, sliderImages]);
    // ✅ URL sai format => 404 (hoặc redirect)
    if (!parsed) return <div>404 - Invalid URL</div>;

    if (isLoading) return <div>Loading...</div>;

    // ✅ productId không tồn tại -> 404 (tuỳ API trả lỗi)
    if (isError) {
        // nếu bạn dùng fetchBaseQuery, error có thể là {status: 404, ...}
        // @ts-expect-error shape depends on baseQuery
        if (error?.status === 404) return <div>404 - Product not found</div>;
        return <div>Something went wrong</div>;
    }
    if (!data) return null;
    return (
        <div className='product-detail'>
            <div className='row top-detail'>
                <div className='col-md-6 col-12 detail-image'>
                    <Swiper
                        modules={[Navigation, Thumbs]}
                        onSwiper={setMainSwiper}
                        navigation
                        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                        spaceBetween={10}
                        style={{ width: "100%" }}
                    >
                        {sliderImages.map((img) => (
                            <SwiperSlide key={`${img.type}-${img.id}`}>
                                <img
                                    src={img.imageUrl}
                                    alt="img-preview"
                                    className='img-preview'
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* THUMBS */}
                    <div style={{ marginTop: 12 }}>
                        <Swiper
                            modules={[FreeMode, Navigation, Thumbs]}
                            onSwiper={setThumbsSwiper}
                            spaceBetween={8}
                            slidesPerView={5}
                            freeMode
                            watchSlidesProgress
                            style={{ width: "100%" }}
                        >
                            {sliderImages.map((img) => (
                                <SwiperSlide key={`thumb-${img.type}-${img.id}`}>
                                    <img
                                        src={img.imageUrl}
                                        alt="img-slider"
                                        className='img-slider'

                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
                <div className='col-md-6 col-12 detail-content d-flex flex-column gap-3 align-items-start'>
                    <div className='fs-3 fw-bold'>{selectedSku?.name}</div>
                    <div className="rating-badge">
                        <div className="rating-score">
                            <span className="star"><IoIosStar size={20} /></span>
                            <span className="score">{data.averageRating}</span>
                        </div>

                        <div className="divider" />

                        <div className="rating-count">
                            {`${data.numberOfReviews} Đánh giá`}
                        </div>
                    </div>
                    <div className='d-flex align-items-center gap-2 flex-wrap'>
                        <span className='fs-3 fw-bold text-brand'>{`${selectedSku?.price} đ`} </span>
                        <span className='fs-4 fw-bold'>-</span>
                        <span className='fs-5 text-decoration-line-through text-body-tertiary'>{`${selectedSku?.originalPrice} đ`}</span>
                        {
                            discountPercent && discountPercent > 0 && <span className='status status--danger px-2'>{`Giảm ${discountPercent ?? 0} %`}</span>
                        }

                    </div>
                    <div className='detail-content-short-description'>
                        {data.shortDescription}
                    </div>
                    <div className='sku-selections'>
                        {data.variantGroups.map((group) => (
                            <div key={group.id} className="mb-3">
                                <div className="fw-bold mb-2 fs-5 fw-lighter">{group.label}</div>

                                <div className="d-flex gap-2 flex-wrap">
                                    {group.values
                                        .filter(v => v.active) // nếu muốn ẩn inactive
                                        .map((v) => {
                                            const active = selectedValues[group.id] === v.id;
                                            const disabled = isOptionDisabled(group.id, v.id);

                                            return (
                                                <button
                                                    key={v.id}
                                                    disabled={disabled}
                                                    onClick={() => onPickValue(group.id, v.id)}
                                                    className={`btn-app btn-app--outline ${active && "active"}`}
                                                    style={{ opacity: disabled ? 0.5 : 1 }}
                                                >
                                                    {v.value}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='d-flex align-items-center gap-3 btn-order-group flex-wrap'>
                        <div className='quantity'>
                            <button className='prev' disabled={quantityCart == 1} onClick={() => setQuantityCart(quantityCart - 1)}>
                                <RxDividerHorizontal size={20} />
                            </button>
                            <span className='quantity-value'>{quantityCart}</span>
                            <button className='next' onClick={() => setQuantityCart(quantityCart + 1)}>
                                <IoAdd size={20} />
                            </button>
                        </div>
                        <button onClick={handleAddToCart} className='add-cart btn-app btn-app--outline'>
                            <span>Thêm vào giỏ hàng</span>
                            <RiShoppingCart2Line />
                        </button>
                        <button className='buy-now btn-app'>
                            <span>Mua ngay</span>
                            <RiSupabaseFill />
                        </button>
                    </div>
                    <div className='d-flex align-items-center justify-content-between flex-md-row flex-column f-caption fw-medium w-100 advertisement' >
                        <div className='d-flex align-items-center justify-content-center  gap-2 text-body-secondary  py-4'>
                            <RiShieldFlashLine size={20} />
                            <span>{`Bảo hành ${data.warrantyMonth} tháng`}</span>
                        </div>
                        <div className='d-flex align-items-center justify-content-center gap-2 text-body-secondary py-4'>
                            <CiDeliveryTruck size={20} />
                            <span>{`Miễn phí ship 10M+`}</span>
                        </div>
                        <div className='d-flex align-items-center justify-content-center gap-2 text-body-secondary py-4'>
                            <TfiReload size={20} />
                            <span>{`Đổi trả miễn phí 30 ngày`}</span>
                        </div>
                    </div>
                </div>
            </div>
            <Tabs>
                <TabList>
                    <Tab>Mô tả chi tiết</Tab>
                    <Tab>Thông số kỹ thuật</Tab>
                    <Tab>Đánh giá ({data.numberOfReviews})</Tab>
                </TabList>

                <TabPanel>
                    <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
                </TabPanel>
                <TabPanel>
                    <div className='row'>
                        <div className='col-12 col-md-6'>
                            <table className="table table-striped rounded">
                                <tbody>
                                    {data.specs.map(sp => (
                                        <tr key={sp.id}>
                                            <td className=' fw-bold'>{sp.label}</td>
                                            <td>{sp.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>
                    </div>
                </TabPanel>
                <TabPanel>
                    <ProductReviewSection productId={data.id} />
                </TabPanel>
            </Tabs>
            {related && related.length > 0 && (
                <div className='mb-4'>
                    <div className='f-bold fs-4 ps-2'>Sản phẩm tương tự</div>
                    <div className='f-caption ps-2 mb-3'>Có thể bạn cũng sẽ thích</div>
                    <Swiper
                        modules={[Navigation, Thumbs]}
                        navigation
                        spaceBetween={5}
                        style={{ width: "100%" }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2,
                                spaceBetween: 20,
                            },
                            768: {
                                slidesPerView: 4,
                                spaceBetween: 40,
                            },
                            1024: {
                                slidesPerView: 5,
                                spaceBetween: 50,
                            }
                        }}
                    >
                        {related.map(rl => {
                            const isLiked = wishListIds?.includes(rl.id) ?? false;

                            return (
                                <SwiperSlide key={rl.id}>
                                    <ProductCard
                                        product={{
                                            id: rl.id,
                                            slug: rl.slug,
                                            name: rl.name,
                                            imageUrl: `${rl.imageUrl}`,
                                            minPrice: rl.minPrice,
                                            maxPrice: rl.maxPrice,
                                            rating: rl.rating,
                                            ratingCount: rl.ratingCount,
                                            isWishlisted: isLiked
                                        }}
                                    />
                                </SwiperSlide>
                            )
                        }
                        )}
                    </Swiper>
                </div>

            )
            }
        </div >
    )
}

export default ProductDetailPage