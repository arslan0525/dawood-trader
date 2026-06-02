import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Dawood Trader — Professional Logo Component
 * D·T monogram with brand colors
 * Replace icon source with your Gemini/AI-generated logo later
 */
export default function AppLogo({ size = 40, variant = 'icon' }) {
  const r = size * 0.24;

  if (variant === 'icon') {
    return (
      <View style={[l.wrap, { width: size, height: size, borderRadius: r }]}>
        {/* Gradient layers (simulated with nested views) */}
        <View style={[l.bg, { borderRadius: r }]} />
        <View style={[l.shine, { borderRadius: r, width: size, height: size * 0.5 }]} />

        {/* DT Monogram */}
        <View style={l.monogram}>
          <Text style={[l.letterD, { fontSize: size * 0.38 }]}>D</Text>
          <Text style={[l.letterT, { fontSize: size * 0.38 }]}>T</Text>
        </View>

        {/* Bottom accent bar */}
        <View style={[l.bar, { height: size * 0.08, borderBottomLeftRadius: r, borderBottomRightRadius: r }]} />
      </View>
    );
  }

  if (variant === 'full') {
    return (
      <View style={l.fullWrap}>
        <AppLogo size={size} variant="icon" />
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
        <AppLogo size={size} variant="icon" />
        <View style={{ flex: 1 }}>
          <Text style={[l.sideName, { fontSize: size * 0.34 }]}>Dawood Trader</Text>
          <Text style={[l.sideSub,  { fontSize: size * 0.22 }]}>Distribution System</Text>
        </View>
      </View>
    );
  }

  return <AppLogo size={size} variant="icon" />;
}

const l = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  bg: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#2563eb',
  },
  shine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  monogram: {
    flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2,
  },
  letterD: {
    color: '#ffffff',
    fontWeight: '900',
    letterSpacing: -1.5,
    marginRight: -2,
  },
  letterT: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  bar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  /* Full variant */
  fullWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fullText: { gap: 1 },
  fullName: { color: '#0f172a', fontWeight: '800' },
  fullSub:  { color: '#64748b', fontWeight: '500' },

  /* Sidebar variant */
  sideWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sideName: { color: '#f1f5f9', fontWeight: '800' },
  sideSub:  { color: 'rgba(255,255,255,0.3)', fontWeight: '500', marginTop: 1 },
});
