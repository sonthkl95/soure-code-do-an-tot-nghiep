import { useParams, useNavigate } from "react-router";
import { useGetProductByIdQuery } from "../../features/product/product.api";
import { PiArrowLeft } from "react-icons/pi";
import { formatCurrency } from "../../utils/format"; // Giả sử có hàm này
import type { Attribute, AttributeDetail, SkuDetail, SkuSelect } from "../../types/product.type";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: product, isLoading } = useGetProductByIdQuery(id ?? "", { skip: !id });
    console.log({ product });

    if (isLoading) return <div className="p-5 text-center">Đang tải...</div>;
    if (!product) return <div className="p-5 text-center text-danger">Không tìm thấy sản phẩm</div>;

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <button onClick={() => navigate(-1)} className="btn btn-light btn-sm rounded-circle p-2">
                    <PiArrowLeft size={20} />
                </button>
                <div className="d-flex  align-items-center justify-content-between"></div>
                <h4 className="mb-0 fw-bold">{product.name}</h4>
                <span className={`badge ${product.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                    {product.status}
                </span>
            </div>

            <div className="row g-4">
                {/* Cột trái: Ảnh */}
                <div className="col-md-5">
                    <div className="card border-0 shadow-sm p-3">
                        <img
                            src={typeof product.thumbnail === 'string' ? product.thumbnail : product.thumbnail.imageUrl}
                            alt={product.name}
                            className="img-fluid rounded mb-3 w-100 object-fit-cover"
                            style={{ maxHeight: '400px' }}
                        />
                        <div className="d-flex gap-2 overflow-auto pb-2">
                            {product.gallery?.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={typeof img === 'string' ? img : img.imageUrl}
                                    className="rounded border"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    alt="gallery"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cột phải: Thông tin */}
                <div className="col-md-7">
                    <div className="card border-0 shadow-sm p-4 h-100">
                        <div className="mb-3">
                            <span className="text-muted small">Thương hiệu: </span>
                            <span className="fw-bold text-primary">{product.brand?.name}</span>
                            <span className="mx-2">|</span>
                            <span className="text-muted small">Danh mục: </span>
                            <span className="fw-bold">{product.category?.name}</span>
                        </div>

                        <h2 className="fw-bold mb-3">{`${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`}</h2>

                        <div className="mb-4">
                            <h6 className="fw-bold">Mô tả ngắn:</h6>
                            <p className="text-muted">{product.shortDescription}</p>
                        </div>

                        {/* Bảng thông số kỹ thuật */}
                        <div className="mb-4">
                            <h6 className="fw-bold mb-3">Thông số kỹ thuật</h6>
                            <table className="table table-bordered table-sm">
                                <tbody>
                                    {product.specs?.map((attr: AttributeDetail) => (
                                        <tr key={attr.id}>
                                            <td className="bg-light w-25">{attr.label}</td>
                                            <td>{attr.valueSelect.label ?? attr.valueMultiSelect?.map(it => it.label).join(", ") ?? attr.value} {attr.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Hàng dưới: Biến thể & Mô tả chi tiết */}
                <div className="col-12">
                    {/* Danh sách biến thể */}
                    {product.hasVariants && product.skus && product.skus.length > 0 && (
                        <div className="card border-0 shadow-sm p-4 mb-4">
                            <h5 className="fw-bold mb-3">Danh sách biến thể (SKU)</h5>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Ảnh</th>
                                            <th>Mã SKU</th>
                                            <th>Tên biến thể</th>
                                            <th>Giá bán</th>
                                            <th>Tồn kho</th>
                                            <th>Thuộc tính</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product.skus.map((sku: SkuDetail) => (
                                            <tr key={sku.id}>
                                                <td>
                                                    <img
                                                        src={sku.thumbnail ? sku.thumbnail.imageUrl : '/placeholder.png'}
                                                        width="50" height="50" className="rounded" alt="sku"
                                                    />
                                                </td>
                                                <td className="fw-bold">{sku.skuCode}</td>
                                                <td>{sku.name}</td>
                                                <td className="text-primary fw-bold">{formatCurrency(sku.price)}</td>
                                                <td>
                                                    <span className={`badge ${sku.stock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                        {sku.stock}
                                                    </span>
                                                </td>
                                                <td>
                                                    {sku.selections?.map((att: SkuSelect) => {
                                                            const groupOption = product.variantGroups.find(gr => gr.id == att.groupId)
                                                            console.log(product.variantGroups);
                                                            console.log(att);
                                                            
                                                            
                                                            const option = groupOption?.values.find(o => o.id == att.valueId)
                                                        return (
                                                            <span key={att.valueId} className="badge bg-secondary me-1">{option?.value}</span>
                                                        )
                                                    }
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Mô tả chi tiết HTML */}
                    <div className="card border-0 shadow-sm p-4">
                        <h5 className="fw-bold mb-3">Chi tiết sản phẩm</h5>
                        <div
                            className="product-description-content"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;