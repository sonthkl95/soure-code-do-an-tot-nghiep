import type { IconOption } from "../features/data/icon.data";
import { components } from "react-select";
import { FiSearch } from "react-icons/fi"

export const SingleValue = (props: any) => {
  const data = props.data as IconOption;
  const IconComp = data?.Icon;

  return (
    <components.SingleValue {...props}>
      <div className="d-flex align-items-center gap-2">
        {IconComp ? <IconComp size={16} /> : <span style={{ width: 16 }} />}
        <span>{data?.label ?? ""}</span>
      </div>
    </components.SingleValue>
  );
};
export const Control = ({ children, ...props }: any) => (
  <components.Control {...props}>
    <FiSearch style={{ marginLeft: 12, color: "#9CA3AF" }} />
    {children}
  </components.Control>
);

export const Option = (props: any) => {
  const data = props.data as IconOption
  const IconComp = data?.Icon
  return (
    <components.Option {...props}>
      <div className="d-flex align-items-center gap-2">
        {IconComp ? <IconComp size={16} /> : <span style={{ width: 16 }} />}
        <span>{data?.label ?? ""}</span>
      </div>
    </components.Option>
  )
}

