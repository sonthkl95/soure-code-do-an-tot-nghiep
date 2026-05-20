import { AiOutlineLaptop, AiOutlineProduct } from "react-icons/ai";
import { BsDisplay, BsMenuButtonFill, BsTags } from "react-icons/bs";
import { GiWashingMachine, GiWatch } from "react-icons/gi";
import { GrWifiLow } from "react-icons/gr";
import { ImPrinter } from "react-icons/im";
import { LuRefrigerator } from "react-icons/lu";
import { MdOutlineInventory2 } from "react-icons/md";
import { PiTelevisionSimple } from "react-icons/pi";
import {
  RiDashboardLine,
  RiUserLine,
  RiUserSettingsLine,
  RiLockLine,
  RiSettings3Line,
  RiEqualizerLine,
  RiToolsLine,
  RiShoppingCartLine,
  RiBankCardLine,
  RiBox3Line,
  RiFolderLine,
  RiBarChartLine,
  RiPieChartLine,
  RiLineChartLine,
  RiNotification3Line,
  RiMailLine,
  RiFileListLine,
  RiSearchLine,
  RiHistoryLine,
  RiDatabase2Line,
  RiCloudLine,
  RiGitPullRequestLine,
  RiPriceTag3Line,
  RiShieldLine,
  RiStackLine,
  RiShape2Line,
  RiSmartphoneLine,
  RiAppleLine,
  RiAndroidLine,
  RiTabletLine,
  RiHeadphoneLine,
  RiCamera3Line,
} from "react-icons/ri";
import { SiOppo, SiSamsung, SiXiaomi } from "react-icons/si";
import { TbAirConditioning, TbDevicesPc } from "react-icons/tb";
import { TfiMedall } from "react-icons/tfi";
export type IconOption = {
  value: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
};
export const optionIcons: IconOption[] = [
  // ===== CORE =====
  { value: "RiDashboardLine", label: "Tổng quan", Icon: RiDashboardLine },
  { value: "RiUserLine", label: "Người dùng", Icon: RiUserLine },
  {
    value: "RiUserSettingsLine",
    label: "Cài đặt người dùng",
    Icon: RiUserSettingsLine,
  },
  { value: "RiShieldLine", label: "Vai trò", Icon: RiShieldLine },
  { value: "RiStackLine", label: "Chức năng", Icon: RiStackLine },
  {
    value: "RiGitPullRequestLine",
    label: "Quyền hạn",
    Icon: RiGitPullRequestLine,
  },
  { value: "RiLockLine", label: "Bảo mật", Icon: RiLockLine },

  // ===== SYSTEM =====
  { value: "RiSettings3Line", label: "Cài đặt", Icon: RiSettings3Line },
  { value: "RiEqualizerLine", label: "Cấu hình", Icon: RiEqualizerLine },
  { value: "RiToolsLine", label: "Công cụ hệ thống", Icon: RiToolsLine },

  // ===== BUSINESS =====
  { value: "RiShoppingCartLine", label: "Đơn hàng", Icon: RiShoppingCartLine },
  { value: "RiBankCardLine", label: "Thanh toán", Icon: RiBankCardLine },
  { value: "RiBox3Line", label: "Sản phẩm", Icon: RiBox3Line },
  { value: "RiFolderLine", label: "Danh mục", Icon: RiFolderLine },
  { value: "RiPriceTag3Line", label: "Thuộc tính", Icon: RiPriceTag3Line },
  { value: "RiShape2Line", label: "Bộ Thuộc tính", Icon: RiShape2Line },

  // ===== REPORT =====
  { value: "RiBarChartLine", label: "Báo cáo", Icon: RiBarChartLine },
  { value: "RiPieChartLine", label: "Phân tích", Icon: RiPieChartLine },
  { value: "RiLineChartLine", label: "Thống kê", Icon: RiLineChartLine },

  // ===== NOTIFICATION =====
  {
    value: "RiNotification3Line",
    label: "Thông báo",
    Icon: RiNotification3Line,
  },
  { value: "RiMailLine", label: "Email", Icon: RiMailLine },

  // ===== AUDIT / LOG =====
  { value: "RiFileListLine", label: "Log", Icon: RiFileListLine },
  { value: "RiSearchLine", label: "Audit", Icon: RiSearchLine },
  { value: "RiHistoryLine", label: "Lịch sử", Icon: RiHistoryLine },

  // ===== INFRA =====
  { value: "RiDatabase2Line", label: "Database", Icon: RiDatabase2Line },
  { value: "RiCloudLine", label: "Cloud", Icon: RiCloudLine },

  // category
  { value: "RiSmartphoneLine", label: "Điện thoại", Icon: RiSmartphoneLine },
  { value: "RiAppleLine", label: "Apple", Icon: RiAppleLine },
  { value: "RiAndroidLine", label: "Android", Icon: RiAndroidLine },
  { value: "SiSamsung", label: "Samsung", Icon: SiSamsung },
  { value: "SiOppo", label: "Oppo", Icon: SiOppo },
  { value: "SiXiaomi", label: "Xiaomi", Icon: SiXiaomi },
  { value: "BsTags", label: "Thuộc tính", Icon: BsTags },
  {
    value: "AiOutlineLaptop",
    label: "Máy tính xách tay",
    Icon: AiOutlineLaptop,
  },
  { value: "TfiMedall", label: "Thương hiệu", Icon: TfiMedall },
  { value: "AiOutlineProduct", label: "Đơn hàng", Icon: AiOutlineProduct },
  { value: "TbDevicesPc", label: "Máy tính để bàn", Icon: TbDevicesPc },
  { value: "MdOutlineInventory2", label: "Tồn kho", Icon: MdOutlineInventory2 },
  { value: "RiTabletLine", label: "Tablet", Icon: RiTabletLine },
  { value: "PiTelevisionSimple", label: "Tivi", Icon: PiTelevisionSimple },
  { value: "GiWashingMachine", label: "Máy giặt", Icon: GiWashingMachine },
  { value: "LuRefrigerator", label: "Tủ lạnh", Icon: LuRefrigerator },
  { value: "RiHeadphoneLine", label: "Tai nghe", Icon: RiHeadphoneLine },
  { value: "TbAirConditioning", label: "Điều hòa", Icon: TbAirConditioning },
  { value: "BsMenuButtonFill", label: "Link kiện PC", Icon: BsMenuButtonFill },
  { value: "BsDisplay", label: "Màn hình", Icon: BsDisplay },
  { value: "GiWatch", label: "Đồng hồ", Icon: GiWatch },
  { value: "RiCamera3Line", label: "Camera", Icon: RiCamera3Line },
  { value: "GrWifiLow", label: "Thiết bị mạng", Icon: GrWifiLow },
  { value: "ImPrinter", label: "TB Văn phòng", Icon: ImPrinter },









  
];
