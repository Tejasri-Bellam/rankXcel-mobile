import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { marketingStyles as s } from '@/src/styles/styles/marketing/shared';
import { homeData } from '../json/landingpage';
import { router } from 'expo-router';


const LINK_ROUTES: Record<string, string> = {
  'Browse courses': '/courses',
  'How it works': '/how-it-works',
  'Terms': '/legal?tab=terms',
  'Privacy': '/legal?tab=privacy',
  'Contact': '/contact',
};

export default function Footer() {
  const { footer } = homeData;
  return (
    <View style={s.footer}>
      <View style={s.footerLogoRow}>
        <View style={s.footerLogoIcon}>
          <Text style={s.footerLogoIconText}>⚡</Text>
        </View>
        <Text style={s.footerLogoText}>{footer.logoText}</Text>
      </View>
      <Text style={s.footerDescription}>{footer.desc}</Text>
      <View style={s.footerColumnsRow}>
        {footer.columns.map((col) => (
          <View style={s.footerColumn} key={col.heading}>
            <Text style={s.footerHeading}>{col.heading}</Text>
            {col.links.map((link) => {
                const route = LINK_ROUTES[link];
                return route ? (
                    <TouchableOpacity key={link} onPress={() => router.push(route as any)}>
                    <Text style={s.footerLink}>{link}</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={s.footerLink} key={link}>{link}</Text>
                );
                })}
          </View>
        ))}
      </View>
      <Text style={s.copyright}>{footer.copyright}</Text>
    </View>
  );
}