import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, IS_DEMO } from '../services/firebase';
import { C, CAT, UNIT_TYPES } from '../constants/theme';
import InputRow from '../components/InputRow';
import CropModal from '../components/CropModal';
import { useToast } from '../context/ToastContext';
import { useAppData } from '../context/AppDataContext';

const CATEGORIES = ['Cold Drinks', 'Masala', 'Pickles', 'Pasta', 'Grocery', 'Snacks', 'Household', 'Bricks'];
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
  const [savedBanner, setSavedBanner] = useState(false);
  const { showToast } = useToast();
  const { addProductDemo, updateProductDemo } = useAppData();
  const scrollRef = useRef(null);

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

  /* ── Scroll to top when form mounts ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  /* ── Reset form (tab mode: after successful save) ── */
  const resetForm = () => {
    setName(''); setPrice(''); setDescription('');
    setCategory(''); setUnit('piece'); setStock('');
    setInStock(true); setSku(''); setWeight('');
    setImages([]);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  /* ── Crop Modal state ── */
  const [cropUri, setCropUri]         = useState(null);
  const [cropVisible, setCropVisible] = useState(false);
  const cropResolveRef = useRef(null);

  // Show crop modal and wait for result (web only; native uses allowsEditing)
  const cropImage = (uri) => new Promise((resolve) => {
    cropResolveRef.current = resolve;
    setCropUri(uri);
    setCropVisible(true);
  });

  const handleCropConfirm = async (croppedUri) => {
    setCropVisible(false);
    setCropUri(null);
    if (cropResolveRef.current) {
      cropResolveRef.current(croppedUri);
      cropResolveRef.current = null;
    }
  };

  const handleCropCancel = () => {
    setCropVisible(false);
    setCropUri(null);
    if (cropResolveRef.current) {
      cropResolveRef.current(null); // null = cancelled
      cropResolveRef.current = null;
    }
  };

  /* ── Image helpers ── */
  const addImageFromUri = async (uri) => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    // On web, show our crop modal; on native, allowsEditing already handled it
    let finalUri = uri;
    if (Platform.OS === 'web') {
      finalUri = await cropImage(uri);
      if (!finalUri) return; // user cancelled crop
    }
    const compressed = await compressImage(finalUri);
    setImages((prev) => [...prev, { uri: compressed, isNew: true }]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission chahiye', 'Gallery access allow karein'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing only works on native; web uses our CropModal
      allowsEditing: Platform.OS !== 'web',
      aspect: [4, 3],
      quality: 0.9,
    });
    if (!result.canceled) await addImageFromUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission chahiye', 'Camera access allow karein'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: Platform.OS !== 'web',
      aspect: [4, 3],
      quality: 0.9,
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

  /* ── Re-crop an existing image ── */
  const reCropImage = async (index) => {
    const currentUri = images[index]?.uri;
    if (!currentUri) return;

    if (Platform.OS !== 'web') {
      // On native: re-open gallery to pick & crop again
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [4, 3], quality: 0.9,
      });
      if (!result.canceled) {
        const compressed = await compressImage(result.assets[0].uri);
        setImages(prev => prev.map((img, i) => i === index ? { ...img, uri: compressed, isNew: true } : img));
      }
      return;
    }
    // Web: open crop modal with current URI
    const croppedUri = await cropImage(currentUri);
    if (!croppedUri) return;
    const compressed = await compressImage(croppedUri);
    setImages(prev => prev.map((img, i) => i === index ? { ...img, uri: compressed, isNew: true } : img));
  };

  /* ── Convert image to base64 (no Storage plan needed) ── */
  const uploadImage = async (uri) => {
    if (Platform.OS === 'web') {
      const blob = await (await fetch(uri)).blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return { url: base64, imagePath: null };
    }
    const FileSystem = require('expo-file-system');
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return { url: `data:image/jpeg;base64,${b64}`, imagePath: null };
  };

  /* ── UNUSED (kept for reference) ── */
  const _uploadImageToStorage = async (uri) => {
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
      const productData = {
        name:        name.trim(),
        price:       Number(price),
        description: description.trim(),
        category,
        unit,
        stock:       stock ? Number(stock) : 0,
        inStock,
        sku:         sku.trim(),
        weight:      weight.trim(),
        imageUrl:    images[0]?.uri || '',
        imageUrls:   images.map(i => i.uri),
        imagePaths:  [],
      };
      if (editProduct?.id) {
        updateProductDemo(editProduct.id, productData);
        showToast('Product update ho gaya!', 'success');
      } else {
        addProductDemo(productData);
        showToast('Product add ho gaya!', 'success');
      }
      if (tabMode) {
        resetForm();
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 3000);
      } else {
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
        showToast(`"${data.name}" updated!`, 'success');
        if (tabMode) {
          resetForm();
          setSavedBanner(true);
          setTimeout(() => setSavedBanner(false), 3000);
        } else {
          navigation.goBack();
        }
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
        showToast(`"${data.name}" added!`, 'success');
        if (tabMode) {
          resetForm();
          setSavedBanner(true);
          setTimeout(() => setSavedBanner(false), 3000);
        } else {
          navigation.goBack();
        }
      }
    } catch (e) {
      showToast('Save nahi ho saka', 'error');
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
    <KeyboardAvoidingView style={{ flex: 1, minHeight: 0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Crop modal (web only) */}
      <CropModal
        visible={cropVisible}
        imageUri={cropUri}
        onCrop={handleCropConfirm}
        onCancel={handleCropCancel}
      />
      <View style={st.root}>

        {/* Header — compact when tabMode on web (WebLayout already has top nav) */}
        {tabMode && Platform.OS === 'web' ? (
          <View style={st.headerCompact}>
            <TouchableOpacity onPress={resetForm} style={st.compactResetBtn}>
              <Text style={st.compactResetTxt}>↺ Reset</Text>
            </TouchableOpacity>
            <Text style={st.compactTitle}>
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </Text>
            <TouchableOpacity
              style={[st.compactSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={st.compactSaveTxt}>✅ Save</Text>}
            </TouchableOpacity>
          </View>
        ) : (
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
        )}

        {/* Success banner (tab mode) */}
        {savedBanner && (
          <View style={st.successBanner}>
            <Text style={st.successBannerTxt}>✅  Product successfully added to catalog!</Text>
          </View>
        )}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
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
              onPress={primaryUri ? () => reCropImage(0) : pickImage}
              activeOpacity={0.85}
            >
              {primaryUri ? (
                <>
                  <Image source={{ uri: primaryUri }} style={st.primaryImg} resizeMode="contain" />
                  {/* Edit overlay hint */}
                  <View style={st.editOverlay}>
                    <View style={st.editBadge}>
                      <Text style={st.editBadgeTxt}>✂️  Tap to Crop</Text>
                    </View>
                  </View>
                </>
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
                    {/* Re-crop button */}
                    <TouchableOpacity style={st.thumbCrop} onPress={() => reCropImage(idx)}>
                      <Text style={{ fontSize: 11 }}>✂️</Text>
                    </TouchableOpacity>
                    {/* Remove button */}
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
  root:  { flex: 1, minHeight: 0, backgroundColor: C.bg },

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

  /* Compact header for tabMode on web — no duplicate blue bar */
  headerCompact:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  compactTitle:   { flex: 1, fontSize: 15, fontWeight: '800', color: C.text, textAlign: 'center' },
  compactResetBtn:{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.bg },
  compactResetTxt:{ fontSize: 12, fontWeight: '600', color: C.textMid },
  compactSaveBtn: { backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  compactSaveTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

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
  /* Edit overlay on primary image */
  editOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10 },
  editBadge:   { backgroundColor: 'rgba(0,0,0,0.52)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  editBadgeTxt:{ color: '#fff', fontSize: 12, fontWeight: '700' },

  /* Thumbnail buttons */
  thumbCrop:   { position: 'absolute', top: 3, left: 3, backgroundColor: 'rgba(37,99,235,0.85)', borderRadius: 9, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  thumbRemove: { position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 9, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
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
