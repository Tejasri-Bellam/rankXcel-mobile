import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { storageGetAccessToken, storageGetOnboardingSeen } from '../libs/storage';
import { COLORS } from '../styles/styles';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState(false);

  useEffect(() => {
    (async () => {
      const [token, seen] = await Promise.all([
        storageGetAccessToken(),
        storageGetOnboardingSeen(),
      ]);
      setHasToken(Boolean(token));
      setOnboardingSeen(seen);
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.white,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Logged in → app home. Otherwise show the onboarding intro only on the very
  // first launch after install; returning logged-out users go straight to login.
  const target = hasToken
    ? '/dashboard'
    : onboardingSeen
      ? '/auth/login'
      : '/onboarding';
  return <Redirect href={target} />;
}
