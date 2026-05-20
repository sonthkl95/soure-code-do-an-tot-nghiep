import { useState, useMemo, useEffect } from "react";
import { RiHeart3Line, RiShoppingCart2Line, RiHeart3Fill } from "react-icons/ri";
import { Link } from "react-router"; // hoặc react-router-dom
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import type { ProductCardData } from "../types/product.type"; // Import type chuẩn
import { useAppSelector } from "../store/hook";
import { toast } from "react-toastify";
import { useAddToCartMutation } from "../features/cart/cart.api";
import { useToggleWishlistMutation } from "../features/wishlist/wishlist.api";

type Props = {
  product: ProductCardData;
};

export default function ProductCard({ product }: Props) {
  const to = `/p/${product.slug}.i-${product.id}`;
  const status = useAppSelector((state) => state.auth.status)
  // 1. State lưu các lựa chọn: { "groupId": "valueId" }
  const [addtoCart, {isLoading: isLoadingCart}] = useAddToCartMutation();
  // 2. Tự động chọn SKU đầu tiên khi mount (để không bị null)
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    if (product.skus && product.skus.length > 0) {
      const firstSku = product.skus[0];
      const defaultsels: Record<string, string> = {};
      firstSku.selections.forEach(s => defaultsels[s.groupId] = s.valueId);
      return defaultsels;
    }
    return {};
  });
  const [toggleWishList, {isLoading: isLoadingWish}] = useToggleWishlistMutation();
  // 3. Tìm SKU khớp với lựa chọn hiện tại
  const activeSku = useMemo(() => {
    if (!product.skus) return null;
    return product.skus.find(sku => {
      // Kiểm tra xem mọi selection của SKU này có khớp với state không
      return sku.selections.every(s => selections[s.groupId] === s.valueId);
    });
  }, [product.skus, selections]);

  // 4. Xử lý logic hiển thị (Ưu tiên hiển thị theo SKU đang chọn)
  const displayImage = activeSku?.thumbnail?.url || product.imageUrl;

  const displayPrice = activeSku
    ? `${activeSku.price.toLocaleString("vi-VN")}₫`
    : (product.minPrice === product.maxPrice
      ? `${product.minPrice.toLocaleString("vi-VN")}₫`
      : `${product.minPrice.toLocaleString("vi-VN")}₫ - ${product.maxPrice.toLocaleString("vi-VN")}₫`);

  // 5. Handle Click Option
  const handleOptionClick = (e: React.MouseEvent, groupId: string, valueId: string) => {
    e.preventDefault(); // Chặn Link nhảy trang
    setSelections(prev => ({ ...prev, [groupId]: valueId }));
  };

  // 6. Handle Add To Cart
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if(!activeSku) {
      toast.warning("Vui lòng chọn phân loại hàng");
      return;
    }
    if (status != "authenticated") {
      toast.info("Vui lòng đăng nhập để mua hàng");
      return;
    }
    try {
    await addtoCart({skuId: activeSku.skuId, quantity: 1}).unwrap()
      toast.success("Đã thêm vào giỏ hàng");
    } catch (error) {
      const msg = error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
      toast.error(msg);
    }
  };

  return (
    <div className="pc-card h-100">
      <Link to={to} className="pc-link-wrapper">
        <div className="pc-media">
          <div className="pc-img-box">
            <img
              className="pc-img"
              src={displayImage}
              alt={product.name}
              loading="lazy"
            />
          </div>

          {/* Overlay Actions */}
          <div className="pc-actions-wrapper">
            <div className="pc-actions">
              <button
                type="button"
                className={`pc-action-btn ${product.isWishlisted ? "is-active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  toggleWishList({productId: product.id, action: product.isWishlisted ? 'remove' : 'add'})
                }}
              >
                {product.isWishlisted ? <RiHeart3Fill size={20} /> : <RiHeart3Line size={20} />}
              </button>

              <button
                type="button"
                className="pc-action-btn pc-action-btn--cart"
                onClick={handleAddToCart}
                disabled={!activeSku && (product.variantGroups?.length || 0) > 0} // Disable nếu chưa chọn ra SKU
              >
                <RiShoppingCart2Line size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="pc-body">
          <div className="pc-rating-row">
            <Rating value={product.rating ?? 0} readOnly style={{ maxWidth: 70 }} />
            {product.ratingCount ? <span className="pc-review-count">({product.ratingCount})</span> : null}
          </div>

          <h3 className="pc-name" title={product.name}>{product.name}</h3>

          {/* --- NEW: OPTIONS SELECTOR --- */}
          {product.variantGroups && product.variantGroups.length > 0 && (
            <div className="pc-options">
              {product.variantGroups.slice(0, 2).map(group => ( // Chỉ hiện tối đa 2 nhóm cho gọn
                <div key={group.id} className="pc-option-group">
                  <span className="pc-option-label">{group.label}:</span>
                  <div className="pc-option-list">
                    {group.values.map(val => {
                      const isActive = selections[group.id] === val.id;
                      return (
                        <button
                          key={val.id}
                          className={`pc-option-pill ${isActive ? 'active' : ''}`}
                          onClick={(e) => handleOptionClick(e, group.id, val.id)}
                          title={val.value}
                        >
                          {val.value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* ----------------------------- */}

          <div className="pc-price-row">
            <span className="pc-price">{displayPrice}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}