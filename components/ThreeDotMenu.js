import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Platform,
} from 'react-native';
import { C } from '../constants/theme';

/**
 * ThreeDotMenu — Reusable ⋮ menu component
 * options: [{ icon, label, onPress, danger?, disabled? }]
 * title: optional header text
 */
export default function ThreeDotMenu({ options = [], title, size = 'md' }) {
  const [visible, setVisible] = useState(false);

  const validOptions = options.filter(Boolean);
  if (validOptions.length === 0) return null;

  const open  = () => setVisible(true);
  const close = () => setVisible(false);

  const btnSize = size === 'sm' ? 28 : 34;

  return (
    <>
      {/* ⋮ Trigger button */}
      <TouchableOpacity
        style={[tdm.triggerBtn, { width: btnSize, height: btnSize, borderRadius: btnSize / 2 }]}
        onPress={open}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[tdm.dots, size === 'sm' && { fontSize: 16 }]}>⋮</Text>
      </TouchableOpacity>

      {/* Bottom-sheet style modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={tdm.overlay}
          activeOpacity={1}
          onPress={close}
        >
          {/* Sheet — prevent propagation */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={tdm.sheet}>
              {/* Handle bar */}
              <View style={tdm.handle} />

              {/* Title */}
              {title && (
                <Text style={tdm.title} numberOfLines={1}>{title}</Text>
              )}

              {/* Options */}
              {validOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    tdm.option,
                    opt.danger && tdm.optionDanger,
                    opt.disabled && tdm.optionDisabled,
                  ]}
                  onPress={() => {
                    if (opt.disabled) return;
                    close();
                    setTimeout(() => opt.onPress(), 150);
                  }}
                  activeOpacity={opt.disabled ? 1 : 0.75}
                >
                  <View style={[
                    tdm.optionIconBox,
                    opt.danger && tdm.optionIconBoxDanger,
                  ]}>
                    <Text style={tdm.optionIcon}>{opt.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      tdm.optionLabel,
                      opt.danger    && tdm.optionLabelDanger,
                      opt.disabled  && tdm.optionLabelDisabled,
                    ]}>
                      {opt.label}
                    </Text>
                    {opt.sublabel ? (
                      <Text style={tdm.optionSublabel}>{opt.sublabel}</Text>
                    ) : null}
                  </View>
                  {!opt.danger && !opt.disabled && (
                    <Text style={tdm.optionArrow}>›</Text>
                  )}
                </TouchableOpacity>
              ))}

              {/* Cancel */}
              <TouchableOpacity style={tdm.cancelBtn} onPress={close} activeOpacity={0.8}>
                <Text style={tdm.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const tdm = StyleSheet.create({
  triggerBtn: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  dots: { fontSize: 18, color: '#64748b', fontWeight: '800', lineHeight: 20 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    overflow: 'hidden',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center', marginTop: 10, marginBottom: 12,
  },
  title: {
    fontSize: 12, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },

  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  optionDanger:   { backgroundColor: '#fff5f5' },
  optionDisabled: { opacity: 0.4 },

  optionIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center',
  },
  optionIconBoxDanger: { backgroundColor: '#fee2e2' },
  optionIcon:    { fontSize: 18 },
  optionLabel:   { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  optionLabelDanger:  { color: '#dc2626' },
  optionLabelDisabled:{ color: '#94a3b8' },
  optionSublabel:{ fontSize: 11, color: '#94a3b8', marginTop: 1 },
  optionArrow:   { fontSize: 20, color: '#d1d5db' },

  cancelBtn: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#f1f5f9', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: '#475569' },
});
