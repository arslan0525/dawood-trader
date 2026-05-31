import React from 'react';
import { Pressable, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { C } from '../constants/theme';

export default function InputRow({
  icon,
  inputRef,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  secureTextEntry,
  rightElement,
  style,
  multiline,
  numberOfLines,
  textAlignVertical,
}) {
  return (
    <Pressable
      style={[s.box, style, Platform.OS === 'web' && { cursor: 'text' }]}
      onPressIn={() => inputRef?.current?.focus()}
    >
      {icon ? <Text style={s.icon}>{icon}</Text> : null}
      <TextInput
        ref={inputRef}
        style={[s.input, multiline && s.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={textAlignVertical}
      />
      {rightElement || null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  icon:      { fontSize: 16, marginRight: 10 },
  input:     { flex: 1, paddingVertical: 14, fontSize: 15, color: C.text },
  multiline: { paddingVertical: 12, minHeight: 90 },
});
