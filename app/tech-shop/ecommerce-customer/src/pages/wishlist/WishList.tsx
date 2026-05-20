import { useGetWishlistQuery } from '../../features/wishlist/wishlist.api'
import ProductCard from '../../components/ProductCardData';
import { Link } from 'react-router';

const WishList = () => {
    const { data, isLoading, isError } = useGetWishlistQuery();
    
    if (isLoading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Đang tải danh sách yêu thích...</p>
            </div>
        );
    }
    if (isError) {
        return <div className="container py-5 text-center text-danger">Có lỗi xảy ra khi tải dữ liệu!</div>;
    }

    return (
        <div className="container py-4">
            {/* Header */}
            <h4 className="fw-bold mb-4">
                SẢN PHẨM YÊU THÍCH <span className="text-danger">({data?.length})</span>
            </h4>

            {/* Empty State */}
            {data?.length === 0 ? (
                <div className="alert alert-light text-center py-5 shadow-sm">
                    <h5>Danh sách yêu thích của bạn đang trống.</h5>
                    <p>Hãy tìm kiếm sản phẩm và thả tim nhé!</p>
                    <Link to="/" className="btn-app rounded mt-2">Tiếp tục mua sắm</Link>
                </div>
            ) : (
                /* Grid Sản phẩm */
                <div className="row">
                    {data?.map((product) => (
                        <div className='col-12 col-sm-6 col-md-4 col-lg-4 col-xl-3' key={product.productId}>
                            <ProductCard
                                product={{
                                    ...product,
                                    imageUrl: product.thumbnail.url,
                                    id: product.productId,
                                    isWishlisted: true
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default WishList