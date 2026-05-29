import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import HomeScreen from '../components/home/HomeScreen';
import { storageGetAccessToken } from '../libs/storage';
import { COLORS } from '../styles/styles';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await storageGetAccessToken();
      setHasToken(Boolean(token));
      setChecking(false);
    })();
  }, []);

  // if (checking) {
  //   return (
  //     <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
  //       <ActivityIndicator size="large" color={COLORS.primary} />
  //     </View>
  //   );
  // }

  // if (hasToken) {
  //   return <Redirect href="/dashboard" />;
  // }

  return <HomeScreen />;
}
