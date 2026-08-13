import { StylesConfig } from "react-select";

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

export const getCustomSelectStyles = (hasError?: boolean): StylesConfig<SelectOption<any>, false> => ({
  control: (base, state) => ({
    ...base,
    minHeight: "46px",
    borderRadius: "0.75rem",
    borderColor: hasError
      ? "#f87171"
      : state.isFocused
        ? "#ef4444"
        : "#374151",
    boxShadow: hasError
      ? "0 0 0 1px #f87171"
      : state.isFocused
        ? "0 0 0 1px #ef4444"
        : "none",
    "&:hover": {
      borderColor: hasError
        ? "#ef4444"
        : state.isFocused
          ? "#ef4444"
          : "#4b5563",
    },
    backgroundColor: "#1f2937",
    color: "#f9fafb",
    fontSize: "0.875rem",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#ef4444" : "#9ca3af",
    "&:hover": {
      color: "#ef4444",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "#9ca3af",
    "&:hover": {
      color: "#ef4444",
    },
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    fontSize: "0.875rem",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#dc2626"
      : state.isFocused
        ? "#7f1d1d"
        : "#1f2937",
    color: "#f9fafb",
    cursor: "pointer",
    fontSize: "0.875rem",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#f9fafb",
  }),
  input: (base) => ({
    ...base,
    color: "#f9fafb",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
  }),
});
