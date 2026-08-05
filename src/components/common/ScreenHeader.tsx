import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/src/styles/styles";
import { screenHeaderStyles as styles } from "@/src/styles/styles/common/screenheaderstyles";

type Props = {
  /**
   * Page title, rendered on the line below the back row. Omit only on screens
   * that already carry their own hero title (e.g. the set-goal screen), where
   * repeating it here would print it twice — the back row renders alone.
   */
  title?: string;
  /** Optional line under the title (e.g. a breadcrumb or short blurb). */
  subtitle?: string;
  /** Tapping "‹ Back". Screens own where back goes (pop, replace, sub-view). */
  onBack: () => void;
  /** Label beside the chevron — only override when "Back" would be wrong. */
  backLabel?: string;
  /** Rendered immediately after the title, e.g. a count badge. */
  titleAccessory?: React.ReactNode;
  /** Optional control pinned to the right of the title (filter, action, …). */
  right?: React.ReactNode;
};

/**
 * The app's one page header: a "‹ Back" row with the title below it.
 *
 * Every screen-level back affordance goes through this so the icon, the label
 * and the title all sit in the same place on every page — previously some
 * screens had an icon only, some an icon + "Back", and some put the title
 * inline with the back button instead of below it.
 */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = "Back",
  titleAccessory,
  right,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
        <Text style={styles.backText}>{backLabel}</Text>
      </TouchableOpacity>

      {title ? (
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {titleAccessory}
          {right ? <View style={styles.rightSlot}>{right}</View> : null}
        </View>
      ) : null}

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
