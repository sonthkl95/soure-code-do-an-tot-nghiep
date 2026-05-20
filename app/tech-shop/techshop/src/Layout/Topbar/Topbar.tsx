import { Link, useLocation } from "react-router";
import { RiLoginBoxLine, RiLogoutBoxLine, RiMapPinUserLine, RiNotification3Fill } from "react-icons/ri";
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';
import { ControlledMenu, MenuItem, useClick } from "@szhsin/react-menu";
import { useRef, useState } from "react";
import { Overlay, Tooltip } from "react-bootstrap";
import { Avatar } from "../../components/common/Avatar";
import DefaultAvatar from "../../assets/images/Avatar.jpg"
import { useAppDispatch, useAppSelector } from "../../store/hook";
import { logout } from "../../features/auth/auth.slice";
const titleMap: Record<string, { title: string; desc: string }> = {
    "/dashboard": { title: "Tổng quan", desc: "Tổng quan doanh thu và lợi nhuận" },
    "/roles": { title: "Quản lí phân quyền", desc: "Quản lí nhóm quyền và chức năng" },
    "/products": { title: "Quản lí sản phẩm", desc: "Quản lí sản phẩm và biến thể" },
    "/orders": { title: "Quản lí đơn hàng", desc: "Quản lí đơn hàng và tình trạng đơn hàng" },
    "/categories": { title: "Quản lí danh mục", desc: "Quản lí phân cấp danh mục" },
};
const Topbar = () => {
    const { pathname } = useLocation();
    const meta = titleMap[pathname] ?? { title: "Admin", desc: "Workspace" };
    const ref = useRef(null);
    const [isOpen, setOpen] = useState<boolean>(false);
    const anchorProps = useClick(isOpen, setOpen);
    const [show, setShow] = useState(false);
    const target = useRef(null);
    const dispatch = useAppDispatch();
    const { status, user } = useAppSelector((state) => state.auth)
    const handleLogout = () => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "http://localhost:8088/logout";
        document.body.appendChild(form);
        form.submit();
        dispatch(logout())
    }
    return (
        <div className="d-flex align-items-center w-100 justify-content-between gap-2 p-3">
            <div>
                <div className="fw-semibold">{meta.title}</div>
                <div className="text-muted small">{meta.desc}</div>
            </div>
            {/* <div className="form-app">
                <input className="form-control form-control-sm" placeholder="Search..." style={{ width: 260 }} />
            </div> */}
            <div className="d-flex align-items-center gap-4 me-3">
                {/* <button ref={target} onClick={() => setShow(!show)} className="btn-app btn-app--outline position-relative border-0 p-2">
                    <RiNotification3Fill className="fs-4" />
                    <span className="position-absolute top-10 start-100 translate-middle badge rounded-pill bg-danger">
                        99+
                    </span>
                </button>
                <Overlay
                    placement="bottom"
                    target={target.current}
                    show={show}
                >
                    {(props) => (
                        <Tooltip id="overlay-example" {...props}>
                            My Tooltip
                        </Tooltip>
                    )}
                </Overlay> */}
                <span>{user?.userName}</span>
                <button className="avatar" type="button" ref={ref} {...anchorProps}>
                    <Avatar size="sm" src={DefaultAvatar} alt="avatar" />
                </button>
                <ControlledMenu
                    state={isOpen ? 'open' : 'closed'}
                    anchorRef={ref}
                    onClose={() => setOpen(false)}
                >
                    {status == "authenticated"
                        ? (
                            <>
                                <MenuItem>
                                    <Link to="/profile" className="d-flex align-items-center gap-2">
                                        <RiMapPinUserLine />
                                        <span>Hồ sơ</span>
                                    </Link></MenuItem>
                                <MenuItem>
                                    <div className="d-flex align-items-center gap-2" onClick={handleLogout}>
                                        <RiLogoutBoxLine />
                                        <span>Đăng xuất</span>
                                    </div>
                                </MenuItem>
                            </>
                        )
                        : (
                            <MenuItem>
                                <a href="http://localhost:8082/auth/oauth2/authorization/admin-idp" className="d-flex align-items-center gap-2 text-decoration-none text-dark">
                                    <RiLoginBoxLine />
                                    <span>Đăng nhập</span>
                                </a>
                            </MenuItem>
                        )
                    }

                </ControlledMenu>
            </div>
        </div>
    );
}

export default Topbar