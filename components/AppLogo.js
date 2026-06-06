import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const LOGO_IMG = require('../assets/logo.png');

export default function AppLogo({ size = 40, variant = 'icon' }) {
  const r = size * 0.24;

  const LogoImg = () => (
    <View style={[l.wrap, { width: size, height: size, borderRadius: r }]}>
      <Image source={LOGO_IMG} style={{ width: size, height: size, borderRadius: r }} resizeMode="cover" />
    </View>
  );

  if (variant === 'icon') return <LogoImg />;

  if (variant === 'full') {
    return (
      <View style={l.fullWrap}>
        <LogoImg />
        <View style={l.fullText}>
          <Text style={[l.fullName, { fontSize: size * 0.32 }]}>Dawood Trader</Text>
          <Text style={[l.fullSub,  { fontSize: size * 0.2  }]}>Distribution System</Text>
        </View>
      </View>
    );
  }

  if (variant === 'sidebar') {
    return (
      <View style={l.sideWrap}>
        <LogoImg />
        <View style={{ flex: 1 }}>
          <Text style={[l.sideName, { fontSize: size * 0.34 }]}>Dawood Trader</Text>
          <Text style={[l.sideSub,  { fontSize: size * 0.22 }]}>Distribution System</Text>
        </View>
      </View>
    );
  }

  return <LogoImg />;
}

const l = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  fullWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fullText: { gap: 1 },
  fullName: { color: '#0f172a', fontWeight: '800' },
  fullSub:  { color: '#64748b', fontWeight: '500' },

  sideWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sideName: { color: '#f1f5f9', fontWeight: '800' },
  sideSub:  { color: 'rgba(255,255,255,0.45)', fontWeight: '500', marginTop: 1 },
});
