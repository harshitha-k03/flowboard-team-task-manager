import toast from "react-hot-toast";

const baseStyle = {
  borderRadius: "18px",
  padding: "14px 16px",
  fontSize: "14px",
  fontWeight: 500,
  boxShadow: "0 18px 40px -20px rgba(15, 23, 42, 0.35)"
};

const variants = {
  success: {
    icon: "✓",
    style: {
      ...baseStyle,
      background: "#F0FDF4",
      color: "#166534",
      border: "1px solid #86EFAC"
    }
  },
  error: {
    icon: "!",
    style: {
      ...baseStyle,
      background: "#FEF2F2",
      color: "#B91C1C",
      border: "1px solid #FCA5A5"
    }
  },
  warning: {
    icon: "!",
    style: {
      ...baseStyle,
      background: "#FFF7ED",
      color: "#C2410C",
      border: "1px solid #FDBA74"
    }
  },
  info: {
    icon: "i",
    style: {
      ...baseStyle,
      background: "#EFF6FF",
      color: "#1D4ED8",
      border: "1px solid #93C5FD"
    }
  }
} as const;

export const notify = {
  success(message: string) {
    toast(message, variants.success);
  },
  error(message: string) {
    toast(message, variants.error);
  },
  warning(message: string) {
    toast(message, variants.warning);
  },
  info(message: string) {
    toast(message, variants.info);
  }
};
