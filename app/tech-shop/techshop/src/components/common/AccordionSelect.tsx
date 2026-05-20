import { Accordion, Col, Row } from "react-bootstrap";
import "../../styles/components/_accordion.scss";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";

type Option = {
  id: string;
  label: React.ReactNode;
  description: string;
  order: number;
  disabled?: boolean;
};

export type Section = {
  key: string;
  eventKey: string;
  title: React.ReactNode;
  options: Option[];
  order: number;
  disabled?: boolean;
};

type AccordionSelectProps = {
  sections: Section[];

  /** mảng đang render/đang chọn hiện tại (controlled) */
  value: string[];

  /** mảng những cái đã được chọn sẵn (edit page) để so sánh */
  selectedValue?: string[];

  onChange: (next: string[]) => void;
  defaultActiveKey?: string;

  /** disable toàn bộ component */
  disabled?: boolean;
};

const AccordionSelect: React.FC<AccordionSelectProps> = ({
  sections,
  value,
  selectedValue = [],
  onChange,
  defaultActiveKey = "0",
  disabled = false,
}) => {
  const parentRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedSet = useMemo(() => new Set(value), [value]);
  const baseSelectedSet = useMemo(() => new Set(selectedValue), [selectedValue]);

  const getSectionSelecTableIds = (section: Section) =>
    section.options.filter((o) => !o.disabled).map((o) => o.id);

  const getSectionStats = (section: Section) => {
    const selectTableIds = getSectionSelecTableIds(section);
    const total = selectTableIds.length;
    const selected = selectTableIds.filter((id) => selectedSet.has(id)).length;
    return { total, selected, selectTableIds };
  };

  const toggleOption = (id: string) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const toggleSectionAll = (section: Section) => {
    if (disabled) return;
    const { total, selected, selectTableIds } = getSectionStats(section);
    const next = new Set(selectedSet);

    const shouldSelectAll = selected !== total; // nếu chưa chọn hết -> chọn hết, ngược lại -> bỏ hết
    selectTableIds.forEach((id) => {
      if (shouldSelectAll) next.add(id);
      else next.delete(id);
    });

    onChange(Array.from(next));
  };

  // giữ nguyên style cũ: trả về string className như trước
  const isSectionNotDisabled = (section: Section) => {
    let classPre = "mt-1 mb-2 ";
    // thêm disabled toàn cục vào điều kiện
    if (disabled || section.disabled || section.options.length === 0) {
      classPre = classPre + "accordion-disabled ";
    }
    return classPre + "accordion-item";
  };

  // tiện cho edit page (chưa dùng để style => không ảnh hưởng UI cũ)
  const wasChecked = (id: string) => baseSelectedSet.has(id);
  const isAdded = (id: string) => selectedSet.has(id) && !baseSelectedSet.has(id);
  const isRemoved = (id: string) => !selectedSet.has(id) && baseSelectedSet.has(id);
  // bạn có thể dùng 3 hàm trên nếu muốn render badge/tooltip sau này

  useEffect(() => {
    sections.forEach((section) => {
      const ref = parentRefs.current[section.key];
      if (!ref) return;

      const { total, selected } = getSectionStats(section);
      const isAll = total > 0 && selected === total;
      const isNone = selected === 0;
      ref.indeterminate = !isAll && !isNone;
    });
  }, [sections, value]);

  return (
    <Accordion defaultActiveKey={defaultActiveKey} alwaysOpen>
      {sections.map((section) => {
        const { total, selected } = getSectionStats(section);
        const isAny = selected > 0;

        // section disabled thực tế (kết hợp global + section + empty)
        const sectionDisabled = disabled || section.disabled || section.options.length === 0;

        return (
          <Accordion.Item
            bsPrefix={isSectionNotDisabled(section)}
            eventKey={section.eventKey}
            key={section.key}
          >
            <Accordion.Header aria-disabled={sectionDisabled}>
              <div className="d-flex align-items-center justify-content-between form-app">
                <div className="d-flex align-items-center">
                  <input
                    ref={(el) => {
                      parentRefs.current[section.key] = el;
                    }}
                    className="me-2"
                    type="checkbox"
                    checked={isAny}
                    disabled={sectionDisabled || total === 0}
                    onChange={() => toggleSectionAll(section)}
                    onClick={(e) => e.stopPropagation()} // tránh click làm toggle accordion
                    onFocus={(e) => e.stopPropagation()}
                  />
                  <span className="f-bold text-black align-middle f-body d-inline-block">
                    {section.title}
                  </span>
                </div>

                <span className="total-select text-dark f-body-3xs">
                  {selected}/{total}
                </span>
              </div>
            </Accordion.Header>

            {isSectionNotDisabled(section) && (
              <Accordion.Body>
                <Row className="g-2">
                  {section.options.map((opt) => {
                    const checked = selectedSet.has(opt.id);
                    const optDisabled = disabled || section.disabled || opt.disabled;

                    return (
                      <Col xs={12} md={6} key={opt.id}>
                        <button
                          className={[
                            "perm-option-card w-100",
                            checked ? "is-selected" : "",
                            optDisabled ? "is-disabled" : "",
                          ].join(" ")}
                          type="button"
                          tabIndex={0}
                          disabled={optDisabled}
                          onClick={() => {
                            if (!optDisabled) toggleOption(opt.id);
                          }}
                          onKeyDown={(e) => {
                            if (optDisabled) return;
                            if (e.key === "Enter" || e.key === " ") toggleOption(opt.id);
                          }}
                        >
                          <div className="perm-option-inner d-flex gap-3 align-items-start m-0">
                            <input
                              className="perm-checkbox"
                              type="checkbox"
                              checked={checked}
                              disabled={optDisabled}
                              onChange={() => toggleOption(opt.id)}
                              onClick={(e) => e.stopPropagation()} // tránh click double
                            />

                            <div className="perm-option-text">
                              <div className="perm-option-label">{opt.label}</div>
                              {opt.description ? (
                                <div className="perm-option-desc">{opt.description}</div>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </Col>
                    );
                  })}
                </Row>
              </Accordion.Body>
            )}
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export default AccordionSelect;
