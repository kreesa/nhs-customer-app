import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Spacing, CommonStyles } from './theme';

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  blue: { bg: Colors.brandBg, color: Colors.brandDark },
  green: { bg: Colors.greenBg, color: Colors.green },
  amber: { bg: Colors.amberBg, color: Colors.amberText },
  red: { bg: Colors.redBg, color: Colors.red },
  gray: { bg: '#EBEBEB', color: '#555' },
};

export const Badge = ({ label, variant = 'gray' }: BadgeProps) => {
  const style = badgeStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.color }]}>{label}</Text>
    </View>
  );
};

// ─── PrimaryButton ────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'outline' | 'danger';
  icon?: React.ReactNode;
}

export const AppButton = ({
  label, onPress, loading, disabled, style, variant = 'primary', icon,
}: ButtonProps) => {
  const btnStyle = variant === 'primary'
    ? CommonStyles.btnPrimary
    : variant === 'outline'
    ? CommonStyles.btnOutline
    : CommonStyles.btnDanger;

  const textStyle = variant === 'primary'
    ? CommonStyles.btnPrimaryText
    : variant === 'outline'
    ? CommonStyles.btnOutlineText
    : CommonStyles.btnDangerText;

  return (
    <TouchableOpacity
      style={[btnStyle, (disabled || loading) && { opacity: 0.6 }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.brand} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {icon}
          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  label?: string;
}

export const Card = ({ children, style, label }: CardProps) => (
  <View style={[CommonStyles.card, style]}>
    {label && <Text style={CommonStyles.cardLabel}>{label}</Text>}
    {children}
  </View>
);

// ─── Row KV ───────────────────────────────────────────────────────────────────
interface RowKVProps {
  label: string;
  value: string;
  last?: boolean;
  valueStyle?: TextStyle;
}

export const RowKV = ({ label, value, last, valueStyle }: RowKVProps) => (
  <View style={[CommonStyles.rowKV, last && { borderBottomWidth: 0 }]}>
    <Text style={CommonStyles.rowK}>{label}</Text>
    <Text style={[CommonStyles.rowV, valueStyle]}>{value}</Text>
  </View>
);

// ─── Section Divider ──────────────────────────────────────────────────────────
export const Divider = () => <View style={CommonStyles.divider} />;

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  initials: string;
  size?: number;
}

export const Avatar = ({ initials, size = 44 }: AvatarProps) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials}</Text>
  </View>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────
interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'lg';
}

export const StarRating = ({ value, onChange, size = 'sm' }: StarRatingProps) => {
  const starSize = size === 'lg' ? 32 : 15;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange?.(star)}
          disabled={!onChange}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: starSize, color: star <= value ? Colors.amber : Colors.borderMd }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Loading Screen ───────────────────────────────────────────────────────────
export const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => (
  <View style={[CommonStyles.screen, CommonStyles.center]}>
    <ActivityIndicator size="large" color={Colors.brand} />
    <Text style={{ marginTop: 12, color: Colors.text2, fontSize: 14 }}>{message}</Text>
  </View>
);

// ─── Error State ──────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <View style={[CommonStyles.screen, CommonStyles.center, { padding: Spacing.xl }]}>
    <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
    <Text style={{ fontSize: 14, color: Colors.text2, textAlign: 'center', marginBottom: 20 }}>
      {message}
    </Text>
    {onRetry && (
      <TouchableOpacity
        onPress={onRetry}
        style={[CommonStyles.btnPrimary, { paddingHorizontal: 32 }]}
      >
        <Text style={CommonStyles.btnPrimaryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Invoice Total Box ────────────────────────────────────────────────────────
interface InvTotalProps {
  label: string;
  amount: number;
  currency?: string;
}

export const InvoiceTotal = ({ label, amount, currency = 'NPR' }: InvTotalProps) => (
  <View style={styles.invTotal}>
    <Text style={styles.invTotalLabel}>{label}</Text>
    <Text style={styles.invTotalVal}>{currency} {amount.toLocaleString()}</Text>
  </View>
);

// ─── Topbar ───────────────────────────────────────────────────────────────────
interface TopbarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const Topbar = ({ title, subtitle, onBack, right }: TopbarProps) => (
  <View style={CommonStyles.topbar}>
    {onBack && (
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Text style={{ color: Colors.white, fontSize: 20 }}>‹</Text>
      </TouchableOpacity>
    )}
    <View style={{ flex: 1 }}>
      {subtitle && <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{subtitle}</Text>}
      <Text style={CommonStyles.topbarTitle}>{title}</Text>
    </View>
    {right}
  </View>
);

// ─── PageHeader ───────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  onBack,
  right,
}: PageHeaderProps) => (
  <View style={styles.pageHeader}>
    <View style={styles.pageHeaderLeft}>
      {onBack && (
        <TouchableOpacity
          style={styles.pageBackBtn}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.pageBackIcon}>‹</Text>
        </TouchableOpacity>
      )}

      <View style={styles.pageTitleWrap}>
        {subtitle ? (
          <Text style={styles.pageSubtitle}>{subtitle}</Text>
        ) : null}

        <Text style={styles.pageTitle}>{title}</Text>
      </View>
    </View>

    {right}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  avatar: {
    backgroundColor: Colors.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '600',
    color: Colors.brandDark,
  },
  invTotal: {
    backgroundColor: Colors.brandBg,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  invTotalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.brandDark,
  },
  invTotalVal: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brandDark,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  // PageHeader
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  pageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  pageBackBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  pageBackIcon: {
    fontSize: 26,
    color: Colors.text,
    lineHeight: 24,
    fontWeight: "600",
  },

  pageTitleWrap: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },

  pageSubtitle: {
    fontSize: 10,
    color: Colors.text3,
    marginBottom: 1,
  },
});
