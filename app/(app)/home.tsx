import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, CommonStyles, Radius, Spacing } from '../src/components/theme';
import { Badge, Card } from '../src/components/ui';
import { useAuth, AuthProvider } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { categoryApi, serviceApi } from '../src/services/api';
import { ServiceRequest } from '../types';

function getGreeting(): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'goodMorning';
  if (h < 17) return 'goodAfternoon';
  return 'goodEvening';
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'Completed': return 'green';
    case 'Technician Assigned': return 'blue';
    case 'Work In Progress': return 'blue';
    case 'On Hold': return 'gray';
    default: return 'amber';
  }
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [recentJobs, setRecentJobs] = useState<ServiceRequest[]>([]);
  const [activeJob, setActiveJob] = useState<ServiceRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  //dynamic Category Cards
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errorCategories, setErrorCategories] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        setErrorCategories("");

        const res = await categoryApi.getCategories();

        console.log("CATEGORY API RAW:", res);

        const list =
          Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.categories)
            ? res.categories
            : [];

        setCategories(list);
      } catch (err) {
        console.log("CATEGORY ERROR:", err);
        setCategories([]);
        setErrorCategories("Failed to load services");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);


  const initials = user?.full_name
    ?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U';

  const loadData = useCallback(async () => {
    try {
      const jobs = await serviceApi.getMyRequests();
      const active = jobs.find(
        (j) => j.service_status !== 'Completed' && j.service_status !== 'On Hold'
      ) ?? null;
      setActiveJob(active);
      setRecentJobs(jobs.slice(0, 5));
    } catch (e) {
      // Silently fail — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleNotification = () => Alert.alert(t('appName'), 'No new notifications');

  return (
    <View style={CommonStyles.screen}>
      {/* Topbar */}
      <View style={[CommonStyles.topbar, { height: 60 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t(getGreeting())}</Text>
          <Text style={CommonStyles.topbarTitle}>{user?.full_name ?? ''}</Text>
        </View>
        <TouchableOpacity onPress={handleNotification} style={{ position: 'relative' }}>
          <Text style={{ fontSize: 22, color: Colors.white }}>🔔</Text>
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
      >
        {/* Active Job Banner */}
        {activeJob ? (
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>{t('activeJob')}</Text>
            <Text style={styles.heroTitle}>
              {activeJob.service_category} — {activeJob.problem_description?.slice(0, 30)}
            </Text>
            <View style={styles.heroRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{activeJob.service_status}</Text>
              </View>
              {activeJob.service_status === 'Technician Assigned' && (
                <Text style={styles.heroEta}>{t('etaMinutes', { minutes: 12 })}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() =>  router.push({
                pathname: "/track",
                params: { serviceId: activeJob.id },
              })}
            >
              <Text style={styles.heroBtnText}>📍 {t('trackTechnician')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.hero, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🏠</Text>
            <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 15 }}>
              {t('noActiveJob')}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
              {t('tagline')}
            </Text>
          </View>
        )}

        {/* Service Categories */}
        <Card label={t('requestService')} style={styles.card}>
          <View style={styles.serviceGrid}>

            {loadingCategories && (
              <Text>Loading services...</Text>
            )}

            {errorCategories !== "" && (
              <Text style={{ color: "red" }}>{errorCategories}</Text>
            )}

            {!loadingCategories && categories.length === 0 && (
              <Text>No services available</Text>
            )}

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.cleanTile}
                onPress={() =>
                  router.push({
                    pathname: "/request",
                    params: { categoryId: cat.id },
                  })
                }
              >
                <Text style={styles.cleanTileText}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}

          </View>
        </Card>

        {/* Recent Jobs */}
        <Card label={t('recentJobs')} style={styles.card}>
          {recentJobs.length === 0 ? (
            <Text style={{ color: Colors.text3, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
              {t('noJobsYet')}
            </Text>
          ) : (
            recentJobs.map((job, i) => (
              <TouchableOpacity
                key={job.id}
                style={[styles.histItem, i === recentJobs.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() =>  router.push({
                  pathname: "/track",
                  params: { serviceId: job.id },
                })}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text }}>
                    {job.service_category} — {job.problem_description?.slice(0, 28)}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.text3, marginTop: 2 }}>
                    {job.requested_date}
                  </Text>
                </View>
                <Badge
                  label={job.service_status === 'Completed' ? t('statusCompleted') : job.service_status}
                  variant={getStatusBadgeVariant(job.service_status)}
                />
              </TouchableOpacity>
            ))
          )}
        </Card>

        {/* Quick Actions */}
        <Card label={t('quickActions')} style={styles.card}>
          {[
            {
              icon: '👤', bg: Colors.brandBg, color: Colors.brand,
              title: t('myProfile'), sub: t('addressPreferences'),
              onPress: () => router.push("/profile"),
            },
            {
              icon: '🧾', bg: Colors.greenBg, color: Colors.green,
              title: t('invoicesPayments'), sub: t('viewTransactions'),
              onPress: () => router.push({
                pathname: "/home",   //to be updated with payment details
              }),
            },
          ].map(({ icon, bg, color, title, sub, onPress }) => (
            <TouchableOpacity key={title} style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
              <View style={[styles.quickIcon, { backgroundColor: bg }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.text }}>{title}</Text>
                <Text style={{ fontSize: 11, color: Colors.text3, marginTop: 1 }}>{sub}</Text>
              </View>
              <Text style={{ color: Colors.text3, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 90, gap: 12 },
  card: { marginBottom: 0 },
  hero: {
    background: undefined,
    backgroundColor: Colors.brand,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  heroTitle: { fontSize: 16, fontWeight: '600', color: Colors.white, marginBottom: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  heroBadgeText: { fontSize: 12, fontWeight: '500', color: Colors.white },
  heroEta: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroBtn: { backgroundColor: Colors.white, borderRadius: Radius.md, paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start' },
  heroBtnText: { fontSize: 13, fontWeight: '600', color: Colors.brandDark },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceTile: {
    width: '48%', borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 8,
    backgroundColor: Colors.cardBg,
  },
  serviceTileLabel: { fontSize: 12, fontWeight: '600', color: Colors.text },
  histItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.red,
    position: 'absolute', top: 0, right: 0,
  },

  cleanTile: {
    width: "48%",
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
    alignItems: "center",
  },

  cleanTileText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
});
