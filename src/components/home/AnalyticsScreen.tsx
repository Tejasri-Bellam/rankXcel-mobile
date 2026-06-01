import { analyticsStyles, chartStyles, donutStyles } from '@/src/styles/sidebar/analyticsStyles';
import { COLORS } from '@/src/styles/styles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { analyticsdata } from '../json/analytics';

const { width } = Dimensions.get('window');

type PeriodType = '7d' | '30d' | '90d' | 'All';

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

const BarChart = ({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) => {
  const max = Math.max(...data.map((d) => d.value));
  const chartH = 70;
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.col}>
          <Text style={chartStyles.value}>{d.value}</Text>
          <View
            style={[
              chartStyles.bar,
              {
                height: Math.max((d.value / max) * chartH, 4),
                backgroundColor: color,
              },
            ]}
          />
          <Text style={chartStyles.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Donut Chart (simple segments) ────────────────────────────────────────────

const SubjectDonut = ({
  data,
}: {
  data: { label: string; pct: number; color: string }[];
}) => (
  <View style={donutStyles.row}>
    {/* Simple stacked pill bars as proxy for donut */}
    <View style={donutStyles.barStack}>
      {data.map((d, i) => (
        <View
          key={i}
          style={[
            donutStyles.segment,
            { flex: d.pct, backgroundColor: d.color },
            i === 0 && donutStyles.segFirst,
            i === data.length - 1 && donutStyles.segLast,
          ]}
        />
      ))}
    </View>
    <View style={donutStyles.legend}>
      {data.map((d, i) => (
        <View key={i} style={donutStyles.legendItem}>
          <View style={[donutStyles.legendDot, { backgroundColor: d.color }]} />
          <Text style={donutStyles.legendLabel}>{d.label}</Text>
          <Text style={donutStyles.legendPct}>{d.pct}%</Text>
        </View>
      ))}
    </View>
  </View>
);

// ─── Stat Pill ────────────────────────────────────────────────────────────────

const StatPill = ({
  icon,
  label,
  value,
  delta,
  deltaUp,
  bg,
  iconColor,
}: {
  icon: string;
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  bg: string;
  iconColor: string;
}) => (
  <View style={analyticsStyles.statPill}>
    <View style={[analyticsStyles.statIconBg, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon as any} size={18} color={iconColor} />
    </View>
    <Text style={analyticsStyles.statValue}>{value}</Text>
    <Text style={analyticsStyles.statLabel}>{label}</Text>
    <Text style={[analyticsStyles.statDelta, { color: deltaUp ? COLORS.green : COLORS.red }]}>
      {deltaUp ? '↑' : '↓'} {delta}
    </Text>
  </View>
);

// ─── Chapter Row ──────────────────────────────────────────────────────────────

const ChapterRow = ({
  rank,
  name,
  subject,
  pct,
  color,
  subjectBg,
  subjectText,
}: {
  rank: number;
  name: string;
  subject: string;
  pct: number;
  color: string;
  subjectBg: string;
  subjectText: string;
}) => (
  <View style={analyticsStyles.chapterRow}>
    <View style={[analyticsStyles.chapterRank, { backgroundColor: color }]}>
      <Text style={analyticsStyles.chapterRankText}>{rank}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: 10 }}>
      <View style={analyticsStyles.chapterNameRow}>
        <Text style={analyticsStyles.chapterName}>{name}</Text>
        <View style={[analyticsStyles.subjectTag, { backgroundColor: subjectBg }]}>
          <Text style={[analyticsStyles.subjectTagText, { color: subjectText }]}>{subject}</Text>
        </View>
      </View>
      <View style={analyticsStyles.chapterBarBg}>
        <View style={[analyticsStyles.chapterBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
    <Text style={[analyticsStyles.chapterPct, { color }]}>{pct}%</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<PeriodType>('30d');
  const analytics = analyticsdata();
  const { scoreData, timeData, subjectSplit, weakChapters, mockHistory, rankProgression } = analytics;
  const periods: PeriodType[] = ['7d', '30d', '90d', 'All'];

  return (
    <View style={analyticsStyles.safeArea}>
      <ScrollView
        style={analyticsStyles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={analyticsStyles.scrollContent}
      >
        {/* ── Page title + period selector ── */}
        <View style={analyticsStyles.pageTitleRow}>
          <View>
            <Text style={analyticsStyles.pageTitle}>Analytics</Text>
            <Text style={analyticsStyles.pageSub}>Track your performance over time</Text>
          </View>
          <View style={analyticsStyles.periodRow}>
            {periods.map((p) => (
              <TouchableOpacity
                key={p}
                style={[analyticsStyles.periodBtn, period === p && analyticsStyles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[analyticsStyles.periodText, period === p && analyticsStyles.periodTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Summary stats ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={analyticsStyles.statRow}
        >
          <StatPill icon="file-document-outline" label="Mocks Taken" value="12" delta="3 this week" deltaUp bg={COLORS.primaryLight} iconColor={COLORS.primary} />
          <StatPill icon="target" label="Best Percentile" value="94.3%ile" delta="2.1 from last" deltaUp bg={COLORS.greenLight} iconColor={COLORS.green} />
          <StatPill icon="chart-bar" label="Avg Score" value="209" delta="8 from last" deltaUp bg="#FFF0E6" iconColor={COLORS.orange} />
          <StatPill icon="trending-up" label="Avg Accuracy" value="68.2%" delta="1.3% last" deltaUp bg="#F3F0FF" iconColor={COLORS.primary} />
        </ScrollView>

        {/* ── Score trend ── */}
        <View style={analyticsStyles.card}>
          <View style={analyticsStyles.cardHeaderRow}>
            <View>
              <Text style={analyticsStyles.cardTitle}>Score Trend</Text>
              <Text style={analyticsStyles.cardSub}>Last 6 mock tests</Text>
            </View>
            <View style={analyticsStyles.improvingBadge}>
              <Ionicons name="trending-up" size={12} color={COLORS.green} />
              <Text style={analyticsStyles.improvingText}>Improving</Text>
            </View>
          </View>
          <BarChart data={scoreData} color={COLORS.primary} />
        </View>

        {/* ── Subject accuracy ── */}
        <View style={analyticsStyles.card}>
          <Text style={analyticsStyles.cardTitle}>Subject Accuracy</Text>
          <Text style={analyticsStyles.cardSub}>Average across all mocks</Text>

          <View style={{ marginTop: 16, gap: 14 }}>
            {[
              { name: 'Physics', icon: '⚡', pct: 71, color: COLORS.primary },
              { name: 'Chemistry', icon: '🧪', pct: 58, color: COLORS.green },
              { name: 'Mathematics', icon: '📐', pct: 63, color: COLORS.yellow },
            ].map((s) => (
              <View key={s.name}>
                <View style={analyticsStyles.subjectAccuracyRow}>
                  <Text style={analyticsStyles.subjectIcon}>{s.icon}</Text>
                  <Text style={analyticsStyles.subjectName}>{s.name}</Text>
                  <Text style={[analyticsStyles.subjectPct, { color: s.color }]}>{s.pct}%</Text>
                </View>
                <View style={analyticsStyles.accuracyBarBg}>
                  <View
                    style={[
                      analyticsStyles.accuracyBarFill,
                      { width: `${s.pct}%`, backgroundColor: s.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Time studied ── */}
        <View style={analyticsStyles.card}>
          <View style={analyticsStyles.cardHeaderRow}>
            <View>
              <Text style={analyticsStyles.cardTitle}>Study Time</Text>
              <Text style={analyticsStyles.cardSub}>Minutes per day this week</Text>
            </View>
            <View style={[analyticsStyles.improvingBadge, { backgroundColor: '#FFF0E6' }]}>
              <Ionicons name="time-outline" size={12} color={COLORS.orange} />
              <Text style={[analyticsStyles.improvingText, { color: COLORS.orange }]}>This week</Text>
            </View>
          </View>
          <BarChart data={timeData} color={COLORS.orange} />
        </View>

        {/* ── Subject split ── */}
        <View style={analyticsStyles.card}>
          <Text style={analyticsStyles.cardTitle}>Subject Split</Text>
          <Text style={analyticsStyles.cardSub}>Questions attempted per subject</Text>
          <SubjectDonut data={subjectSplit} />
        </View>

        {/* ── Rank progression ── */}
        <View style={analyticsStyles.card}>
          <View style={analyticsStyles.cardHeaderRow}>
            <View>
              <Text style={analyticsStyles.cardTitle}>Rank Progression</Text>
              <Text style={analyticsStyles.cardSub}>Estimated AIR across mocks</Text>
            </View>
          </View>
          <View style={{ marginTop: 12, gap: 10 }}>
            {[
              { date: 'Feb 12', rank: '~11,200', delta: '↑ 2,200', up: true },
              { date: 'Feb 5', rank: '~13,400', delta: '↑ 4,800', up: true },
              { date: 'Jan 29', rank: '~18,200', delta: '↓ 3,400', up: false },
              { date: 'Jan 22', rank: '~14,800', delta: '↑ 1,200', up: true },
            ].map((r, i) => (
              <View key={i} style={analyticsStyles.rankRow}>
                <View style={analyticsStyles.rankDot} />
                <Text style={analyticsStyles.rankDate}>{r.date}</Text>
                <Text style={analyticsStyles.rankValue}>{r.rank}</Text>
                <Text style={[analyticsStyles.rankDelta, { color: r.up ? COLORS.green : COLORS.red }]}>
                  {r.delta}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Weak chapters ── */}
        <View style={analyticsStyles.card}>
          <View style={analyticsStyles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="warning" size={15} color={COLORS.yellow} />
              <Text style={analyticsStyles.cardTitle}>Weak Areas</Text>
            </View>
            <Text style={analyticsStyles.aiLabel}>AI-Identified</Text>
          </View>
          {weakChapters.map((c) => (
            <ChapterRow key={c.name} {...c} />
          ))}
        </View>

        {/* ── Mock history ── */}
        <View style={[analyticsStyles.card, { marginBottom: 32 }]}>
          <View style={analyticsStyles.cardHeaderRow}>
            <View>
              <Text style={analyticsStyles.cardTitle}>Mock History</Text>
              <Text style={analyticsStyles.cardSub}>All attempted tests</Text>
            </View>
          </View>

          {/* Table header */}
          <View style={analyticsStyles.tableHeader}>
            <Text style={[analyticsStyles.tableHeaderCell, { flex: 2 }]}>Test</Text>
            <Text style={analyticsStyles.tableHeaderCell}>Score</Text>
            <Text style={analyticsStyles.tableHeaderCell}>Rank</Text>
            <Text style={analyticsStyles.tableHeaderCell}>%ile</Text>
          </View>

          {mockHistory.map((m, i) => (
            <View key={i} style={[analyticsStyles.tableRow, i % 2 === 0 && analyticsStyles.tableRowAlt]}>
              <View style={{ flex: 2 }}>
                <Text style={analyticsStyles.tableCell} numberOfLines={1}>{m.name}</Text>
                <Text style={analyticsStyles.tableSub}>{m.date}</Text>
              </View>
              <Text style={[analyticsStyles.tableCell, { color: COLORS.primary, fontWeight: '700' }]}>
                {m.score}
              </Text>
              <Text style={analyticsStyles.tableCell}>{m.rank.toLocaleString()}</Text>
              <Text style={[analyticsStyles.tableCell, { color: m.up ? COLORS.green : COLORS.red, fontWeight: '700' }]}>
                {m.pct}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

 