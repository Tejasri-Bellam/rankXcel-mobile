import { COLORS } from "@/src/styles/styles";

// Shared page-header styling: a "‹ Back" row with the page title on the line
// below it. Every screen-level header in the app uses this, so the back
// affordance and title sit in the same place on every page.
export const screenHeaderStyles: any = {
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 15, fontWeight: "600", color: COLORS.primary },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
  },
  title: {
    flexShrink: 1,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textDark,
  },
  // Right-hand slot (filter button, "Mark all as read", …) pinned to the end
  // of the title row.
  rightSlot: { marginLeft: "auto" },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
};
