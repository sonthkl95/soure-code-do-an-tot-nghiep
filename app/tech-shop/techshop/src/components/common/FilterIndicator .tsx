import { components, type DropdownIndicatorProps } from "react-select";
import { RiFilter3Line } from "react-icons/ri";

// Icon cho FILTER
export const FilterIndicator = (props: DropdownIndicatorProps<any, boolean>) => (
  <components.DropdownIndicator {...props}>
    <RiFilter3Line size={18} />
  </components.DropdownIndicator>
);