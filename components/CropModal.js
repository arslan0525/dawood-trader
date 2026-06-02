/**
 * CropModal — Works on both Web and Native
 * Uses expo-image-manipulator for actual crop (no canvas/CORS issues)
 * Shows image with draggable pan + zoom controls
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Modal, Animated, PanResponder, Dimensions,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const { width: SW, height: SH } = Dimensions.get('window');

// Display size of the crop preview inside the modal
const MAX_FRAME_W = Math.min(SW - 48, 380);
const FRAME_W = MAX_FRAME_W;
const FRAME_H = Math.round(FRAME_W * 3 / 4); // 4 : 3

// Get natural image dimensions (React Native Image.getSize)
function getNaturalSize(uri) {
  return new Promise(resolve => {
    Image.getSize(
      uri,
      (w, h) => resolve({ w, h }),
      ()    => resolve({ w: 0, h: 0 }),
    );
  });
}

export default function CropModal({ visible, imageUri, onCrop, onCancel }) {
  const [zoom, setZoom]       = useState(1);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [loading, setLoading] = useState(false);
  const [imgReady, setImgReady] = useState(false);

  // pan state
  const pan       = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panOffset = useRef({ x: 0, y: 0 });
  const zoomRef   = useRef(1);

  // Clamp so image never leaves the frame
  const clamp = useCallback((dx, dy, z) => {
    const imgW = FRAME_W * z;
    const imgH = FRAME_H * z;
    const maxX = Math.max(0, (imgW - FRAME_W) / 2);
    const maxY = Math.max(0, (imgH - FRAME_H) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, dx)),
      y: Math.max(-maxY, Math.min(maxY, dy)),
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:  () => true,
      onMoveShouldSetPanResponder:   () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: panOffset.current.x, y: panOffset.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        const clamped = clamp(
          panOffset.current.x + gs.dx,
          panOffset.current.y + gs.dy,
          zoomRef.current,
        );
        panOffset.current = clamped;
        pan.setValue(clamped);
      },
    }),
  ).current;

  // Reset state when modal opens
  useEffect(() => {
    if (!visible || !imageUri) return;
    setZoom(1);
    zoomRef.current = 1;
    pan.setValue({ x: 0, y: 0 });
    panOffset.current = { x: 0, y: 0 };
    setImgReady(false);
    setLoading(false);

    getNaturalSize(imageUri).then(size => {
      setImgSize(size);
      setImgReady(true);
    });
  }, [visible, imageUri]);

  const changeZoom = (delta) => {
    const newZ = Math.max(1, Math.min(5, zoom + delta));
    const clamped = clamp(panOffset.current.x, panOffset.current.y, newZ);
    panOffset.current = clamped;
    pan.setValue(clamped);
    zoomRef.current = newZ;
    setZoom(newZ);
  };

  const handleCrop = async () => {
    if (!imageUri || !imgSize.w) { onCrop(imageUri); return; }
    setLoading(true);
    try {
      const { w: natW, h: natH } = imgSize;
      const z = zoom;

      // What fraction of the original image is visible in the frame?
      const visW = natW / z;
      const visH = (natH / z) * (FRAME_H / FRAME_W) * (FRAME_W / FRAME_H);

      // Pan offset in image pixels
      const pxPerDisplayPx = natW / (FRAME_W * z);
      const offsetX = panOffset.current.x * pxPerDisplayPx;
      const offsetY = panOffset.current.y * pxPerDisplayPx;

      // Aspect ratio of frame in image space
      const frameAspect = FRAME_W / FRAME_H;        // 4/3
      const cropH_from_W = visW / frameAspect;

      const cropW = Math.round(Math.min(visW, natW));
      const cropH = Math.round(Math.min(cropH_from_W, natH));

      const originX = Math.round(
        Math.max(0, Math.min(natW - cropW, (natW - cropW) / 2 - offsetX)),
      );
      const originY = Math.round(
        Math.max(0, Math.min(natH - cropH, (natH - cropH) / 2 - offsetY)),
      );

      const result = await manipulateAsync(
        imageUri,
        [
          { crop: { originX, originY, width: cropW, height: cropH } },
          { resize: { width: 900 } },
        ],
        { compress: 0.82, format: SaveFormat.JPEG },
      );
      onCrop(result.uri);
    } catch (e) {
      console.warn('CropModal manipulateAsync error:', e);
      // Fallback: just resize without crop
      try {
        const res = await manipulateAsync(
          imageUri,
          [{ resize: { width: 900 } }],
          { compress: 0.82, format: SaveFormat.JPEG },
        );
        onCrop(res.uri);
      } catch {
        onCrop(imageUri);
      }
    }
    setLoading(false);
  };

  if (!visible) return null;

  const imgW = FRAME_W * zoom;
  const imgH = FRAME_H * zoom;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.card}>

          {/* Title */}
          <Text style={s.title}>✂️  Image Crop Karein</Text>
          <Text style={s.hint}>👆 Image ko drag karein • Zoom adjust karein</Text>

          {/* Crop frame */}
          <View style={[s.frame, { width: FRAME_W, height: FRAME_H }]}>
            {!imgReady ? (
              <ActivityIndicator color="#2563eb" size="large" />
            ) : (
              <Animated.View
                style={[s.pannable, {
                  width: imgW, height: imgH,
                  transform: [{ translateX: pan.x }, { translateY: pan.y }],
                }]}
                {...panResponder.panHandlers}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: imgW, height: imgH }}
                  resizeMode="cover"
                />
              </Animated.View>
            )}

            {/* Rule-of-thirds grid + corners */}
            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
              <View style={[s.gl, s.gh1]} /><View style={[s.gl, s.gh2]} />
              <View style={[s.gl, s.gv1]} /><View style={[s.gl, s.gv2]} />
              <View style={[s.co, s.coTL]} /><View style={[s.co, s.coTR]} />
              <View style={[s.co, s.coBL]} /><View style={[s.co, s.coBR]} />
            </View>
          </View>

          {/* Zoom row */}
          <View style={s.zRow}>
            <TouchableOpacity style={s.zBtn} onPress={() => changeZoom(-0.25)} disabled={zoom <= 1}>
              <Text style={[s.zBtnTxt, zoom <= 1 && s.dimmed]}>−</Text>
            </TouchableOpacity>

            <View style={s.track}>
              <View style={[s.fill, { width: `${((zoom - 1) / 4) * 100}%` }]} />
            </View>

            <Text style={s.zPct}>{Math.round(zoom * 100)}%</Text>

            <TouchableOpacity style={s.zBtn} onPress={() => changeZoom(0.25)} disabled={zoom >= 5}>
              <Text style={[s.zBtnTxt, zoom >= 5 && s.dimmed]}>＋</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.ratioPill}>4 : 3 ratio</Text>

          {/* Action buttons */}
          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnCancel} onPress={onCancel} disabled={loading}>
              <Text style={s.btnCancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnUse, loading && { opacity: 0.6 }]} onPress={handleCrop} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnUseTxt}>✅  Use Photo</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const BORDER = '#2563eb';
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 20, paddingTop: 22, paddingBottom: 22,
    alignItems: 'center', width: FRAME_W + 48, maxWidth: 430,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 12,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  hint:  { fontSize: 11, color: '#94a3b8', marginBottom: 14 },

  /* Crop preview */
  frame: {
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 2.5, borderColor: BORDER,
    backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  pannable: { position: 'absolute' },

  /* Grid */
  gl:  { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.22)' },
  gh1: { left: 0, right: 0, top: '33.3%', height: 1 },
  gh2: { left: 0, right: 0, top: '66.6%', height: 1 },
  gv1: { top: 0, bottom: 0, left: '33.3%', width: 1 },
  gv2: { top: 0, bottom: 0, left: '66.6%', width: 1 },

  /* Corner handles */
  co:   { position: 'absolute', width: 18, height: 18, borderColor: '#fff', borderWidth: 3 },
  coTL: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0 },
  coTR: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0 },
  coBL: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0 },
  coBR: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0 },

  /* Zoom */
  zRow:  { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  zBtn:  { width: 38, height: 38, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#bfdbfe' },
  zBtnTxt: { fontSize: 22, fontWeight: '700', color: BORDER, lineHeight: 26 },
  dimmed: { opacity: 0.3 },
  track: { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginHorizontal: 10, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: BORDER, borderRadius: 3 },
  zPct:  { fontSize: 12, fontWeight: '700', color: '#64748b', minWidth: 42, textAlign: 'right' },

  ratioPill: { fontSize: 11, color: '#94a3b8', marginBottom: 18 },

  /* Buttons */
  btnRow:      { flexDirection: 'row', gap: 10, width: '100%' },
  btnCancel:   { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  btnCancelTxt:{ fontSize: 14, fontWeight: '600', color: '#64748b' },
  btnUse:      { flex: 2, backgroundColor: BORDER, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: BORDER, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnUseTxt:   { fontSize: 14, fontWeight: '800', color: '#fff' },
});
