import { Text, TouchableOpacity, View } from "react-native";
import dashboardData from "../json/dashboard";
import { COLORS } from "@/src/styles/styles";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useRouter } from 'expo-router';

const scores = dashboardData.performance;
  const max = 260;
  const chartH = 60;

  const subjects = dashboardData.subjects;

export default function Continue() {
  const router = useRouter();
  return (
    <View className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Performance card */}
        <View style={styles.card}>
              <View style={styles.perfHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    Recent Performance
                  </Text>
        
                  <Text style={styles.cardSubtitle}>
                    Last {scores.length} mock scores
                  </Text>
                </View>
        
                <View style={styles.improvingBadge}>
                  <Ionicons
                    name="trending-up"
                    size={13}
                    color={COLORS.green}
                  />
        
                  <Text style={styles.improvingText}>
                    Improving
                  </Text>
                </View>
              </View>
        
              <View style={styles.chartContainer}>
                {scores.map((item, index) => (
                  <View
                    key={index}
                    style={styles.chartBarCol}
                  >
                    <Text style={styles.chartBarValue}>
                      {item.value}
                    </Text>
        
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height:
                            (item.value / max) * chartH,
                        },
                      ]}
                    />
        
                    <Text style={styles.chartBarLabel}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
        </View>

      {/* Subject health card */}
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <View>
                <Text style={styles.cardTitle}>
                    Subject Health
                </Text>

                <Text style={styles.cardSubtitle}>
                    Accuracy across all mocks
                </Text>
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/analytics')}
                >
                  <Text style={styles.detailsLink}>
                    Details →
                  </Text>
                </TouchableOpacity>
            </View>

            {subjects.map((item, index) => (
                <View
                key={index}
                style={styles.subjectRow}
                >
                <View
                    style={[
                    styles.subjectCircle,
                    {
                        borderColor: item.color,
                    },
                    ]}
                >
                    <Text
                    style={[
                        styles.subjectPct,
                        {
                        color: item.color,
                        },
                    ]}
                    >
                    {item.percent}%
                    </Text>
                </View>

                <View
                    style={{
                    flex: 1,
                    marginLeft: 12,
                    }}
                >
                    <View style={styles.subjectNameRow}>
                    <Text style={styles.subjectIcon}>
                        {item.icon}
                    </Text>

                    <Text style={styles.subjectName}>
                        {item.name}
                    </Text>

                    <Text
                        style={[
                        styles.subjectLevel,
                        {
                            color: item.color,
                        },
                        ]}
                    >
                        {item.level}
                    </Text>
                    </View>

                    <View style={styles.subjectBarBg}>
                    <View
                        style={[
                        styles.subjectBarFill,
                        {
                            width: `${item.percent}%`,
                            backgroundColor:
                            item.color,
                        },
                        ]}
                    />
                    </View>
                </View>
                </View>
            ))}
        </View>

    </View>
    );
}

const styles: any = ({

    // Card base
    card: {
        backgroundColor: COLORS.white, borderRadius: 16,
        marginHorizontal: 16, marginTop: 14, padding: 16,
        shadowColor: COLORS.cardShadow, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1, shadowRadius: 10, elevation: 2,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    detailsLink: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
    cardSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },

    // Performance Card
    perfHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    improvingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.greenLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    improvingText: { fontSize: 12, color: COLORS.green, fontWeight: '600' },
    chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 },
    chartBarCol: { alignItems: 'center', flex: 1, gap: 4 },
    chartBarValue: { fontSize: 10, color: COLORS.textMedium, fontWeight: '600' },
    chartBar: { width: 28, backgroundColor: COLORS.primary, borderRadius: 6, opacity: 0.85 },
    chartBarLabel: { fontSize: 9, color: COLORS.textLight },

    // Subject health
    subjectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    subjectCircle: {
        width: 50, height: 50, borderRadius: 25,
        borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    },
    subjectPct: { fontSize: 13, fontWeight: '800' },
    subjectNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    subjectIcon: { fontSize: 14 },
    subjectName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, flex: 1 },
    subjectLevel: { fontSize: 12, fontWeight: '600' },
    subjectBarBg: { height: 5, backgroundColor: COLORS.border, borderRadius: 4 },
    subjectBarFill: { height: 5, borderRadius: 4 },
});
