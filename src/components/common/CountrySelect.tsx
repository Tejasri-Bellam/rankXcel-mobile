import React, { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/src/libs/utils/apiError";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCountriesService,
  svgToDataUri,
} from "@/src/libs/services/countries";
import { CURRENCY_SYMBOLS } from "@/src/libs/constants";
import { countrySelectStyles as styles } from "@/src/styles/styles/common/countryselectstyles";

export type CountryOption = {
  id: number | string;
  name: string;
  code?: string;
  currency?: string;
  currencySymbol?: string;
  flagUrl?: string;
};

const normalizeCountry = (raw: any, idx: number): CountryOption => {
  const code =
    raw?.iso_code_2 ??
    raw?.code ??
    raw?.iso ??
    raw?.iso_code ??
    raw?.country_code;
  const currency = raw?.currency ?? raw?.currency_code ?? raw?.currencyCode;
  return {
    id: raw?.id ?? raw?.value ?? code ?? idx,
    name: raw?.name ?? raw?.label ?? raw?.country ?? raw?.display_name ?? "—",
    code: typeof code === "string" ? code.toUpperCase() : undefined,
    currency: currency || undefined,
    currencySymbol:
      raw?.currency_symbol ??
      raw?.currencySymbol ??
      (currency ? CURRENCY_SYMBOLS[currency] : undefined),
    flagUrl: svgToDataUri(raw?.flag),
  };
};

const Flag = ({ url, size = 18 }: { url?: string; size?: number }) => {
  if (url) {
    return (
      <ExpoImage
        source={{ uri: url }}
        style={{ width: size, height: size * 0.7, borderRadius: 3 }}
        contentFit="contain"
      />
    );
  }
  return <Text style={{ fontSize: size }}>🌐</Text>;
};

interface Props {
  // Fired both when the initial selection resolves and when the user picks a
  // country, so callers can treat it as the single source of truth for "the
  // country this screen is scoped to".
  onChange?: (country: CountryOption) => void;
  // Country to fall back on when nothing has been saved yet — e.g. the one
  // detected from the device via /v1/get_country/. May arrive late; the initial
  // selection re-resolves when it does (until the user picks something).
  preferredCountryId?: number | string | null;
  style?: StyleProp<ViewStyle>;
}

// Compact country picker for the auth/landing headers. Loads the catalogue from
// the countries API, restores any previously chosen region, and persists the
// selection (region + regionCountryId) so the rest of the app stays in sync.
export default function CountrySelect({
  onChange,
  preferredCountryId,
  style,
}: Props) {
  const [open, setOpen] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selected, setSelected] = useState<CountryOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callers pass an inline onChange; keep it in a ref so it can be called from
  // the resolve effect without re-running it on every parent render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Once the user picks explicitly, a late-arriving preferred country must not
  // move the selection back out from under them.
  const userPicked = useRef(false);

  // Load the country list once.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await getCountriesService();
        const payload = res?.data;
        const list: any[] = Array.isArray(payload)
          ? payload
          : payload?.results ?? payload?.data ?? payload?.countries ?? [];
        if (active) setCountries(list.map(normalizeCountry));
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Couldn't load countries."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Resolve the initial selection: a saved region if present, else the caller's
  // preferred (detected) country, else India, else the first country.
  useEffect(() => {
    if (countries.length === 0 || userPicked.current) return;
    let active = true;
    (async () => {
      const [savedRegion, savedId] = await Promise.all([
        AsyncStorage.getItem("region"),
        AsyncStorage.getItem("regionCountryId"),
      ]);
      const saved = savedRegion ? JSON.parse(savedRegion) : null;
      const initial =
        countries.find((c) => savedId && String(c.id) === String(savedId)) ??
        countries.find(
          (c) =>
            saved?.name &&
            c.name.toLowerCase() === String(saved.name).toLowerCase()
        ) ??
        countries.find(
          (c) =>
            preferredCountryId != null &&
            String(c.id) === String(preferredCountryId)
        ) ??
        countries.find((c) => c.name.toLowerCase() === "india") ??
        countries[0] ??
        null;
      if (!active || !initial || userPicked.current) return;
      setSelected(initial);
      onChangeRef.current?.(initial);
    })();
    return () => {
      active = false;
    };
  }, [countries, preferredCountryId]);

  const handleSelect = async (country: CountryOption) => {
    userPicked.current = true;
    setSelected(country);
    setOpen(false);
    try {
      await AsyncStorage.multiSet([
        [
          "region",
          JSON.stringify({
            id: country.id,
            name: country.name,
            currency: country.currency,
            flagUrl: country.flagUrl,
          }),
        ],
        ["regionCountryId", String(country.id)],
      ]);
    } catch {
      // Selection still applies in-memory for this session.
    }
    onChange?.(country);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.chip, style]}
        activeOpacity={0.85}
        onPress={() => setOpen(true)}
      >
        <Flag url={selected?.flagUrl} size={18} />
        <Text style={styles.chipText}>
          {selected?.code ?? selected?.name ?? "Region"}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#475569" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select your country</Text>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={styles.sheetClose}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetSub}>
            Sets your exam catalogue, currency and live-test schedule.
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#2F8AF4" />
            </View>
          ) : error ? (
            <Text style={styles.empty}>{error}</Text>
          ) : countries.length === 0 ? (
            <Text style={styles.empty}>No countries available.</Text>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 380 }}
            >
              {countries.map((c) => {
                const isSelected =
                  selected != null && String(c.id) === String(selected.id);
                const meta = [c.currencySymbol, c.currency]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <TouchableOpacity
                    key={String(c.id)}
                    activeOpacity={0.85}
                    onPress={() => handleSelect(c)}
                    style={[styles.card, isSelected && styles.cardSelected]}
                  >
                    <Flag url={c.flagUrl} size={26} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardName}>{c.name}</Text>
                      {meta ? <Text style={styles.cardSub}>{meta}</Text> : null}
                    </View>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#2F8AF4"
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 12 }} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}
