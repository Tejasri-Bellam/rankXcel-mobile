import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { Fragment } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { marketingStyles as s } from '@/src/styles/styles/marketing/shared';

type Crumb = { label: string; onPress?: () => void };

export default function PageHeader({ breadcrumb }: { breadcrumb?: Crumb[] }) {
  return (
    <View>
      <View style={s.header}>
        <TouchableOpacity style={s.logoRow} onPress={() => router.push('/')}>
          <View style={s.logoIcon}>
            <Text style={s.logoIconText}>⚡</Text>
          </View>
          <Text style={s.logoText}>RankXcel</Text>
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={s.loginText}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.signupBtn} onPress={() => router.push('/auth/sign-up')}>
            <Text style={s.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {breadcrumb && breadcrumb.length > 0 && (
        <View style={s.breadcrumbRow}>
          {breadcrumb.map((crumb, i) => (
            <Fragment key={crumb.label}>
              {i > 0 && <Ionicons name="chevron-forward" size={14} color="#9CA3AF" style={{ marginHorizontal: 4 }} />}
              <TouchableOpacity onPress={crumb.onPress} disabled={!crumb.onPress}>
                <Text style={[s.breadcrumbText, crumb.onPress ? s.breadcrumbLink : s.breadcrumbCurrent]}>
                  {crumb.label}
                </Text>
              </TouchableOpacity>
            </Fragment>
          ))}
        </View>
      )}
    </View>
  );
}