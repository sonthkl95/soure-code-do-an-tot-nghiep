import { Link, useNavigate } from "react-router"
import Logo from "../../assets/logo.png";
import { RiCloseLargeLine, RiHeart3Line, RiLoginBoxLine, RiMenuFill, RiSearchLine, RiShoppingCart2Line, RiUser3Line } from "react-icons/ri";
import { IoCallOutline } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { Accordion, Offcanvas } from "react-bootstrap";
import { categories } from "../../features/data/menu";
import { useLazySuggestProductQuery } from "../../features/product/product.api";
import { useAppSelector } from "../../store/hook";
import { useGetMyCartQuery } from "../../features/cart/cart.api";

const Header = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);

  const [triggerSuggest, { data: suggest, isFetching }] = useLazySuggestProductQuery();
  const { count } = useGetMyCartQuery(undefined, {
    selectFromResult: ({ data, isLoading }) => ({
      isLoading,
      count: data?.items?.reduce((sum, it) => sum + it.quantity, 0) ?? 0,
    }),
  })
  const boxRef = useRef<HTMLDivElement | null>(null);

  // debounce gọi suggest
  useEffect(() => {
    const q = keyword.trim();
    if (q.length < 2) return;

    const t = setTimeout(() => {
      triggerSuggest(q);
      setOpenSuggest(true);
    }, 250);

    return () => clearTimeout(t);
  }, [keyword, triggerSuggest]);

  // click outside -> đóng dropdown
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpenSuggest(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const onEnterSearch = () => {
    const q = keyword.trim();
    if (!q) return;
    setOpenSuggest(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };
  const { status } = useAppSelector((state) => state.auth);
  return (
    <header className="tz-header">
      <div className='top-header d-none d-md-flex'>
        <div className="container d-flex align-items-center justify-content-between">
          <div>
            <span className=" d-inline-block me-3">Chào mừng đến với TechZone Elite</span>
            <div className="vr"></div>
            <span className="d-inline-block ms-3">Hotline: 1800-TECH-ZONE</span>
          </div>
          <div className="text-light">
            <Link to="/profile/orders" className="me-2">Tra cứu đơn hàng</Link>
            {/* <Link to="/">Tin công nghệ</Link> */}
          </div>
        </div>
      </div>
      <div className="content-header bg-white py-2">
        <div className="container d-flex align-items-center gap-md-5 gap-3">
          <div className="logo d-flex">
            <button onClick={handleShow} className="btn-menu d-flex align-items-center justify-content-center border-0 bg-transparent d-md-none">
              <RiMenuFill size={25} />
            </button>
            <Link to="/" className="align-items-center justify-content-center gap-2 d-flex" >
              <img src={Logo} alt="logo" />
              <div className="d-flex flex-column d-none d-md-flex">
                <span className="f-bold">TechZone</span>
                <span className="text-uppercase text-danger f-body-2xs">Elite Gear</span>
              </div>
            </Link>
          </div>
          <div className="input-search flex-fill" ref={boxRef}>
            <input
              type="text"
              placeholder="Tìm kiếm bằng sản phẩm, thương hiệu,..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (e.target.value.trim().length < 2) setOpenSuggest(false);
              }}
              onFocus={() => {
                if (keyword.trim().length >= 2) setOpenSuggest(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEnterSearch();
                if (e.key === "Escape") setOpenSuggest(false);
              }}
            />

            <button className="icon-search rounded-circle" onClick={onEnterSearch} >
              <RiSearchLine />
            </button>

            {openSuggest && keyword.trim().length >= 2 && (
              <div className="suggest-search">
                {isFetching && <div className="suggest-loading">Đang tìm...</div>}

                {!!suggest?.skus?.length && (
                  <div className="suggest-group">
                    <div className="suggest-title">Sản phẩm đè xuất</div>
                    {suggest.skus.map((sk) => (
                      <Link
                        key={sk.skuId}
                        className="suggest-item"
                        to={`/p/${sk.productSlug}.i-${sk.productId}?sku=${sk.skuId}`}
                        role="button"
                      >
                        <img className="suggest-thumb" src={sk.imageUrl ?? ""} alt="" />
                        <div className="suggest-text">{sk.label}</div>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="suggest-footer">
                  Tìm kiếm “{keyword.trim()}”
                </div>
              </div>
            )}
          </div>
          <div className="d-flex gap-3 align-items-center">
            <div className="d-none d-lg-flex d-flex align-items-center ">
              <div className="d-flex align-items-center justify-content-center p-2 rounded-circle bg-brand-100 text-brand">
                <IoCallOutline />
              </div>
              <div className="d-flex flex-column">
                <span className="f-caption">Gọi mua hàng</span>
                <span className="f-body-sm f-bold">1800-1234</span>
              </div>
            </div>
            <Link to="/wishlist" className="d-flex flex-column btn-menu align-items-center">
              <RiHeart3Line size={25} />
              <span className="text-nowrap d-none d-md-inline-block">Yêu thích</span>
            </Link>
            {status == "authenticated" ? (
              <Link to="/profile" className="d-flex flex-column btn-menu align-items-center">
                <RiUser3Line size={25} />
                <span className="text-nowrap d-none d-md-inline-block">Hồ sơ</span>
              </Link>
            ) : (
              <a href="http://localhost:8081/oauth2/authorization/user-idp" className="d-flex flex-column btn-menu align-items-center">
                <RiLoginBoxLine size={25} />
                <span className="text-nowrap d-none d-md-inline-block">Đăng nhập</span>
              </a>

            )}
            <Link to="/cart" className="d-flex flex-column btn-menu align-items-center">
              <div className="position-relative">
                <RiShoppingCart2Line size={25} />
                {count > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">{count}</span>
                )}
              </div>
              <span className="text-nowrap d-none d-md-inline-block">Giỏ hàng</span>
            </Link>
          </div>
        </div>
      </div>
      <Offcanvas bsPrefix="sidebar offcanvas" show={show} onHide={handleClose}>
        <Offcanvas.Header>
          <Offcanvas.Title>
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center gap-1">
                <img src={Logo} alt="" />
                <span className="text-white fw-bold">TechZone</span>
              </div>
              <button type="button" onClick={handleClose} className="border-0 bg-transparent text-white">
                <RiCloseLargeLine />
              </button>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Accordion defaultActiveKey={String(categories?.[0]?.id)}>
            {categories.map((ca) => (
              <Accordion.Item key={ca.id} eventKey={String(ca.id)}>
                <Accordion.Header>{ca.name}</Accordion.Header>
                <Accordion.Body>
                  <Accordion defaultActiveKey={String(ca.children?.[0]?.id)}>
                    {ca.children.map(cl => (
                      <Accordion.Item key={cl.id} eventKey={String(cl.id)}>
                        <Accordion.Header>{cl.name}</Accordion.Header>
                        <Accordion.Body>
                          {cl.children.map(l => (
                            <Link key={l.id} to="">{l.name}</Link>
                          ))}
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  )
}

export default Header