import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, IS_DEMO } from '../services/firebase';
import { C, CAT, UNIT_TYPES } from '../constants/theme';
import InputRow from '../components/InputRow';

const CATEGORIES = ['Cold Drinks', 'Pickles', 'Pasta', 'Grocery', 'Snacks', 'Household', 'Bricks'];
const MAX_IMAGES = 5;

async function compressImage(uri) {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 900 } }],
    { compress: 0.75, format: SaveFormat.JPEG }
  );
  return result.uri;
}

export default function AddItemScreen({ route, navigation }) {
  const editProduct = route.params?.product || null;
  const tabMode     = !!route.params?.tabMode;   // opened from bottom tab

  /* ── Text fields ── */
  const [name,        setName]        = useState(editProduct?.name || '');
  const [price,       setPrice]       = useState(editProduct?.price?.toString() || '');
  const [description, setDescription] = useState(editProduct?.description || '');
  const [category,    setCategory]    = useState(editProduct?.category || '');
  const [unit,        setUnit]        = useState(editProduct?.unit || 'piece');
  const [stock,       setStock]       = useState(editProduct?.stock?.toString() || '');
  const [inStock,     setInStock]     = useState(editProduct?.inStock !== false);
  const [sku,         setSku]         = useState(editProduct?.sku || '');
  const [weight,      setWeight]      = useState(editProduct?.weight || '');
  const [saving,      setSaving]      = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);   // tab-mode success banner

  /* ── Multi-image state ──
     Each entry: { uri, isNew, existingUrl?, existingPath? }          */
  const [images, setImages] = useState(() => {
    if (editProduct?.imageUrls?.length) {
      return editProduct.imageUrls.map((url, i) => ({
        uri: url, isNew: false,
        existingUrl: url,
        existingPath: editProduct.imagePaths?.[i] || null,
      }));
    }
    if (editProduct?.imageUrl) {
      return [{
        uri: editProduct.imageUrl, isNew: false,
        existingUrl: editProduct.imageUrl,
        existingPath: editProduct.imagePath || null,
      }];
    }
    return [];
  });

  /* ── Input refs ── */
  const nameRef   = useRef(null);
  const priceRef  = useRef(null);
  const stockRef  = useRef(null);
  const skuRef    = useRef(null);
  const weightRef = useRef(null);
  const descRef   = useRef(null);

  /* ── Reset form (tab mode: after successful save) ── */
  const resetForm = () => {
    setName(''); setPrice(''); setDescription('');
    setCategory(''); setUnit('piece'); setStock('');
    setInStock(true); setSku(''); setWeight('');
    setImages([]);
  };

  /* ── Image helpers ── */
  const addImageFromUri = async (uri) => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    const compressed = await compressImage(uri);
    setImages((prev) => [...prev, { uri: compressed, isNew: true }]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission chahiye', 'Gallery access allow karein'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.9,
    });
    if (!result.canceled) await addImageFromUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission chahiye', 'Camera access allow karein'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.9,
    });
    if (!result.canceled) await addImageFromUri(result.assets[0].uri);
  };

  const removeImage = (index) => {
    Alert.alert('Remove Image?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () =>
          setImages((prev) => prev.filter((_, i) => i !== index))
      },
    ]);
  };

  /* ── Upload single image ── */
  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob     = await response.blob();
    const imagePath = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const storageRef = ref(storage, imagePath);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return { url, imagePath };
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!name.trim())               { Alert.alert('Error', 'Product name likhein'); nameRef.current?.focus(); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('Error', 'Sahi price likhein'); priceRef.current?.focus(); return; }
    if (!category)                  { Alert.alert('Error', 'Category select karein'); return; }

    if (IS_DEMO) {
      if (tabMode) {
        resetForm();
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 3000);
      } else {
        Alert.alert('✅ Demo Mode', 'Real save ke liye Firebase connect karein.');
        navigation.goBack();
      }
      return;
    }

    setSaving(true);
    try {
      /* Upload any new images, keep existing */
      const uploadedImages = [];
      for (const img of images) {
        if (img.isNew) {
          const { url, imagePath } = await uploadImage(img.uri);
          uploadedImages.push({ url, imagePath });
        } else {
          uploadedImages.push({ url: img.existingUrl, imagePath: img.existingPath });
        }
      }

      /* Delete old primary image if it was replaced or removed */
      const oldPath = editProduct?.imagePath;
      const stillUsed = uploadedImages.some((u) => u.imagePath === oldPath);
      if (oldPath && !stillUsed) {
        await deleteObject(ref(storage, oldPath)).catch(() => {});
      }

      const imageUrls  = uploadedImages.map((u) => u.url).filter(Boolean);
      const imagePaths = uploadedImages.map((u) => u.imagePath).filter(Boolean);

      const data = {
        name:        name.trim(),
        price:       Number(price),
        description: description.trim(),
        category,
        unit:        unit || 'piece',
        stock:       stock ? Number(stock) : 0,
        inStock,
        sku:         sku.trim(),
        weight:      weight.trim(),
        imageUrl:    imageUrls[0] || null,        // primary (backward compat)
        imagePath:   imagePaths[0] || null,
        imageUrls,
        imagePaths,
      };

      if (editProduct) {
        await updateDoc(doc(db, 'products', editProduct.id), data);
        if (tabMode) {
          resetForm();
          setSavedBanner(true);
          setTimeout(() => setSavedBanner(false), 3000);
        } else {
          Alert.alert('✅ Updated!', 'Product update ho gaya');
          navigation.goBack();
        }
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
        if (tabMode) {
          resetForm();
          setSavedBanner(true);
          setTimeout(() => setSavedBanner(false), 3000);
        } else {
          Alert.alert('✅ Saved!', 'Naya product add ho gaya');
          navigation.goBack();
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Save nahi ho saka: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ title }) => (
    <View style={st.sectionHeader}>
      <Text style={st.sectionTitle}>{title}</Text>
    </View>
  );

  const cat = CAT[category] || CAT.default;
  const hasImages = images.length > 0;
  const primaryUri = images[0]?.uri || null;

  /* ── UI ── */
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={st.root}>

        {/* Header */}
        <View style={st.header}>
          {tabMode ? (
            <TouchableOpacity onPress={resetForm} style={st.backBtn}>
              <Text style={[st.backText, { fontSize: 18 }]}>↺</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
              <Text style={st.backText}>‹</Text>
            </TouchableOpacity>
          )}
          <Text style={st.headerTitle}>
            {editProduct ? 'Product Edit Karein' : 'Naya Product Add Karein'}
          </Text>
          <TouchableOpacity
            style={[st.saveHeaderBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={st.saveHeaderBtnTxt}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Success banner (tab mode) */}
        {savedBanner && (
          <View style={st.successBanner}>
            <Text style={st.successBannerTxt}>✅  Product successfully added to catalog!</Text>
          </View>
        )}

        <ScrollView
          style={{ flex: 1, overflow: 'hidden' }}
          contentContainerStyle={st.body}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Images ── */}
          <SectionHeader title={`Product Images (${images.length}/${MAX_IMAGES})`} />
          <View style={st.card}>
            {/* Primary preview */}
            <TouchableOpacity
              style={[st.primaryImgBox, !primaryUri && { borderStyle: 'dashed' }]}
              onPress={pickImage}
            >
              {primaryUri ? (
                <Image source={{ uri: primaryUri }} style={st.primaryImg} resizeMode="contain" />
              ) : (
                <View style={[st.imgPlaceholder, { backgroundColor: cat.bg }]}>
                  <Text style={{ fontSize: 52 }}>{cat.icon}</Text>
                  <Text style={[st.imgPlaceholderTxt, { color: cat.text }]}>Tap to Upload</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Image strip */}
            {hasImages && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={st.imgStrip}
                contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4 }}
              >
                {images.map((img, idx) => (
                  <View key={idx} style={st.thumbWrap}>
                    <Image source={{ uri: img.uri }} style={st.thumb} resizeMode="cover" />
                    {idx === 0 && (
                      <View style={st.primaryBadge}>
                        <Text style={st.primaryBadgeTxt}>Main</Text>
                      </View>
                    )}
                    <TouchableOpacity style={st.thumbRemove} onPress={() => removeImage(idx)}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < MAX_IMAGES && (
                  <TouchableOpacity style={st.thumbAdd} onPress={pickImage}>
                    <Text style={{ fontSize: 22, color: C.primary }}>+</Text>
                    <Text style={{ fontSize: 9, color: C.primary, fontWeight: '700', marginTop: 2 }}>Add</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* Action buttons */}
            <View style={st.imgBtns}>
              <TouchableOpacity
                style={[st.imgBtn, images.length >= MAX_IMAGES && { opacity: 0.45 }]}
                onPress={pickImage}
                disabled={images.length >= MAX_IMAGES}
              >
                <Text style={st.imgBtnIcon}>🖼️</Text>
                <Text style={st.imgBtnTxt}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.imgBtn, images.length >= MAX_IMAGES && { opacity: 0.45 }]}
                onPress={takePhoto}
                disabled={images.length >= MAX_IMAGES}
              >
                <Text style={st.imgBtnIcon}>📷</Text>
                <Text style={st.imgBtnTxt}>Camera</Text>
              </TouchableOpacity>
              {hasImages && (
                <TouchableOpacity
                  style={[st.imgBtn, { borderColor: C.danger }]}
                  onPress={() => Alert.alert('Clear All Images?', '', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => setImages([]) },
                  ])}
                >
                  <Text style={st.imgBtnIcon}>🗑️</Text>
                  <Text style={[st.imgBtnTxt, { color: C.danger }]}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Basic Info ── */}
          <SectionHeader title="Basic Information" />
          <View style={st.card}>
            <Text style={st.label}>Product Name *</Text>
            <InputRow
              inputRef={nameRef}
              value={name}
              onChangeText={setName}
              placeholder="e.g. OG Cola"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => priceRef.current?.focus()}
              blurOnSubmit={false}
              style={st.inputGap}
            />

            <Text style={st.label}>Description</Text>
            <InputRow
              inputRef={descRef}
              value={description}
              onChangeText={setDescription}
              placeholder="Product ke baare mein likhein..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              style={st.inputGap}
            />
          </View>

          {/* ── Category ── */}
          <SectionHeader title="Category *" />
          <View style={st.card}>
            <View style={st.chipsGrid}>
              {CATEGORIES.map((c) => {
                const cs     = CAT[c] || CAT.default;
                const active = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      st.catChip,
                      active && { backgroundColor: cs.bg, borderColor: cs.text + '66' },
                    ]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={{ fontSize: 16, marginBottom: 4 }}>{cs.icon}</Text>
                    <Text style={[st.catChipTxt, active && { color: cs.text, fontWeight: '700' }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Pricing & Inventory ── */}
          <SectionHeader title="Pricing & Inventory" />
          <View style={st.card}>
            <View style={st.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={st.label}>Price (Rs.) *</Text>
                <InputRow
                  inputRef={priceRef}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="e.g. 150"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => stockRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.label}>Stock Quantity</Text>
                <InputRow
                  inputRef={stockRef}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="e.g. 100"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => skuRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
            </View>

            <View style={st.availRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.label}>Availability</Text>
                <Text style={st.labelSub}>
                  {inStock ? '✅ In Stock — customers add kar sakte hain' : '❌ Out of Stock — add to cart disabled'}
                </Text>
              </View>
              <Switch
                value={inStock}
                onValueChange={setInStock}
                trackColor={{ false: C.border, true: C.primaryLight }}
                thumbColor={inStock ? C.primary : '#f4f4f5'}
              />
            </View>
          </View>

          {/* ── Unit Type ── */}
          <SectionHeader title="Unit Type" />
          <View style={st.card}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={st.unitRow}>
                {UNIT_TYPES.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[st.unitChip, unit === u && st.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[st.unitChipTxt, unit === u && st.unitChipTxtActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={st.selectedUnit}>
              Selected: <Text style={{ color: C.primary, fontWeight: '700' }}>{unit}</Text>
            </Text>
          </View>

          {/* ── Additional Info ── */}
          <SectionHeader title="Additional Info (Optional)" />
          <View style={st.card}>
            <View style={st.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={st.label}>SKU / Code</Text>
                <InputRow
                  inputRef={skuRef}
                  value={sku}
                  onChangeText={setSku}
                  placeholder="e.g. OGC-1L"
                  autoCapitalize="characters"
                  returnKeyType="next"
                  onSubmitEditing={() => weightRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.label}>Weight / Size</Text>
                <InputRow
                  inputRef={weightRef}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g. 1.5kg"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[st.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={st.saveBtnTxt}>
                {editProduct ? '💾  Update Product' : '✅  Save Product'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.primary,
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backText:       { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: -2 },
  headerTitle:    { flex: 1, color: '#fff', fontSize: 17, fontWeight: '800' },
  saveHeaderBtn:  { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  saveHeaderBtnTxt:{ color: '#fff', fontSize: 14, fontWeight: '700' },

  body: { padding: 16, paddingBottom: 48 },

  sectionHeader: { marginTop: 16, marginBottom: 8 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.8 },

  card: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  /* Image section */
  primaryImgBox:     { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: C.border, marginBottom: 12 },
  primaryImg:        { width: '100%', height: '100%' },
  imgPlaceholder:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imgPlaceholderTxt: { fontSize: 13, fontWeight: '600', marginTop: 8 },

  imgStrip:  { marginBottom: 12 },
  thumbWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', marginRight: 8, borderWidth: 1.5, borderColor: C.border, position: 'relative' },
  thumb:     { width: '100%', height: '100%' },
  primaryBadge:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(37,99,235,0.8)', paddingVertical: 2, alignItems: 'center' },
  primaryBadgeTxt: { color: '#fff', fontSize: 8, fontWeight: '800' },
  thumbRemove: { position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  thumbAdd:  { width: 72, height: 72, borderRadius: 10, borderWidth: 2, borderColor: C.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: C.primaryLight },

  imgBtns:   { flexDirection: 'row', gap: 10 },
  imgBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, borderRadius: 10, paddingVertical: 10, borderWidth: 1.5, borderColor: C.border },
  imgBtnIcon:{ fontSize: 16, marginRight: 6 },
  imgBtnTxt: { fontSize: 12, fontWeight: '600', color: C.textMid },

  label:    { fontSize: 13, fontWeight: '600', color: C.textMid, marginBottom: 7 },
  labelSub: { fontSize: 11, color: C.textLight, marginTop: 2 },
  inputGap: { marginBottom: 14 },

  row2: { flexDirection: 'row', marginBottom: 14 },

  /* Category chips in a grid */
  chipsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip:      { width: '30%', minWidth: 90, flexDirection: 'column', alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  catChipTxt:   { fontSize: 11, fontWeight: '500', color: C.textLight, textAlign: 'center' },

  unitRow:          { flexDirection: 'row', paddingVertical: 4 },
  unitChip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, marginRight: 8 },
  unitChipActive:   { backgroundColor: C.primaryLight, borderColor: C.primary },
  unitChipTxt:      { fontSize: 12, fontWeight: '500', color: C.textLight },
  unitChipTxtActive:{ color: C.primary, fontWeight: '700' },
  selectedUnit:     { fontSize: 12, color: C.textLight, marginTop: 10 },

  availRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },

  saveBtn:    { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 20, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successBanner:    { backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#bbf7d0', paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  successBannerTxt: { color: '#15803d', fontSize: 14, fontWeight: '700' },
});
