import { components, type DropdownIndicatorProps } from "react-select";
import {  RiArrowUpDownLine } from "react-icons/ri";
export const SortIndicator = (props: DropdownIndicatorProps<any, boolean>) => (
  <components.DropdownIndicator {...props}>
    <RiArrowUpDownLine size={18} />
  </components.DropdownIndicator>
);