import { StyleSheet } from 'react-native';

// ─── Color Palette ────────────────────────────────────────────────────────────
export const Colors = {
  brand: '#185FA5',
  brandDark: '#0C447C',
  brandBg: '#E6F1FB',
  brandMid: '#378ADD',
  amber: '#BA7517',
  amberBg: '#FAEEDA',
  amberText: '#633806',
  green: '#3B6D11',
  greenBg: '#EAF3DE',
  red: '#A32D2D',
  redBg: '#FCEBEB',
  pageBg: '#F2F2EF',
  cardBg: '#FFFFFF',
  border: 'rgba(0,0,0,0.09)',
  borderMd: 'rgba(0,0,0,0.14)',
  text: '#181818',
  text2: '#5C5C5C',
  text3: '#9A9A9A',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  h1: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  h2: { fontSize: 18, fontWeight: '600' as const, color: Colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  h4: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.text },
  bodyMd: { fontSize: 14, fontWeight: '500' as const, color: Colors.text },
  small: { fontSize: 12, fontWeight: '400' as const, color: Colors.text2 },
  smallMd: { fontSize: 12, fontWeight: '500' as const, color: Colors.text2 },
  label: { fontSize: 11, fontWeight: '600' as const, color: Colors.text3, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  micro: { fontSize: 10, fontWeight: '500' as const, color: Colors.text3 },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ─── Common Styles ────────────────────────────────────────────────────────────
export const CommonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },
  topbar: {
    backgroundColor: Colors.brandDark,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  topbarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: Colors.brand,
    borderRadius: Radius.lg,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: Colors.brand,
    fontSize: 15,
    fontWeight: '600',
  },
  btnDanger: {
    borderWidth: 1.5,
    borderColor: Colors.red,
    borderRadius: Radius.lg,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerText: {
    color: Colors.red,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderMd,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: Colors.pageBg,
    color: Colors.text,
    height: 44,
  },
  inputFocused: {
    borderColor: Colors.brand,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text2,
    marginBottom: 5,
  },
  rowKV: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  rowK: { fontSize: 13, color: Colors.text2 },
  rowV: { fontSize: 13, fontWeight: '500', color: Colors.text },
  divider: { height: 0.5, backgroundColor: Colors.border, marginVertical: 12 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
});
