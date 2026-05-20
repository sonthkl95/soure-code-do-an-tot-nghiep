import { data, Link } from "react-router";
import { Carousel } from "react-bootstrap";
import React, { useMemo, useState } from "react";
import { useGetAllCategoriesQuery } from "../../features/category/category.api";
import { optionIcons } from "../../features/data/icon.data";
import type { Category } from "../../types/category.type";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// ---- iconMap: build 1 lần ----
const iconMap = optionIcons.reduce<Record<string, React.ComponentType<{ size?: number }>>>(
    (acc, cur) => {
        acc[cur.value] = cur.Icon;
        return acc;
    },
    {}
);

// ---- Simple Skeleton components ----


const MenuListSkeleton = () => (
    <div className="mega-menu-list">
        {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="mega-menu-list-item px-3 py-2">
                <span className="placeholder col-9 placeholder-glow"></span>
            </div>
        ))}
    </div>
);

const PanelSkeleton = () => (
    <div className="mega-menu-panel-container">
        <div className="mega-menu-panel-content row">
            <div className="col-8 d-flex flex-wrap gap-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="d-inline-flex flex-column" style={{ width: 160 }}>
                        <span className="placeholder col-10 placeholder-glow"></span>
                        <span className="placeholder col-8 placeholder-glow mt-2"></span>
                        <span className="placeholder col-9 placeholder-glow mt-2"></span>
                        <span className="placeholder col-7 placeholder-glow mt-2"></span>
                    </div>
                ))}
            </div>
            <div className="col-4" />
        </div>
    </div>
);

const MegaMenu = () => {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const { data: menuData, isLoading, isFetching, isError } = useGetAllCategoriesQuery(null);

    const close = () => {
        setOpen(false);
        setActiveId(null);
    };

    const openMenu = () => setOpen(true);

    const handleListLeave = (e: React.MouseEvent) => {
        const next = e.relatedTarget as HTMLElement | null;
        if (next?.closest(".mega-menu-panel-container")) return;
        close();
    };

    const handlePanelLeave = (e: React.MouseEvent) => {
        const next = e.relatedTarget as HTMLElement | null;
        if (next?.closest(".mega-menu-left")) return;
        if (next?.closest(".mega-menu-list")) return;
        close();
    };

    const activeCategory = useMemo(() => {
        if (!menuData || !activeId) return null;
        return menuData.find((i: Category) => i.id === activeId) ?? null;
    }, [menuData, activeId]);

    // ✅ Sonar S3358: tách render logic khỏi JSX
    const menuContent: React.ReactNode = useMemo(() => {
        if (isLoading) return <MenuListSkeleton />;

        if (isError) {
            return <div className="mega-menu-error">Không tải được danh mục.</div>;
        }

        if (!menuData || menuData.length === 0) {
            return <div className="mega-menu-empty">Chưa có danh mục.</div>;
        }

        return menuData.map((item: Category, index) => {
            const IconComp = item.icon ? iconMap[item.icon] : undefined;

            return (
                <Link
                    key={item.id}
                    to={`/q/${item?.slug}.i-${item?.id}`}
                    className={`mega-menu-list-item ${activeId === item.id ? "active" : ""} ${index == menuData?.length - 1 && "border-0"}`}
                    onMouseEnter={() => {
                        setActiveId(item.id);
                        openMenu();
                    }}
                >
                    <span className="item-bg" />
                    <span className="item-text d-flex align-items-center gap-2">
                        {IconComp ? <IconComp size={18} /> : null}
                        <span>{item.name}</span>
                    </span>
                </Link>
            );
        });
    }, [isLoading, isError, menuData, activeId]);

    const panelContent: React.ReactNode = useMemo(() => {
        if (!open || !activeId) return null;
        if (isLoading || isFetching) return <PanelSkeleton />;
        console.log({ activeCategory });

        return (
            <nav
                className="mega-menu-panel-container"
                onMouseEnter={openMenu}
                onMouseLeave={handlePanelLeave}
            >
                <div className="mega-menu-panel-content-container p-2">
                    <div className="mega-menu-panel-content row mx-0">
                        <div className="col-8 d-flex flex-wrap gap-3">
                            {(activeCategory?.children ?? []).map((c) => (
                                <div key={c.id} className="d-inline-flex flex-column">
                                    <Link to={`/q/${activeCategory?.slug}.i-${activeCategory?.id}/${c?.slug}.i-${c?.id}`} className="mega-menu-panel-item">
                                        {c.name}
                                    </Link>

                                    {(c.children ?? []).map((l) => (
                                        <Link key={l.id} to={`/q/${activeCategory?.slug}.i-${activeCategory?.id}/${l?.slug}.i-${l?.id}`} className="mega-menu-panel-subitem">
                                            {l.name}
                                        </Link>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="col-4">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                {activeCategory?.brands.map(br => (
                                    <div className="logo-item" key={br.id}>
                                        <Link className="brand-logo-container"  to={`/q/${activeCategory.slug}.i-${activeCategory.id}?brand=${br.slug}.i-${br.id}`}><img className="brand-logo-img" src={br.logo.imageUrl ?? ""} alt="" /></Link>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </nav>
        );
    }, [open, activeId, isLoading, isFetching, activeCategory]);

    return (
        <nav className="mega-menu row align-items-start" onMouseLeave={close}>
            <div className="col-4 p-0 mega-menu-left">
                <nav className="mega-menu-list" onMouseLeave={handleListLeave}>
                    {menuContent}
                </nav>
            </div>

            <div className="col-8 p-0 mega-menu-right">
                {panelContent}

                <div className="ps-2 mega-menu-carousel">
                    <Swiper>
                        <SwiperSlide>
                            <img
                                src="https://cdn2.fptshop.com.vn/unsafe/1240x0/filters:format(webp):quality(75)/610x504_9734cbea1f.png"
                                className="d-block w-100"
                                alt="..."
                            />
                        </SwiperSlide>
                        <SwiperSlide>
                            <img
                                src="https://cdn2.fptshop.com.vn/unsafe/1240x0/filters:format(webp):quality(75)/610x504_673199b048.png"
                                className="d-block w-100"
                                alt="..."
                            />
                        </SwiperSlide>
                    </Swiper>
                </div>
            </div>
        </nav>
    );
};

export default MegaMenu;
